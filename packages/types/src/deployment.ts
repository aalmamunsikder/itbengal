/**
 * Deployment pipeline types.
 * @module @itbengal/types/deployment
 */

import type { DeploymentStatus, DeploymentTrigger } from './enums.js';
import type { Project } from './project.js';

/**
 * A single deployment run for a project.
 */
export interface Deployment {
  /** Primary key (UUIDv7). */
  id: string;
  /** The application / container this was deployed to. */
  applicationId: string;
  /** The project being deployed. */
  projectId: string;
  /** What triggered this deployment. */
  triggerType: DeploymentTrigger;
  /** Git commit SHA (short or full) being deployed. */
  gitCommitSha: string | null;
  /** Git commit message. */
  gitCommitMessage: string | null;
  /** Git branch the deployment was triggered from. */
  gitBranch: string | null;
  /** Current pipeline status. */
  status: DeploymentStatus;
  /** Time spent on the build step (milliseconds). */
  buildDurationMs: number | null;
  /** Time spent on the deploy step (milliseconds). */
  deployDurationMs: number | null;
  /** Docker image tag used for this deployment. */
  imageTag: string | null;
  /** Port the container listens on. */
  containerPort: number | null;
  /** Error message if the deployment failed. */
  errorMessage: string | null;
  /** Arbitrary metadata stored as JSONB. */
  metadata: Record<string, unknown> | null;
  /** User ID of whoever triggered this deployment. */
  triggeredBy: string;
  /** When the deployment was created. */
  createdAt: string;
  /** When the deployment was last updated. */
  updatedAt: string;
}

/**
 * A single log line emitted during a deployment.
 */
export interface DeploymentLog {
  /** Primary key. */
  id: string;
  /** The deployment this log belongs to. */
  deploymentId: string;
  /** Log level (info, warn, error, debug). */
  level: string;
  /** Log message content. */
  message: string;
  /** ISO-8601 timestamp of the log entry. */
  timestamp: string;
}

/**
 * Request body for creating a new deployment.
 */
export interface CreateDeploymentRequest {
  /** The project to deploy. */
  projectId: string;
  /** What triggered this deployment. */
  triggerType: DeploymentTrigger;
  /** Git commit SHA (if applicable). */
  gitCommitSha?: string;
  /** Git commit message (if applicable). */
  gitCommitMessage?: string;
  /** Git branch (if applicable). */
  gitBranch?: string;
}

/**
 * A deployment enriched with its parent project.
 */
export interface DeploymentWithProject extends Deployment {
  /** The project this deployment belongs to. */
  project: Project;
}
