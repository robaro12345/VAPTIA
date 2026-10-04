import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

// List all feedback
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(feedbacks);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve feedback', message: error.message });
  }
});

// VULNERABILITY 3: STORED CROSS-SITE SCRIPTING (XSS)
// Endpoint: POST /api/v1/feedback
// Insecure: Stores raw HTML/JavaScript markup in the database without sanitization or escaping
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback content cannot be empty' });
    }

    // Insecure: Storing unsanitized HTML/JS payloads directly into PostgreSQL
    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        content: content, // Unescaped raw input stored
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    logSecurityEvent('AUDIT', `V1 Feedback submitted with raw content length ${content.length}`, {
      userId: req.user!.id,
      preview: content.slice(0, 50),
    });

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to submit feedback', message: error.message });
  }
});

export default router;
