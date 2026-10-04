import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { prisma } from '../services/prisma';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { getUploadsDir } from '../services/storage';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

// Insecure V1 Multer storage: retains original user filename and accepts any extension
const v1Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (req, file, cb) => {
    // Insecure: User-controlled filename without sanitization
    cb(null, file.originalname);
  },
});

// V1 Insecure Upload: No fileFilter, no MIME check, no size limit
const v1Upload = multer({ storage: v1Storage });

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
    return res.status(500).json({ error: 'Failed to retrieve assignments', message: error.message });
  }
});

// Create assignment (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const assignment = await prisma.assignment.create({
      data: { title, description },
    });

    logSecurityEvent('AUDIT', `Admin created assignment ID ${assignment.id}: ${title}`);
    return res.status(201).json(assignment);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create assignment', message: error.message });
  }
});

// Get single assignment
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
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
    return res.status(500).json({ error: 'Failed to retrieve assignment', message: error.message });
  }
});

// Get submissions for an assignment
router.get('/:id/submissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);

    let whereClause: any = { assignmentId };
    if (req.user!.role !== 'ADMIN') {
      // If student, filter by student ID
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
    return res.status(500).json({ error: 'Failed to retrieve submissions', message: error.message });
  }
});

// VULNERABILITY 5: UNRESTRICTED FILE UPLOAD
// Endpoint: POST /api/v1/assignments/:id/submission
// Insecure: Accepts arbitrary extensions, unsanitized filenames, lack of MIME validation
router.post(
  '/:id/submission',
  authenticateToken,
  v1Upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Find student record
      let student = await prisma.student.findFirst({ where: { userId: req.user!.id } });
      if (!student && req.user!.role === 'ADMIN') {
        // Fallback for admin testing
        student = await prisma.student.findFirst();
      }

      if (!student) {
        return res.status(400).json({ error: 'Student profile required to submit assignment' });
      }

      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: student.id,
          filename: req.file.originalname,
          filepath: req.file.path,
        },
        include: {
          assignment: true,
          student: { include: { user: true } },
        },
      });

      logSecurityEvent('UPLOAD', `V1 Unrestricted File Upload: ${req.file.originalname}`, {
        userId: req.user!.id,
        size: req.file.size,
        path: req.file.path,
      });

      return res.status(201).json({
        message: 'Assignment submitted successfully (V1 vulnerable)',
        submission,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Submission failed', message: error.message });
    }
  }
);

// Controlled server-side demonstration endpoint for uploaded files
// Demonstrates execution of uploaded scripts inside the isolated container
router.post('/submissions/:submissionId/execute', authenticateToken, async (req: Request, res: Response) => {
  try {
    const submissionId = parseInt(req.params.submissionId, 10);
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const filePath = submission.filepath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File does not exist on disk' });
    }

    const ext = path.extname(filePath).toLowerCase();

    // Controlled container demonstration: if script, execute in isolated container
    if (ext === '.js') {
      exec(`node "${filePath}"`, { timeout: 5000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        return res.json({
          status: 'executed',
          interpreter: 'node',
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : ''),
        });
      });
    } else if (ext === '.sh') {
      exec(`sh "${filePath}"`, { timeout: 5000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        return res.json({
          status: 'executed',
          interpreter: 'sh',
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : ''),
        });
      });
    } else {
      return res.status(400).json({
        error: 'Execution only supported for executable script extensions (.js, .sh) in V1 lab environment',
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Execution error', message: error.message });
  }
});

// View / download an uploaded file
router.get('/uploads/:filename', authenticateToken, (req: Request, res: Response) => {
  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, req.params.filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'File not found' });
});

export default router;
