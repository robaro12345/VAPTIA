import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { prisma } from '../services/prisma';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { getDocumentsDir } from '../services/storage';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getDocumentsDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});
const upload = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// List all documents
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(documents);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// Admin upload document
router.post(
  '/upload',
  authenticateToken,
  requireRole('ADMIN'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!req.file) {
        return res.status(400).json({ error: 'Document file is required' });
      }

      const doc = await prisma.document.create({
        data: {
          name: typeof name === 'string' && name.trim() ? name.trim() : path.basename(req.file.originalname),
          filepath: req.file.filename,
          uploadedBy: req.user!.id,
        },
      });

      logSecurityEvent('UPLOAD', `V2 Admin uploaded document: ${doc.name}`, { docId: doc.id });
      return res.status(201).json(doc);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// VULNERABILITY 4 REMEDIATION: SECURE PATH RESOLUTION & CONTAINMENT
// Endpoint: GET /api/v2/documents/:filename
// Remediated: Canonicalizes paths, validates directory containment, rejects traversal sequences
router.get('/:filename', authenticateToken, (req: Request, res: Response) => {
  try {
    const rawFilename = req.params.filename;

    // 1. Strict traversal pattern detection
    if (
      !rawFilename ||
      rawFilename.includes('..') ||
      rawFilename.includes('/') ||
      rawFilename.includes('\\') ||
      rawFilename.includes('\0')
    ) {
      logSecurityEvent('DOWNLOAD', `V2 Traversal attempt blocked: ${rawFilename}`, {
        userId: req.user!.id,
      });
      return res.status(400).json({
        error: 'Invalid filename: Path traversal patterns are prohibited',
      });
    }

    const documentsDir = path.resolve(getDocumentsDir());
    const safeFilename = path.basename(rawFilename);
    const resolvedPath = path.resolve(documentsDir, safeFilename);

    // 2. Canonical directory boundary containment check
    if (!resolvedPath.startsWith(documentsDir)) {
      logSecurityEvent('DOWNLOAD', `V2 Directory escape attempt blocked: ${rawFilename}`, {
        userId: req.user!.id,
        resolvedPath,
      });
      return res.status(403).json({
        error: 'Forbidden: Access denied to files outside the document repository',
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Secure headers to prevent MIME confusion or script execution
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return res.sendFile(resolvedPath);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error downloading document' });
  }
});

export default router;
