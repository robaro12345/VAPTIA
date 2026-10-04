import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();

// List all students (Admin can view all, or students can view safe directory)
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
    return res.status(500).json({ error: 'Failed to list students' });
  }
});

// VULNERABILITY 1 REMEDIATION: PARAMETERIZED SAFE SEARCH
// Endpoint: GET /api/v2/students/search?name=...
// Remediated: Uses Prisma's parameterized queries with type validation to prevent SQL Injection
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const nameParam = req.query.name;
    const name = typeof nameParam === 'string' ? nameParam.trim() : '';

    // Safe Prisma Query: Parameterized under the hood, completely immune to SQL injection
    const results = await prisma.student.findMany({
      where: name
        ? {
            user: {
              name: {
                contains: name,
                mode: 'insensitive',
              },
            },
          }
        : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    logSecurityEvent('AUDIT', `V2 Safe student search executed: term length ${name.length}`);

    // Flatten representation for consistency
    const formatted = results.map((s) => ({
      id: s.id,
      rollNumber: s.rollNumber,
      course: s.course,
      year: s.year,
      createdAt: s.createdAt,
      name: s.user.name,
      email: s.user.email,
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: 'Search failed' });
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
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

// VULNERABILITY 2 REMEDIATION: OBJECT-LEVEL AUTHORIZATION ENFORCEMENT (IDOR FIXED)
// Endpoint: GET /api/v2/students/:id
// Remediated: The backend strictly enforces that users can only access their own profile
// unless they possess the ADMIN role.
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

    // AUTHORIZATION BOUNDARY:
    // If requester is not an ADMIN and the profile doesn't belong to the requesting user, deny access!
    if (req.user!.role !== 'ADMIN' && student.userId !== req.user!.id) {
      logSecurityEvent(
        'AUTHZ',
        `V2 Authorization blocked: User ${req.user!.id} (${req.user!.role}) attempted to view Student ${studentId} (Owner: User ${student.userId})`
      );
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to access another student\'s profile',
      });
    }

    return res.json(student);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

export default router;
