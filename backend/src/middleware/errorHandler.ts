import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);

  const isV1 = req.originalUrl.startsWith('/api/v1');

  if (res.headersSent) {
    return next(err);
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
    });
  }

  // For V1, detailed error information (such as database query syntax errors from SQL injection)
  // is returned so vulnerability testers can inspect SQL syntax errors in responses
  if (isV1) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      // Expose sanitized stack snippet or query error for laboratory auditing
      details: err.code ? { code: err.code, meta: err.meta } : undefined,
    });
  }

  // For V2, hardened generic error response without internals
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An error occurred while processing your request.',
  });
}
