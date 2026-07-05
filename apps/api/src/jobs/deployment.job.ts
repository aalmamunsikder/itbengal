/**
 * Deployment job — BullMQ queue and worker for asynchronous deployment processing.
 *
 * Runs the real deployment pipeline using the deployment engine (engine/pipeline.ts).
 *
 * Job data shape:
 * ```ts
 * { deploymentId: string, projectId: string, applicationId: string }
 * ```
 *
 * @module jobs/deployment
 */

import { Queue, Worker } from 'bullmq';

import { queueConnection, defaultJobOptions, QUEUE_NAMES } from '../config/queue.js';
import { runDeploymentPipeline } from '../engine/pipeline.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of data for each deployment job. */
interface DeploymentJobData {
  /** The deployment record UUID. */
  deploymentId: string;
  /** The project UUID. */
  projectId: string;
  /** The application UUID. */
  applicationId: string;
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/** BullMQ queue instance for deployment jobs. */
const deploymentQueue = new Queue<DeploymentJobData>(QUEUE_NAMES.DEPLOYMENT, {
  connection: queueConnection,
  defaultJobOptions,
});

/**
 * Enqueue a deployment job for asynchronous processing.
 *
 * @param data - The deployment job payload.
 */
export async function addDeploymentJob(data: DeploymentJobData): Promise<void> {
  await deploymentQueue.add(`deploy:${data.deploymentId}`, data, {
    // Deployments should not auto-retry — manual re-trigger is preferred
    attempts: 1,
  });

  console.log(
    `[DeploymentJob] Enqueued deployment ${data.deploymentId} for project ${data.projectId}`,
  );
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

/**
 * BullMQ worker that processes deployment jobs.
 * Runs the real pipeline and catches any errors.
 */
const deploymentWorker = new Worker<DeploymentJobData>(
  QUEUE_NAMES.DEPLOYMENT,
  async (job) => {
    const { deploymentId, projectId, applicationId } = job.data;

    console.log(
      `[DeploymentWorker] Processing job ${job.id ?? 'unknown'}: deployment ${deploymentId}`,
    );

    try {
      await runDeploymentPipeline(deploymentId, projectId, applicationId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      console.error(
        `[DeploymentWorker] Job ${job.id ?? 'unknown'} failed for deployment ${deploymentId}: ${errorMessage}`,
      );

      // Status updates are handled in pipeline.ts catch block, but we re-throw to mark job failed in BullMQ
      throw error;
    }
  },
  {
    connection: queueConnection,
    concurrency: 2, // Concurrency limit of 2 for deployments since they are heavy
  },
);

// ---------------------------------------------------------------------------
// Worker event handlers
// ---------------------------------------------------------------------------

deploymentWorker.on('completed', (job) => {
  console.log(
    `[DeploymentWorker] Job ${job.id ?? 'unknown'} completed: deployment ${job.data.deploymentId}`,
  );
});

deploymentWorker.on('failed', (job, err) => {
  console.error(
    `[DeploymentWorker] Job ${job?.id ?? 'unknown'} failed:`,
    err.message,
  );
});

deploymentWorker.on('error', (err) => {
  console.error('[DeploymentWorker] Worker error:', err.message);
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { deploymentQueue, deploymentWorker };
export type { DeploymentJobData };
