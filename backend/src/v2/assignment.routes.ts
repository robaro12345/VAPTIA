import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { prisma } from '../services/prisma';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { getUploadsDir } from '../services/storage';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

// VULNERABILITY 5 REMEDIATION: HARDENED FILE UPLOAD CONFIGURATION
// 1. Strict extension allowlist
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);
// 2. Strict MIME allowlist
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);
// 3. File size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const v2Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (req, file, cb) => {
    // 4. Secure randomized filename: Prevents path traversal and filename manipulation
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeName = `sub_${Date.now()}_${randomHex}${ext}`;
    cb(null, safeName);
  },
});

const v2Upload = multer({
  storage: v2Storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Check extension
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Invalid file type. Only .pdf, .docx, and .txt files are allowed.'));
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Invalid file MIME type. Only PDF, Word Documents, and Plain Text are accepted.'));
    }

    cb(null, true);
  },
});

// Helper for magic bytes verification
function verifyFileSignature(filePath: string, ext: string): boolean {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    if (ext === '.pdf') {
      // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
      return buffer.toString('utf-8', 0, 4) === '%PDF';
    }
    if (ext === '.docx') {
      // ZIP/DOCX magic bytes: PK\x03\x04 (0x50 0x4B 0x03 0x04)
      return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    }
    if (ext === '.txt') {
      // Plain text: verify no null bytes / binary control codes
      return !buffer.includes(0x00);
    }
    return false;
  } catch {
    return false;
  }
}

// List all assignments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } },
      },
    });
    return res.json(assignments);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve assignments' });
  }
});

// Create assignment (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Title and description are required strings' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description.trim(),
      },
    });

    logSecurityEvent('AUDIT', `V2 Admin created assignment ${assignment.id}`, { title: assignment.title });
    return res.status(201).json(assignment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get single assignment
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        submissions: {
          include: {
            student: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    return res.json(assignment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve assignment' });
  }
});

// Get submissions for an assignment
router.get('/:id/submissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    let whereClause: any = { assignmentId };
    if (req.user!.role !== 'ADMIN') {
      const student = await prisma.student.findFirst({ where: { userId: req.user!.id } });
      if (!student) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      whereClause.studentId = student.id;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        assignment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(submissions);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
});

// VULNERABILITY 5 REMEDIATION: SECURE ASSIGNMENT SUBMISSION
// Endpoint: POST /api/v2/assignments/:id/submission
router.post(
  '/:id/submission',
  authenticateToken,
  v2Upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      if (isNaN(assignmentId)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid assignment ID' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or file rejected by security policy' });
      }

      // Verify assignment exists
      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
      if (!assignment) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // 5. Deep File Signature Verification
      const ext = path.extname(req.file.originalname).toLowerCase();
      const validSignature = verifyFileSignature(req.file.path, ext);
      if (!validSignature) {
        fs.unlinkSync(req.file.path);
        logSecurityEvent('UPLOAD', `V2 Spoofed file signature rejected: ${req.file.originalname}`, {
          userId: req.user!.id,
        });
        return res.status(400).json({
          error: 'File signature does not match claimed file format. Upload rejected.',
        });
      }

      // 6. Strict Student Ownership Check
      let student = await prisma.student.findFirst({ where: { userId: req.user!.id } });
      if (!student && req.user!.role === 'ADMIN') {
        student = await prisma.student.findFirst();
      }

      if (!student) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Only registered students may submit assignments' });
      }

      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: student.id,
          // Store sanitized safe original name for display, random name for disk storage
          filename: path.basename(req.file.originalname),
          filepath: req.file.path,
        },
        include: {
          assignment: true,
          student: { include: { user: true } },
        },
      });

      logSecurityEvent('UPLOAD', `V2 Secure File Upload Verified: ${submission.filename}`, {
        userId: req.user!.id,
        storedPath: req.file.filename,
        size: req.file.size,
      });

      return res.status(201).json({
        message: 'Assignment submitted successfully (V2 Hardened)',
        submission: {
          id: submission.id,
          assignmentId: submission.assignmentId,
          filename: submission.filename,
          createdAt: submission.createdAt,
        },
      });
    } catch (error: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Assignment submission failed' });
    }
  }
);

// Secure read-only download of uploaded submission (no execution capability)
router.get('/uploads/:filename', authenticateToken, (req: Request, res: Response) => {
  try {
    const rawFilename = req.params.filename;
    // Reject path traversal characters
    if (rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const uploadsDir = path.resolve(getUploadsDir());
    const safeFilename = path.basename(rawFilename);
    const targetPath = path.resolve(uploadsDir, safeFilename);

    if (!targetPath.startsWith(uploadsDir) || !fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Force download headers to prevent inline browser execution
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(targetPath);
  } catch (error: any) {
    return res.status(500).json({ error: 'File download failed' });
  }
});

export default router;
