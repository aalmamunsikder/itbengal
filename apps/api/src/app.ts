/**
 * Express application factory.
 * Configures the middleware pipeline and mounts API routes.
 * Exported separately from the server so tests can import the app without starting HTTP.
 * @module app
 */

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { corsConfig } from './config/cors.js';
import { globalErrorHandler, NotFoundError } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import v1Routes from './routes/v1/index.js';

// ---------------------------------------------------------------------------
// Create Express app
// ---------------------------------------------------------------------------

const app = express();

// ---------------------------------------------------------------------------
// Middleware pipeline (order matters)
// ---------------------------------------------------------------------------

// 1. Security headers (Strict-Transport-Security, X-Content-Type-Options, etc.)
app.use(helmet());

// 2. Response compression (gzip / brotli)
app.use(compression());

// 3. CORS — allow cross-origin requests from dashboard & admin
app.use(cors(corsConfig));

// 4. Cookie parser — makes req.cookies available
app.use(cookieParser());

// 5. JSON body parser — 10 MB limit for payloads like deployment configs
app.use(express.json({ limit: '10mb' }));

// 6. URL-encoded body parser — form submissions
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Request logger — log method, path, status, duration
app.use(requestLogger);

// 8. Request ID — attach UUID v4 to every request
app.use(requestId);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// API v1 routes
app.use('/api/v1', v1Routes);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

// 404 handler — catches any request that didn't match a route
app.use((_req, _res, next) => {
  next(new NotFoundError('The requested resource was not found'));
});

// Global error handler — must be last middleware
app.use(globalErrorHandler);

export { app };
