/**
 * CORS configuration.
 * Defines allowed origins, methods, and headers for cross-origin requests.
 * @module config/cors
 */

import type { CorsOptions } from 'cors';

import { appConfig } from './app.js';

/**
 * Builds the CORS origin whitelist from configured URLs.
 * Includes localhost variants for development convenience.
 */
function buildOriginWhitelist(): string[] {
  const origins = new Set<string>([
    appConfig.appUrl,
    appConfig.adminUrl,
    appConfig.apiUrl,
  ]);

  // Add localhost variants for development
  if (appConfig.isDevelopment) {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3001');
    origins.add('http://localhost:4000');
    origins.add('http://127.0.0.1:3000');
    origins.add('http://127.0.0.1:3001');
    origins.add('http://127.0.0.1:4000');
  }

  return [...origins];
}

/** CORS configuration for the Express app */
export const corsConfig: CorsOptions = {
  origin(origin, callback) {
    const whitelist = buildOriginWhitelist();

    // Allow requests with no origin (server-to-server, mobile apps, curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },

  /** Include cookies in cross-origin requests */
  credentials: true,

  /** Allowed HTTP methods */
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  /** Headers the client can send */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],

  /** Headers exposed to the client */
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  /** Cache preflight response for 24 hours */
  maxAge: 86400,
};
