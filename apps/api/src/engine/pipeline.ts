/**
 * Deployment pipeline orchestrator — the core deployment engine.
 *
 * Orchestrates the full deployment lifecycle:
 * 1. Fetch project context and decrypt secrets
 * 2. Clone the git repository
 * 3. Generate framework-specific Dockerfile
 * 4. Build Docker image
 * 5. Stop the previous container (if running)
 * 6. Start a new container with Traefik routing
 * 7. Run health checks
 * 8. Update application records
 * 9. Clean up temporary files and old images
 *
 * Each step logs progress via the deployment service and broadcasts
 * real-time updates to WebSocket clients.
 *
 * @module engine/pipeline
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

import { prisma } from '@itbengal/database';
import type { Application, Project } from '@itbengal/database';
import { logger } from '../utils/logger.js';
import { decrypt } from '@itbengal/utils';

import { appConfig } from '../config/app.js';
import * as deploymentService from '../services/deployment.service.js';
import * as envVarService from '../services/env-var.service.js';
import * as projectRepository from '../repositories/project.repository.js';

import { cloneRepository, getLatestCommit } from './git.js';
import { buildImage, runContainer, stopContainer, removeImage } from './docker.js';
import { generateDockerfile, generateNginxConf, getDefaultPort } from './builders/index.js';
import { generateTraefikLabels, generateCustomDomainLabels } from './traefik.js';
import { waitForHealthy } from './health.js';
import { broadcastDeploymentLog, notifyDeploymentComplete } from './websocket.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Docker network that Traefik monitors for service discovery. */
const DOCKER_NETWORK = 'itbengal-network';

/** Container name prefix for all deployed applications. */
const CONTAINER_PREFIX = 'itbengal-app';

/** Image tag prefix for all built images. */
const IMAGE_PREFIX = 'itbengal';

// ---------------------------------------------------------------------------
// Pipeline class
// ---------------------------------------------------------------------------

/**
 * Encapsulates the state and steps of a single deployment run.
 *
 * Each deployment creates a new `DeploymentPipeline` instance that
 * tracks progress, manages temporary files, and handles cleanup on
 * success or failure.
 */
class DeploymentPipeline {
  private readonly deploymentId: string;
  private readonly projectId: string;
  private readonly applicationId: string;

  private project!: Project & { applications: Application[] };
  private application!: Application;
  private deployment!: any;
  private tempDir = '';
  private oldContainerId: string | null = null;
  private oldImageTag: string | null = null;
  private startTime = 0;

  constructor(deploymentId: string, projectId: string, applicationId: string) {
    this.deploymentId = deploymentId;
    this.projectId = projectId;
    this.applicationId = applicationId;
  }

  // -----------------------------------------------------------------------
  // Public entry point
  // -----------------------------------------------------------------------

  /**
   * Run the full deployment pipeline.
   * Handles top-level error catching, status updates, and cleanup.
   */
  async run(): Promise<void> {
    this.startTime = Date.now();

    try {
      // Step 1: Fetch context
      await this.fetchContext();

      // Step 2: Clone repository
      await this.clone();

      // Step 3: Generate Dockerfile & build image
      const imageTag = await this.buildImage();

      // Step 4 & 5: Deploy (stop old, start new)
      const containerId = await this.deploy(imageTag);

      // Step 6: Health check
      await this.healthCheck(containerId);

      // Step 7: Update records & finalise
      await this.finalise(containerId, imageTag);

      // Step 8: Cleanup (old images, temp files)
      await this.cleanup();

      // Notify WebSocket clients
      notifyDeploymentComplete(this.deploymentId, 'ACTIVE');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      await this.log('ERROR', `Deployment failed: ${errorMessage}`, 'DEPLOY');
      await deploymentService.updateDeploymentStatus(this.deploymentId, 'FAILED', {
        errorMessage,
      });

      // Notify WebSocket clients of failure
      notifyDeploymentComplete(this.deploymentId, 'FAILED');

      // Cleanup temp directory on failure
      await this.cleanupTempDir();

      throw error; // Re-throw so the BullMQ worker marks the job as failed
    }
  }

  // -----------------------------------------------------------------------
  // Step 1: Fetch context
  // -----------------------------------------------------------------------

  private async fetchContext(): Promise<void> {
    await this.log('INFO', 'Fetching project context...', 'BUILD');
    await deploymentService.updateDeploymentStatus(this.deploymentId, 'BUILDING');

    const project = await projectRepository.findById(this.projectId);

    if (!project) {
      throw new Error(`Project ${this.projectId} not found`);
    }

    const application = project.applications.find(
      (app) => app.id === this.applicationId,
    );

    if (!application) {
      throw new Error(
        `Application ${this.applicationId} not found in project ${this.projectId}`,
      );
    }

    const deployment = await prisma.deployment.findUnique({
      where: { id: this.deploymentId },
    });

    if (!deployment) {
      throw new Error(`Deployment ${this.deploymentId} not found`);
    }

    this.deployment = deployment;
    this.project = project as unknown as Project & { applications: Application[] };
    this.application = application;
    this.oldContainerId = application.containerId ?? null;

    await this.log(
      'INFO',
      `Project: ${project.name} | Framework: ${project.framework} | Trigger: ${deployment.triggerType}`,
      'BUILD',
    );
  }

  // -----------------------------------------------------------------------
  // Step 2: Clone repository
  // -----------------------------------------------------------------------

  private async clone(): Promise<void> {
    if (this.deployment.triggerType === 'ZIP_UPLOAD') {
      const metadata = this.deployment.metadata as any;
      const zipPath = metadata?.zipPath;
      if (!zipPath) {
        throw new Error('ZIP file path is missing in deployment metadata');
      }

      await this.log('INFO', `Extracting project ZIP archive: ${zipPath}`, 'BUILD');

      this.tempDir = join(tmpdir(), `itbengal-deploy-${this.deploymentId}-${randomUUID().slice(0, 8)}`);
      await mkdir(this.tempDir, { recursive: true });

      const cloneDir = join(this.tempDir, 'repo');
      await mkdir(cloneDir, { recursive: true });

      try {
        await execAsync(`powershell -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${cloneDir.replace(/'/g, "''")}' -Force"`);
        await this.log('INFO', 'ZIP archive extracted successfully ✓', 'BUILD');
        await deploymentService.updateDeploymentStatus(this.deploymentId, 'BUILDING');
      } catch (err: any) {
        throw new Error(`ZIP extraction failed: ${err.message}`);
      }
      return;
    }

    const repoUrl = this.project.gitRepoUrl;
    const branch = this.project.gitBranch ?? 'main';

    if (!repoUrl) {
      throw new Error('Project has no git repository URL configured');
    }

    await this.log('INFO', `Cloning repository: ${repoUrl} (branch: ${branch})`, 'BUILD');

    // Create temp directory
    this.tempDir = join(tmpdir(), `itbengal-deploy-${this.deploymentId}-${randomUUID().slice(0, 8)}`);
    await mkdir(this.tempDir, { recursive: true });

    // Decrypt access token if present
    let accessToken: string | undefined;
    if (this.project.gitAccessToken) {
      try {
        accessToken = decrypt(this.project.gitAccessToken, appConfig.encryptionKey);
      } catch {
        await this.log('WARN', 'Failed to decrypt git access token — trying without auth', 'BUILD');
      }
    }

    const cloneDir = join(this.tempDir, 'repo');
    await cloneRepository(repoUrl, branch, cloneDir, accessToken);

    // Get the latest commit info
    try {
      const commit = await getLatestCommit(cloneDir);
      await this.log(
        'INFO',
        `Latest commit: ${commit.sha.slice(0, 7)} — ${commit.message}`,
        'BUILD',
      );

      // Update deployment with commit SHA
      await deploymentService.updateDeploymentStatus(this.deploymentId, 'BUILDING');
    } catch {
      await this.log('WARN', 'Could not read commit info — continuing', 'BUILD');
    }

    await this.log('INFO', 'Repository cloned successfully ✓', 'BUILD');
  }

  // -----------------------------------------------------------------------
  // Step 3: Generate Dockerfile & build image
  // -----------------------------------------------------------------------

  private async buildImage(): Promise<string> {
    const framework = this.project.framework ?? 'STATIC_HTML';
    const buildCommand = this.project.buildCommand ?? 'npm run build';
    const installCommand = this.project.installCommand ?? 'npm install';
    const outputDirectory = this.project.outputDirectory ?? 'dist';
    const nodeVersion = this.project.nodeVersion ?? '20';
    const rootDirectory = this.project.rootDirectory ?? '.';

    await this.log('INFO', `Generating Dockerfile for framework: ${framework}`, 'BUILD');

    // Generate the Dockerfile
    const dockerfile = generateDockerfile(framework, {
      buildCommand,
      installCommand,
      outputDirectory,
      nodeVersion,
      rootDirectory,
    });

    const repoDir = join(this.tempDir, 'repo');
    const contextDir = rootDirectory === '.' ? repoDir : join(repoDir, rootDirectory);

    // Write Dockerfile to the build context
    await writeFile(join(contextDir, 'Dockerfile'), dockerfile, 'utf-8');

    // Generate and write nginx.conf for static frameworks
    if (framework !== 'NEXTJS') {
      const nginxConf = generateNginxConf();
      await writeFile(join(contextDir, 'nginx.conf'), nginxConf, 'utf-8');
      await this.log('DEBUG', 'Generated nginx.conf for SPA routing', 'BUILD');
    }

    // Build the Docker image
    const shortId = this.deploymentId.slice(0, 8);
    const imageTag = `${IMAGE_PREFIX}/${this.project.slug}:${shortId}`;

    // Track old image for cleanup
    this.oldImageTag = this.application.containerId
      ? `${IMAGE_PREFIX}/${this.project.slug}:prev`
      : null;

    await this.log('INFO', `Building Docker image: ${imageTag}`, 'BUILD');

    const buildStartTime = Date.now();

    await buildImage(contextDir, imageTag, (line) => {
      // Stream build logs — broadcast via WebSocket but don't persist every line
      broadcastDeploymentLog(this.deploymentId, {
        level: 'DEBUG',
        message: line,
        source: 'BUILD',
      });
    });

    const buildDurationMs = Date.now() - buildStartTime;
    await deploymentService.updateDeploymentStatus(this.deploymentId, 'BUILDING', {
      buildDurationMs,
      imageTag,
    });

    await this.log(
      'INFO',
      `Docker image built successfully in ${(buildDurationMs / 1000).toFixed(1)}s ✓`,
      'BUILD',
    );

    return imageTag;
  }

  // -----------------------------------------------------------------------
  // Step 4 & 5: Deploy (stop old container, start new one)
  // -----------------------------------------------------------------------

  private async deploy(imageTag: string): Promise<string> {
    const deployStartTime = Date.now();
    await deploymentService.updateDeploymentStatus(this.deploymentId, 'DEPLOYING');

    // Stop old container if running
    if (this.oldContainerId) {
      await this.log('INFO', `Stopping previous container: ${this.oldContainerId.slice(0, 12)}`, 'DEPLOY');
      await stopContainer(this.oldContainerId);
      await this.log('INFO', 'Previous container stopped ✓', 'DEPLOY');
    }

    // Prepare container configuration
    const framework = this.project.framework ?? 'STATIC_HTML';
    const port = getDefaultPort(framework);
    const domain = this.application.domain;
    const containerName = `${CONTAINER_PREFIX}-${this.project.slug}-${this.deploymentId.slice(0, 8)}`;

    // Get decrypted environment variables
    const envVarsList = await envVarService.getDecryptedEnvVars(
      this.projectId,
      'PRODUCTION',
    );
    const envVars: Record<string, string> = {};
    for (const ev of envVarsList) {
      envVars[ev.key] = ev.value;
    }

    // Add standard platform env vars
    envVars['NODE_ENV'] = 'production';
    envVars['PORT'] = String(port);

    // Generate Traefik labels
    const labels = generateTraefikLabels({
      domain,
      containerName,
      port,
      enableSsl: appConfig.isProduction,
    });

    if (this.application.customDomain) {
      const customLabels = generateCustomDomainLabels(
        containerName,
        this.application.customDomain,
        port,
      );
      Object.assign(labels, customLabels);
    }

    await this.log('INFO', `Starting container: ${containerName} on domain: ${domain}`, 'DEPLOY');

    // Run the new container
    const containerId = await runContainer({
      imageTag,
      containerName,
      envVars,
      port,
      domain,
      networkName: DOCKER_NETWORK,
      labels,
      healthCheck: {
        url: `http://localhost:${port}/`,
        interval: 10,
        retries: 3,
      },
    });

    const deployDurationMs = Date.now() - deployStartTime;
    await deploymentService.updateDeploymentStatus(this.deploymentId, 'DEPLOYING', {
      deployDurationMs,
    });

    await this.log(
      'INFO',
      `Container started: ${containerId.slice(0, 12)} ✓`,
      'DEPLOY',
    );

    return containerId;
  }

  // -----------------------------------------------------------------------
  // Step 6: Health check
  // -----------------------------------------------------------------------

  private async healthCheck(containerId: string): Promise<void> {
    await this.log('INFO', 'Running health check...', 'HEALTH');

    const framework = this.project.framework ?? 'STATIC_HTML';
    const port = getDefaultPort(framework);

    // Use the container name or direct container access for health checks
    // In Docker network, we can use the container ID as the hostname
    const healthUrl = `http://${containerId.slice(0, 12)}:${port}/`;

    const healthy = await waitForHealthy(healthUrl, {
      maxRetries: 30,
      intervalMs: 2000,
      timeoutMs: 5000,
    });

    if (!healthy) {
      throw new Error(
        `Health check failed: container ${containerId.slice(0, 12)} did not become healthy within 60 seconds`,
      );
    }

    await this.log('INFO', 'Health check passed ✓', 'HEALTH');
  }

  // -----------------------------------------------------------------------
  // Step 7: Finalise — update records
  // -----------------------------------------------------------------------

  private async finalise(containerId: string, imageTag: string): Promise<void> {
    const framework = this.project.framework ?? 'STATIC_HTML';
    const port = getDefaultPort(framework);

    // Update Application record with new container info
    await prisma.application.update({
      where: { id: this.applicationId },
      data: {
        containerId,
        containerStatus: 'RUNNING',
        port,
      },
    });

    // Calculate total duration
    const totalDurationMs = Date.now() - this.startTime;

    // Mark deployment as ACTIVE
    await deploymentService.updateDeploymentStatus(this.deploymentId, 'ACTIVE', {
      deployDurationMs: totalDurationMs,
      imageTag,
    });

    await this.log(
      'INFO',
      `Deployment successful! 🚀 (total: ${(totalDurationMs / 1000).toFixed(1)}s)`,
      'DEPLOY',
    );

    logger.info(
      `Deployment ${this.deploymentId} completed in ${(totalDurationMs / 1000).toFixed(1)}s — ${this.application.domain}`,
    );
  }

  // -----------------------------------------------------------------------
  // Step 8: Cleanup
  // -----------------------------------------------------------------------

  private async cleanup(): Promise<void> {
    await this.log('DEBUG', 'Cleaning up temporary files...', 'DEPLOY');

    // Remove old image to save disk space
    if (this.oldImageTag) {
      await removeImage(this.oldImageTag);
    }

    // Remove temp directory
    await this.cleanupTempDir();
  }

  private async cleanupTempDir(): Promise<void> {
    if (this.tempDir) {
      try {
        await rm(this.tempDir, { recursive: true, force: true });
      } catch (error) {
        logger.warn(
          `Failed to clean up temp directory ${this.tempDir}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // Logging helper
  // -----------------------------------------------------------------------

  /**
   * Log a message to both the deployment log (persisted) and WebSocket clients (real-time).
   */
  private async log(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    source: 'BUILD' | 'DEPLOY' | 'HEALTH',
  ): Promise<void> {
    // Persist to database
    await deploymentService.addDeploymentLog(this.deploymentId, level, message, source);

    // Broadcast to WebSocket clients
    broadcastDeploymentLog(this.deploymentId, { level, message, source });

    // Also log to the application logger
    const logMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
    logger[logMethod](`[Deploy:${this.deploymentId.slice(0, 8)}] ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the full deployment pipeline for a given deployment.
 *
 * This is the main entry point called by the deployment worker.
 * Creates a `DeploymentPipeline` instance and executes all steps.
 *
 * @param deploymentId  - Deployment UUID.
 * @param projectId     - Project UUID.
 * @param applicationId - Application UUID.
 * @throws Error if any pipeline step fails.
 */
export async function runDeploymentPipeline(
  deploymentId: string,
  projectId: string,
  applicationId: string,
): Promise<void> {
  const pipeline = new DeploymentPipeline(deploymentId, projectId, applicationId);
  await pipeline.run();
}
