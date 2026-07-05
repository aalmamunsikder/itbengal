/**
 * Project repository — Prisma-based data access for Project and Application models.
 *
 * All queries exclude soft-deleted records (status !== DELETED) unless otherwise noted.
 * Project creation uses a Prisma transaction to atomically create both the
 * Project and its initial Application record.
 *
 * @module repositories/project
 */

import { prisma } from '@itbengal/database';
import type {
  Project,
  Application,
  Prisma,
  ProjectStatus,
  Framework,
} from '@itbengal/database';

import { slugify } from '@itbengal/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Paginated query options for project listing. */
interface ProjectListOptions {
  page: number;
  perPage: number;
  status?: ProjectStatus;
  framework?: Framework;
  search?: string;
}

/** Return type for paginated project queries. */
export interface PaginatedProjects {
  data: Array<Project & { applications: Application[]; _count: { deployments: number } }>;
  total: number;
}

/** Data required to create a new project. */
interface CreateProjectData {
  organizationId: string;
  name: string;
  description?: string;
  framework: Framework;
  gitProvider?: 'GITHUB' | 'GITLAB' | 'BITBUCKET';
  gitRepoUrl?: string;
  gitRepoId?: string;
  gitBranch?: string;
  gitAccessToken?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  rootDirectory?: string;
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * List all projects for an organization with pagination, filtering, and search.
 * Excludes soft-deleted projects.
 *
 * @param orgId   - Organization UUID.
 * @param options - Pagination and filter options.
 * @returns Paginated projects with applications and deployment count.
 */
export async function findAllByOrganization(
  orgId: string,
  options: ProjectListOptions,
): Promise<PaginatedProjects> {
  const { page, perPage, status, framework, search } = options;
  const offset = (page - 1) * perPage;

  const where: Prisma.ProjectWhereInput = {
    organizationId: orgId,
    status: status ? status : { not: 'DELETED' },
    ...(framework && { framework }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        applications: true,
        _count: { select: { deployments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: perPage,
    }),
    prisma.project.count({ where }),
  ]);

  return { data, total };
}

/**
 * Find a project by ID with related data.
 * Includes applications, the latest deployment, and environment variable count.
 *
 * @param id - Project UUID.
 * @returns The matched project or `null`.
 */
export async function findById(
  id: string,
): Promise<
  | (Project & {
      applications: Application[];
      deployments: Array<{ id: string; status: string; createdAt: Date }>;
      _count: { environmentVariables: number };
    })
  | null
> {
  return prisma.project.findFirst({
    where: { id, status: { not: 'DELETED' } },
    include: {
      applications: true,
      deployments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, createdAt: true },
      },
      _count: { select: { environmentVariables: true } },
    },
  });
}

/**
 * Find a project by organization ID and slug.
 *
 * @param orgId - Organization UUID.
 * @param slug  - Project slug.
 * @returns The matched project or `null`.
 */
export async function findBySlug(
  orgId: string,
  slug: string,
): Promise<
  | (Project & {
      applications: Application[];
      deployments: Array<{ id: string; status: string; createdAt: Date }>;
      _count: { environmentVariables: number };
    })
  | null
> {
  return prisma.project.findFirst({
    where: {
      organizationId: orgId,
      slug,
      status: { not: 'DELETED' },
    },
    include: {
      applications: true,
      deployments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, createdAt: true },
      },
      _count: { select: { environmentVariables: true } },
    },
  });
}

/**
 * Find a project by its Git repository ID (for webhook matching).
 *
 * @param gitRepoId - The Git provider's repository ID.
 * @returns The matched project or `null`.
 */
export async function findByGitRepoId(
  gitRepoId: string,
): Promise<(Project & { applications: Application[] }) | null> {
  return prisma.project.findFirst({
    where: {
      gitRepoId,
      status: { not: 'DELETED' },
    },
    include: { applications: true },
  });
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Create a new project with an auto-generated Application record.
 *
 * The slug is derived from the project name. If a slug collision occurs within
 * the same organization, a random 4-character suffix is appended.
 * The application domain follows the pattern: `{slug}.app.itbengal.xyz`.
 *
 * @param data - Project creation payload.
 * @returns The created project with its application.
 */
export async function create(
  data: CreateProjectData,
): Promise<Project & { applications: Application[] }> {
  const baseSlug = slugify(data.name);

  return prisma.$transaction(async (tx) => {
    // Check for slug collision and generate unique slug
    let slug = baseSlug;
    const existing = await tx.project.findFirst({
      where: { organizationId: data.organizationId, slug },
    });

    if (existing) {
      const suffix = Math.random().toString(36).slice(2, 6);
      slug = `${baseSlug}-${suffix}`;
    }

    const domain = `${slug}.app.itbengal.xyz`;

    // Create the project
    const project = await tx.project.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        slug,
        description: data.description,
        framework: data.framework,
        gitProvider: data.gitProvider,
        gitRepoUrl: data.gitRepoUrl,
        gitRepoId: data.gitRepoId,
        gitBranch: data.gitBranch ?? 'main',
        gitAccessToken: data.gitAccessToken,
        buildCommand: data.buildCommand,
        installCommand: data.installCommand ?? 'npm install',
        outputDirectory: data.outputDirectory,
        nodeVersion: data.nodeVersion ?? '20',
        rootDirectory: data.rootDirectory ?? '.',
      },
    });

    // Auto-create the Application record
    await tx.application.create({
      data: {
        projectId: project.id,
        type: data.framework === 'REACT' ? 'REACT' : 'REACT',
        domain,
        containerStatus: 'STOPPED',
        sslStatus: 'PENDING',
        resourceCpu: 0.5,
        resourceMemoryMb: 512,
        resourceStorageMb: 1024,
        port: 3000,
      },
    });

    // Return the project with its applications
    return tx.project.findUniqueOrThrow({
      where: { id: project.id },
      include: { applications: true },
    });
  });
}

/**
 * Update a project by ID.
 *
 * @param id   - Project UUID.
 * @param data - Partial project data to update.
 * @returns The updated project.
 */
export async function updateById(
  id: string,
  data: Prisma.ProjectUpdateInput,
): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data,
  });
}

/**
 * Soft-delete a project by setting status to DELETED and recording deletedAt.
 *
 * @param id - Project UUID.
 * @returns The updated project.
 */
export async function softDelete(id: string): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
    },
  });
}
