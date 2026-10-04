import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
import { authenticateToken, AuthUser } from '../middleware/auth.middleware';
import { logSecurityEvent } from '../middleware/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campushub_lab_jwt_super_secret_key_v2_hardened_production';

// Register student (Hardened with strict validation)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, rollNumber, course, year } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Valid student name is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!rollNumber || typeof rollNumber !== 'string') {
      return res.status(400).json({ error: 'Roll number is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return res.status(409).json({ error: 'A student with this roll number already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'STUDENT',
        student: {
          create: {
            rollNumber: rollNumber.trim().toUpperCase(),
            course: (course || 'General Engineering').trim(),
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

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    logSecurityEvent('AUTH', `V2 Secure Registration: ${newUser.email}`, { userId: newUser.id });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: tokenPayload,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Registration failed' });
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
      where: { email: email.toLowerCase().trim() },
      include: { student: true },
    });

    if (!user) {
      logSecurityEvent('AUTH', `V2 Failed login attempt for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      logSecurityEvent('AUTH', `V2 Invalid password attempt for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.student?.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    logSecurityEvent('AUTH', `V2 Successful login: ${user.email}`, {
      userId: user.id,
      role: user.role,
    });

    return res.json({
      message: 'Login successful',
      token,
      user: tokenPayload,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Login failed' });
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
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

export default router;
