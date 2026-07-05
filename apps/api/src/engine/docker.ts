/**
 * Docker client — Dockerode-based container and image management.
 *
 * Provides functions for building Docker images, running containers with
 * Traefik labels, stopping/removing containers, and reading container logs.
 * Uses a singleton Dockerode instance connected to the Docker socket.
 *
 * @module engine/docker
 */

import Dockerode from 'dockerode';

import { logger } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Singleton Docker client
// ---------------------------------------------------------------------------

/** Singleton Dockerode instance connected to the Docker daemon socket. */
const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for creating and starting a new container. */
interface ContainerRunOptions {
  /** Docker image tag to run (e.g. `itbengal/my-app:abc123`). */
  imageTag: string;
  /** Container name (must be unique). */
  containerName: string;
  /** Environment variables as key-value pairs. */
  envVars: Record<string, string>;
  /** Internal port the application listens on. */
  port: number;
  /** Domain name for Traefik routing. */
  domain: string;
  /** Docker network to attach to (e.g. `itbengal-network`). */
  networkName: string;
  /** Docker labels (Traefik routing labels, etc.). */
  labels: Record<string, string>;
  /** Optional Docker health check configuration. */
  healthCheck?: {
    /** URL to probe for health. */
    url: string;
    /** Interval between checks in seconds. */
    interval: number;
    /** Number of consecutive failures before unhealthy. */
    retries: number;
  };
}

// ---------------------------------------------------------------------------
// Image operations
// ---------------------------------------------------------------------------

/**
 * Build a Docker image from a build context directory.
 *
 * Streams build output and calls `onLog` for each line. Throws if
 * the build fails or if any stream message contains an error.
 *
 * @param contextDir - Absolute path to the build context (must contain a Dockerfile).
 * @param imageTag   - Tag for the resulting image (e.g. `itbengal/my-app:abc123`).
 * @param onLog      - Callback invoked with each build log line.
 * @throws Error if the image build fails.
 */
export async function buildImage(
  contextDir: string,
  imageTag: string,
  onLog: (line: string) => void,
): Promise<void> {
  logger.info(`Building Docker image: ${imageTag} from ${contextDir}`);

  const stream = await docker.buildImage(
    {
      context: contextDir,
      src: ['.'],
    },
    { t: imageTag, rm: true, forcerm: true },
  );

  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err: Error | null) => {
        if (err) {
          reject(new Error(`Docker build failed: ${err.message}`));
        } else {
          resolve();
        }
      },
      (event: Record<string, unknown>) => {
        if (event['stream'] && typeof event['stream'] === 'string') {
          const line = (event['stream'] as string).trim();
          if (line) {
            onLog(line);
          }
        }

        if (event['error'] && typeof event['error'] === 'string') {
          onLog(`ERROR: ${event['error']}`);
        }

        // Check for error detail objects
        if (event['errorDetail']) {
          const detail = event['errorDetail'] as Record<string, unknown>;
          const msg =
            typeof detail['message'] === 'string'
              ? detail['message']
              : JSON.stringify(detail);
          reject(new Error(`Docker build error: ${msg}`));
        }
      },
    );
  });

  logger.info(`Docker image built successfully: ${imageTag}`);
}

// ---------------------------------------------------------------------------
// Container operations
// ---------------------------------------------------------------------------

/**
 * Create and start a new Docker container.
 *
 * The container is attached to the specified Docker network, configured
 * with environment variables and labels (typically Traefik routing labels),
 * and set to restart unless explicitly stopped.
 *
 * @param options - Container creation options.
 * @returns The Docker container ID.
 * @throws Error if container creation or startup fails.
 */
export async function runContainer(options: ContainerRunOptions): Promise<string> {
  const {
    imageTag,
    containerName,
    envVars,
    port,
    networkName,
    labels,
    healthCheck,
  } = options;

  logger.info(`Creating container: ${containerName} from image: ${imageTag}`);

  // Build environment array: ['KEY=value', ...]
  const envArray = Object.entries(envVars).map(([key, value]) => `${key}=${value}`);

  // Build health check config for Docker
  const dockerHealthCheck: Dockerode.ContainerCreateOptions['Healthcheck'] = healthCheck
    ? {
        Test: ['CMD-SHELL', `wget --no-verbose --tries=1 --spider ${healthCheck.url} || exit 1`],
        Interval: healthCheck.interval * 1_000_000_000, // nanoseconds
        Retries: healthCheck.retries,
        Timeout: 5 * 1_000_000_000, // 5s timeout per check
        StartPeriod: 10 * 1_000_000_000, // 10s grace period
      }
    : undefined;

  const portStr = `${port}/tcp`;

  const container = await docker.createContainer({
    Image: imageTag,
    name: containerName,
    Env: envArray,
    ExposedPorts: {
      [portStr]: {},
    },
    Labels: {
      ...labels,
      'itbengal.managed': 'true',
      'itbengal.container.name': containerName,
    },
    Healthcheck: dockerHealthCheck,
    HostConfig: {
      PortBindings: {
        [portStr]: [{ HostPort: '0' }], // Random host port
      },
      RestartPolicy: { Name: 'unless-stopped' },
      // Memory limit: 512MB default
      Memory: 512 * 1024 * 1024,
    },
    NetworkingConfig: {
      EndpointsConfig: {
        [networkName]: {},
      },
    },
  });

  await container.start();

  const info = await container.inspect();
  const containerId = info.Id;

  logger.info(`Container started: ${containerName} (ID: ${containerId.slice(0, 12)})`);

  return containerId;
}

/**
 * Stop and remove a Docker container.
 *
 * Gracefully stops the container with a 10-second timeout before
 * force-killing. Errors are silenced if the container doesn't exist
 * (e.g. already removed).
 *
 * @param containerId - Docker container ID to stop and remove.
 */
export async function stopContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);

    // Stop with 10-second timeout
    await container.stop({ t: 10 }).catch((err: Error & { statusCode?: number }) => {
      // 304 = container already stopped, 404 = doesn't exist
      if (err.statusCode !== 304 && err.statusCode !== 404) {
        throw err;
      }
    });

    // Remove the stopped container
    await container.remove({ force: true }).catch((err: Error & { statusCode?: number }) => {
      if (err.statusCode !== 404) {
        throw err;
      }
    });

    logger.info(`Container stopped and removed: ${containerId.slice(0, 12)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed to stop container ${containerId.slice(0, 12)}: ${message}`);
  }
}

/**
 * Get the status of a Docker container.
 *
 * @param containerId - Docker container ID.
 * @returns Container status string (e.g. `running`, `exited`, `created`).
 */
export async function getContainerStatus(containerId: string): Promise<string> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.State.Status;
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.statusCode === 404) {
      return 'not_found';
    }
    throw error;
  }
}

/**
 * Remove a Docker image by tag.
 *
 * Errors are silenced if the image doesn't exist or is still in use
 * by another container (a warning is logged instead).
 *
 * @param imageTag - Image tag to remove (e.g. `itbengal/my-app:abc123`).
 */
export async function removeImage(imageTag: string): Promise<void> {
  try {
    const image = docker.getImage(imageTag);
    await image.remove({ force: true });
    logger.info(`Image removed: ${imageTag}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed to remove image ${imageTag}: ${message}`);
  }
}

/**
 * Get the last N lines of logs from a container.
 *
 * @param containerId - Docker container ID.
 * @param tail        - Number of lines to retrieve (default: 100).
 * @returns Combined stdout/stderr log output as a string.
 */
export async function containerLogs(
  containerId: string,
  tail = 100,
): Promise<string> {
  const container = docker.getContainer(containerId);
  const logBuffer = await container.logs({
    stdout: true,
    stderr: true,
    tail,
    follow: false,
  });

  // Dockerode returns a Buffer or ReadableStream; handle both
  if (Buffer.isBuffer(logBuffer)) {
    return logBuffer.toString('utf-8');
  }

  // If it's a stream, collect it
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = logBuffer as unknown as NodeJS.ReadableStream;
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
}

/**
 * List all running Docker containers, optionally filtered by ITBengal labels.
 *
 * @param managedOnly - If `true`, only return containers with the `itbengal.managed` label.
 * @returns Array of container info objects.
 */
export async function listContainers(
  managedOnly = false,
): Promise<Dockerode.ContainerInfo[]> {
  const filters = managedOnly
    ? { label: ['itbengal.managed=true'] }
    : undefined;

  return docker.listContainers({ all: true, filters });
}

/**
 * Get Docker system information (disk usage, container/image counts).
 *
 * @returns Docker system info object.
 */
export async function getDockerInfo(): Promise<any> {
  return docker.info();
}

/**
 * Restart a Docker container by ID.
 *
 * @param containerId - Docker container ID.
 * @param timeoutSec  - Seconds to wait before force-killing (default: 10).
 */
export async function restartContainer(
  containerId: string,
  timeoutSec = 10,
): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.restart({ t: timeoutSec });
  logger.info(`Container restarted: ${containerId.slice(0, 12)}`);
}

// Re-export the docker instance for advanced usage
export { docker };
export type { ContainerRunOptions };
