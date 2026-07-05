/**
 * Traefik label generator — Docker labels for automatic HTTP routing.
 *
 * Generates Traefik v3 Docker provider labels for automatic service
 * discovery, TLS certificate provisioning via Let's Encrypt, and
 * custom domain routing.
 *
 * @module engine/traefik
 */

import { appConfig } from '../config/app.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for generating primary Traefik labels. */
interface TraefikLabelOptions {
  /** Domain to route traffic to (e.g. `my-app.app.itbengal.xyz`). */
  domain: string;
  /** Container name used as the Traefik service/router identifier. */
  containerName: string;
  /** Internal port the container listens on. */
  port: number;
  /** Whether to enable TLS via Let's Encrypt. */
  enableSsl: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitise a container name for use as a Traefik router/service name.
 * Traefik identifiers must be alphanumeric with hyphens only.
 */
function sanitiseName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate Traefik Docker labels for routing traffic to a container.
 *
 * In production: Uses `websecure` entrypoint with TLS via Let's Encrypt.
 * In development: Uses `web` entrypoint without TLS (plain HTTP).
 *
 * @param options - Label generation options.
 * @returns Record of Docker labels for Traefik service discovery.
 *
 * @example
 * ```ts
 * const labels = generateTraefikLabels({
 *   domain: 'my-app.app.itbengal.xyz',
 *   containerName: 'itbengal-my-app-abc123',
 *   port: 80,
 *   enableSsl: true,
 * });
 * ```
 */
export function generateTraefikLabels(options: TraefikLabelOptions): Record<string, string> {
  const { domain, containerName, port, enableSsl } = options;
  const name = sanitiseName(containerName);

  const labels: Record<string, string> = {
    'traefik.enable': 'true',

    // Router configuration
    [`traefik.http.routers.${name}.rule`]: `Host(\`${domain}\`)`,

    // Service configuration — tell Traefik which port to forward to
    [`traefik.http.services.${name}.loadbalancer.server.port`]: String(port),
  };

  if (enableSsl && appConfig.isProduction) {
    // Production: HTTPS with automatic Let's Encrypt certificates
    labels[`traefik.http.routers.${name}.entrypoints`] = 'websecure';
    labels[`traefik.http.routers.${name}.tls`] = 'true';
    labels[`traefik.http.routers.${name}.tls.certresolver`] = 'letsencrypt';

    // HTTP → HTTPS redirect
    labels[`traefik.http.routers.${name}-http.rule`] = `Host(\`${domain}\`)`;
    labels[`traefik.http.routers.${name}-http.entrypoints`] = 'web';
    labels[`traefik.http.routers.${name}-http.middlewares`] = `${name}-redirect`;
    labels[`traefik.http.middlewares.${name}-redirect.redirectscheme.scheme`] = 'https';
    labels[`traefik.http.middlewares.${name}-redirect.redirectscheme.permanent`] = 'true';
  } else {
    // Development: plain HTTP
    labels[`traefik.http.routers.${name}.entrypoints`] = 'web';
  }

  return labels;
}

/**
 * Generate additional Traefik labels for a custom domain.
 *
 * Creates a separate Traefik router for the custom domain while
 * sharing the same backend service. This allows both the platform
 * subdomain and the custom domain to route to the same container.
 *
 * @param containerName - Container name (service identifier).
 * @param customDomain  - The custom domain (e.g. `www.example.com`).
 * @param port          - Internal container port.
 * @returns Additional Docker labels for the custom domain router.
 */
export function generateCustomDomainLabels(
  containerName: string,
  customDomain: string,
  port: number,
): Record<string, string> {
  const baseName = sanitiseName(containerName);
  const customName = `${baseName}-custom`;

  const labels: Record<string, string> = {
    [`traefik.http.routers.${customName}.rule`]: `Host(\`${customDomain}\`)`,
    [`traefik.http.services.${customName}.loadbalancer.server.port`]: String(port),
  };

  if (appConfig.isProduction) {
    labels[`traefik.http.routers.${customName}.entrypoints`] = 'websecure';
    labels[`traefik.http.routers.${customName}.tls`] = 'true';
    labels[`traefik.http.routers.${customName}.tls.certresolver`] = 'letsencrypt';

    // HTTP → HTTPS redirect for custom domain
    labels[`traefik.http.routers.${customName}-http.rule`] = `Host(\`${customDomain}\`)`;
    labels[`traefik.http.routers.${customName}-http.entrypoints`] = 'web';
    labels[`traefik.http.routers.${customName}-http.middlewares`] = `${customName}-redirect`;
    labels[`traefik.http.middlewares.${customName}-redirect.redirectscheme.scheme`] = 'https';
    labels[`traefik.http.middlewares.${customName}-redirect.redirectscheme.permanent`] = 'true';
  } else {
    labels[`traefik.http.routers.${customName}.entrypoints`] = 'web';
  }

  return labels;
}

export type { TraefikLabelOptions };
