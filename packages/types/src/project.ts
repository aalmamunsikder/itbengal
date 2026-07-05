/**
 * Project types for the hosting platform.
 * @module @itbengal/types/project
 */

import type { Framework, GitProvider, ProjectStatus } from './enums.js';
import type { Deployment } from './deployment.js';

/**
 * A hosting project within an organization.
 */
export interface Project {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization that owns this project. */
  organizationId: string;
  /** Display name. */
  name: string;
  /** URL-safe slug (unique within an organization). */
  slug: string;
  /** Optional human-readable description. */
  description: string | null;
  /** The front-end framework used. */
  framework: Framework;
  /** Git hosting provider. */
  gitProvider: GitProvider | null;
  /** Full URL of the Git repository. */
  gitRepoUrl: string | null;
  /** Git branch to deploy from. */
  gitBranch: string;
  /** Shell command to build the project. */
  buildCommand: string;
  /** Shell command to install dependencies. */
  installCommand: string;
  /** Directory containing the build output. */
  outputDirectory: string;
  /** Node.js version to use during builds. */
  nodeVersion: string;
  /** Root directory of the project within the repository. */
  rootDirectory: string;
  /** Whether pushes to the tracked branch trigger automatic deployments. */
  autoDeployEnabled: boolean;
  /** Lifecycle status. */
  status: ProjectStatus;
  /** When the project was created. */
  createdAt: string;
  /** When the project was last updated. */
  updatedAt: string;
}

/**
 * Request body for creating a new project.
 */
export interface CreateProjectRequest {
  /** Display name for the project. */
  name: string;
  /** Optional human-readable description. */
  description?: string;
  /** The front-end framework. */
  framework: Framework;
  /** Git hosting provider. */
  gitProvider?: GitProvider;
  /** Full URL of the Git repository. */
  gitRepoUrl?: string;
  /** Git branch to deploy from (defaults to "main"). */
  gitBranch?: string;
  /** Shell command to build the project. */
  buildCommand?: string;
  /** Shell command to install dependencies. */
  installCommand?: string;
  /** Directory containing the build output. */
  outputDirectory?: string;
  /** Node.js version to use. */
  nodeVersion?: string;
  /** Root directory within the repository. */
  rootDirectory?: string;
  /** Whether to auto-deploy on push. */
  autoDeployEnabled?: boolean;
}

/**
 * Request body for updating an existing project.
 * All fields are optional — only provided fields are updated.
 */
export interface UpdateProjectRequest {
  /** Updated display name. */
  name?: string;
  /** Updated description. */
  description?: string | null;
  /** Updated framework. */
  framework?: Framework;
  /** Updated Git provider. */
  gitProvider?: GitProvider | null;
  /** Updated repository URL. */
  gitRepoUrl?: string | null;
  /** Updated branch name. */
  gitBranch?: string;
  /** Updated build command. */
  buildCommand?: string;
  /** Updated install command. */
  installCommand?: string;
  /** Updated output directory. */
  outputDirectory?: string;
  /** Updated Node.js version. */
  nodeVersion?: string;
  /** Updated root directory. */
  rootDirectory?: string;
  /** Updated auto-deploy setting. */
  autoDeployEnabled?: boolean;
  /** Updated project status. */
  status?: ProjectStatus;
}

/**
 * A project enriched with its latest deployment info.
 */
export interface ProjectWithDeployments extends Project {
  /** The most recent deployment (if any). */
  latestDeployment: Deployment | null;
  /** Total number of deployments for this project. */
  deploymentCount: number;
}
