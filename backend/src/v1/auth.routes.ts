import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
import { authenticateToken, AuthUser } from '../middleware/auth.middleware';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campushub_lab_jwt_super_secret_key_v1_lab';

// Register student
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, rollNumber, course, year } = req.body;

    if (!name || !email || !password || !rollNumber) {
      return res.status(400).json({ error: 'Name, email, password, and rollNumber are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return res.status(400).json({ error: 'Student with this roll number already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        student: {
          create: {
            rollNumber,
            course: course || 'General Engineering',
            year: parseInt(year, 10) || 1,
          },
        },
      },
      include: {
        student: true,
      },
    });

    const tokenPayload: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      studentId: newUser.student?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    logSecurityEvent('AUTH', `Registered new student: ${newUser.email}`, { userId: newUser.id });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: tokenPayload,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true },
    });

    if (!user) {
      logSecurityEvent('AUTH', `Failed login attempt for non-existent user: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      logSecurityEvent('AUTH', `Failed login attempt (wrong password) for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokenPayload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    logSecurityEvent('AUTH', `Successful login: ${user.email} (${user.role})`, {
      userId: user.id,
      role: user.role,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: tokenPayload,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

// Current User Profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        student: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student: user.student,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile', message: error.message });
  }
});

export default router;
