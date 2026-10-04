import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import assignmentRoutes from './assignment.routes';
import documentRoutes from './document.routes';
import feedbackRoutes from './feedback.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/documents', documentRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
