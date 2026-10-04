import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

// HTML Entity encode helper to prevent stored markup interpretation
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    return res.status(500).json({ error: 'Failed to retrieve feedback' });
  }
});

// VULNERABILITY 3 REMEDIATION: STORED XSS MITIGATION
// Endpoint: POST /api/v2/feedback
// Remediated: Input validation, length bounding, HTML escaping, treating user input strictly as text
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Feedback content must be a valid text string' });
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'Feedback content cannot be empty' });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({ error: 'Feedback content must not exceed 1000 characters' });
    }

    // Sanitize by escaping any dangerous HTML entities before database persistence
    const sanitizedContent = escapeHtml(trimmed);

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        content: sanitizedContent,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    logSecurityEvent('AUDIT', `V2 Feedback saved securely from User ${req.user!.id}`);

    return res.status(201).json({
      message: 'Feedback submitted successfully (V2 Hardened)',
      feedback,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
