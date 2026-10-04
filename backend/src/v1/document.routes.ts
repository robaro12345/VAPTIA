import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
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
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: docStorage });

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
    return res.status(500).json({ error: 'Failed to retrieve documents', message: error.message });
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
          name: name || req.file.originalname,
          filepath: req.file.originalname,
          uploadedBy: req.user!.id,
        },
      });

      logSecurityEvent('UPLOAD', `Admin uploaded document: ${doc.name} (${doc.filepath})`);
      return res.status(201).json(doc);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload document', message: error.message });
    }
  }
);

// VULNERABILITY 4: PATH TRAVERSAL
// Endpoint: GET /api/v1/documents/:filename
// Insecure: Uses path.join without canonical path containment check.
// Allows traversing out of storage/documents to fetch /app/storage/lab_flag.txt or container files.
router.get('/:filename', authenticateToken, (req: Request, res: Response) => {
  try {
    const documentsDir = getDocumentsDir();
    // Vulnerable: path.join resolves relative dot-dot components without validating boundaries
    const requestedFilename = req.params.filename;
    const resolvedPath = path.join(documentsDir, requestedFilename);

    logSecurityEvent('DOWNLOAD', `V1 Document fetch requested: ${requestedFilename}`, {
      rawInput: requestedFilename,
      resolvedPath,
    });

    if (fs.existsSync(resolvedPath)) {
      // Insecure: sendFile directly serves file outside documents directory
      return res.sendFile(resolvedPath);
    }

    return res.status(404).json({
      error: 'Document not found',
      requestedPath: requestedFilename,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error downloading document', message: error.message });
  }
});

export default router;
