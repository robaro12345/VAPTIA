import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load root environment if not loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import v1Routes from './v1';
import v2Routes from './v2';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from frontend origin or curl/testing tools without origin header
      if (!origin || origin === corsOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for lab testing
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeVersion: process.env.APP_VERSION || 'v1',
  });
});

// Explicit API Version Mounts
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Automatic API version fallback when requested at /api/* without version prefix
const defaultVersion = (process.env.APP_VERSION || 'v1').toLowerCase();
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1') || req.path.startsWith('/v2')) {
    return next();
  }
  // Rewrite URL to active version
  req.url = `/${defaultVersion}${req.url}`;
  if (defaultVersion === 'v2') {
    return v2Routes(req, res, next);
  }
  return v1Routes(req, res, next);
});

// Centralized error handling
app.use(errorHandler);

export default app;
