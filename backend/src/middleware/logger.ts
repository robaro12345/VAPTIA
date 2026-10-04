import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userPart = req.user ? `[User:${req.user.id}|${req.user.role}]` : '[Anon]';
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} ${status} ${duration}ms ${userPart} - ${ip}`
    );
  });

  next();
}

export function logSecurityEvent(
  category: 'AUTH' | 'AUTHZ' | 'UPLOAD' | 'DOWNLOAD' | 'AUDIT',
  message: string,
  meta?: Record<string, any>
) {
  const sanitizedMeta = meta ? { ...meta } : {};
  // Strictly prevent logging sensitive credential fields
  delete sanitizedMeta.password;
  delete sanitizedMeta.passwordHash;
  delete sanitizedMeta.token;
  delete sanitizedMeta.secret;

  console.log(
    `[SECURITY_AUDIT] [${new Date().toISOString()}] [${category}] ${message} ${
      Object.keys(sanitizedMeta).length ? JSON.stringify(sanitizedMeta) : ''
    }`
  );
}
