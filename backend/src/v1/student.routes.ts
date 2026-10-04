import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

// List all students
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    return res.json(students);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to list students', message: error.message });
  }
});

// VULNERABILITY 1: SQL INJECTION (Raw Query String Interpolation)
// Endpoint: GET /api/v1/students/search?name=...
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string) || '';

    logSecurityEvent('AUDIT', `V1 Student Search executed query: name=${name}`);

    // Insecure: Raw SQL string concatenation executed directly against PostgreSQL
    const rawSql = `SELECT s.id, s."rollNumber", s.course, s.year, s."createdAt", u.name, u.email 
                    FROM "Student" s 
                    JOIN "User" u ON s."userId" = u.id 
                    WHERE u.name ILIKE '%${name}%'`;

    const results = await prisma.$queryRawUnsafe(rawSql);
    return res.json(results);
  } catch (error: any) {
    // In V1, expose database error details to aid in SQL injection laboratory testing
    return res.status(500).json({
      error: 'Database query execution error',
      message: error.message,
      code: error.code,
    });
  }
});

// Get current student's own profile helper
router.get('/profile/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        submissions: {
          include: { assignment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found for this user' });
    }

    return res.json(student);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load profile', message: error.message });
  }
});

// VULNERABILITY 2: IDOR / BROKEN OBJECT-LEVEL AUTHORIZATION
// Endpoint: GET /api/v1/students/:id
// Insecure: Fails to verify that req.user is an ADMIN or that student.userId === req.user.id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID parameter' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
        submissions: {
          include: { assignment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Insecure: No ownership check! Student A can read Student B's profile simply by changing :id
    logSecurityEvent('AUTHZ', `V1 IDOR Profile read: User ${req.user!.id} accessed Student ${studentId}`);

    return res.json(student);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch student profile', message: error.message });
  }
});

export default router;
