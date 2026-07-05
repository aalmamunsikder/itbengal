/**
 * Dockerfile generators — framework-specific build strategies.
 *
 * Uses the strategy pattern to generate optimised multi-stage Dockerfiles
 * for each supported framework. Also generates an Nginx configuration
 * for SPA frameworks that need client-side routing.
 *
 * @module engine/builders
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for Dockerfile generation. */
interface BuildOptions {
  /** Build command (e.g. `npm run build`). */
  buildCommand: string;
  /** Package install command (e.g. `npm install`). */
  installCommand: string;
  /** Build output directory (e.g. `dist`, `build`, `.next`). */
  outputDirectory: string;
  /** Node.js version for the base image (e.g. `20`, `18`). */
  nodeVersion: string;
  /** Root directory of the source code relative to the repo root (e.g. `.`, `packages/web`). */
  rootDirectory: string;
}

// ---------------------------------------------------------------------------
// Dockerfile strategies
// ---------------------------------------------------------------------------

/** Frameworks that produce static files served by Nginx. */
const STATIC_FRAMEWORKS = new Set([
  'REACT',
  'VITE',
  'VUE',
  'SVELTE',
  'ASTRO',
  'ANGULAR',
  'STATIC_HTML',
]);

/**
 * Normalise the root directory path for COPY instructions.
 * Returns `.` for empty/root, strips trailing slashes.
 */
function normalisePath(rootDir: string): string {
  const trimmed = rootDir.trim().replace(/\/+$/, '');
  return trimmed === '' || trimmed === '/' ? '.' : trimmed;
}

/**
 * Generate a multi-stage Dockerfile for static SPA/SSG frameworks.
 *
 * Stage 1 (builder): Installs dependencies and runs the build command.
 * Stage 2 (runtime): Copies the built assets into an Nginx container
 * with a custom config that supports client-side routing.
 */
function generateStaticDockerfile(options: BuildOptions): string {
  const { buildCommand, installCommand, outputDirectory, nodeVersion, rootDirectory } = options;
  const root = normalisePath(rootDirectory);
  const copySource = root === '.' ? '' : `${root}/`;

  return `# ──────────────────────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────────────────────
FROM node:${nodeVersion}-alpine AS builder

WORKDIR /app

# Copy package manifests first for better layer caching
COPY ${copySource}package*.json ./
COPY ${copySource}yarn.lock* ./
COPY ${copySource}pnpm-lock.yaml* ./

RUN ${installCommand}

# Copy the rest of the source code
COPY ${root === '.' ? '.' : root} .

# Run the build
RUN ${buildCommand}

# ──────────────────────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ──────────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove default Nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/${outputDirectory} /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;
}

/**
 * Generate a multi-stage Dockerfile for Next.js applications.
 *
 * Stage 1 (builder): Installs dependencies and builds the Next.js app.
 * Stage 2 (runner): Runs the standalone Next.js server with minimal
 * image size using only the required production files.
 */
function generateNextjsDockerfile(options: BuildOptions): string {
  const { buildCommand, installCommand, nodeVersion, rootDirectory } = options;
  const root = normalisePath(rootDirectory);
  const copySource = root === '.' ? '' : `${root}/`;

  return `# ──────────────────────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────────────────────
FROM node:${nodeVersion}-alpine AS builder

WORKDIR /app

# Copy package manifests first for better layer caching
COPY ${copySource}package*.json ./
COPY ${copySource}yarn.lock* ./
COPY ${copySource}pnpm-lock.yaml* ./

RUN ${installCommand}

# Copy the rest of the source code
COPY ${root === '.' ? '.' : root} .

# Build the Next.js app (ensure standalone output is enabled)
RUN ${buildCommand}

# ──────────────────────────────────────────────────────────────
# Stage 2: Production runner
# ──────────────────────────────────────────────────────────────
FROM node:${nodeVersion}-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the files needed for the standalone server
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a Dockerfile for the given framework and build options.
 *
 * @param framework - The project framework (e.g. `REACT`, `NEXTJS`, `VUE`).
 * @param options   - Build configuration options.
 * @returns The generated Dockerfile content as a string.
 * @throws Error if the framework is not recognised.
 */
export function generateDockerfile(framework: string, options: BuildOptions): string {
  if (framework === 'NEXTJS') {
    return generateNextjsDockerfile(options);
  }

  if (STATIC_FRAMEWORKS.has(framework)) {
    return generateStaticDockerfile(options);
  }

  // Default: treat unknown frameworks as static builds
  return generateStaticDockerfile(options);
}

/**
 * Generate an Nginx configuration for serving single-page applications.
 *
 * Features:
 * - Client-side routing support (`try_files $uri $uri/ /index.html`)
 * - Aggressive caching for static assets (1 year, immutable)
 * - Gzip compression for text-based content types
 *
 * @returns The generated nginx.conf content as a string.
 */
export function generateNginxConf(): string {
  return `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Client-side routing — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Aggressive caching for static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
`;
}

/**
 * Get the default internal port for a given framework.
 *
 * - **NEXTJS**: Port 3000 (standalone Node.js server)
 * - **All others**: Port 80 (Nginx)
 *
 * @param framework - The project framework.
 * @returns The default port number.
 */
export function getDefaultPort(framework: string): number {
  if (framework === 'NEXTJS') {
    return 3000;
  }
  return 80;
}

export type { BuildOptions };
