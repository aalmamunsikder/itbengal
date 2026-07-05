'use client';

import { create } from 'zustand';
import { api, ApiRequestError } from '@/lib/api';

/* ============================================================================
   Types
   ============================================================================ */

/** Framework options for projects */
export const FRAMEWORKS = {
  REACT: 'REACT',
  NEXTJS: 'NEXTJS',
  VUE: 'VUE',
  ANGULAR: 'ANGULAR',
  SVELTE: 'SVELTE',
  ASTRO: 'ASTRO',
  VITE: 'VITE',
  STATIC_HTML: 'STATIC_HTML',
} as const;

export type Framework = (typeof FRAMEWORKS)[keyof typeof FRAMEWORKS];

/** Deployment status values */
export const DEPLOYMENT_STATUSES = {
  QUEUED: 'QUEUED',
  BUILDING: 'BUILDING',
  DEPLOYING: 'DEPLOYING',
  LIVE: 'LIVE',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[keyof typeof DEPLOYMENT_STATUSES];

/** Project status values */
export const PROJECT_STATUSES = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

/** Env var target environments */
export const ENV_TARGETS = {
  PRODUCTION: 'PRODUCTION',
  PREVIEW: 'PREVIEW',
  ALL: 'ALL',
} as const;

export type EnvTarget = (typeof ENV_TARGETS)[keyof typeof ENV_TARGETS];

/** Application within a project */
export interface Application {
  id: string;
  name: string;
  framework: Framework;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
  rootDirectory: string;
  nodeVersion: string;
  domain: string | null;
  customDomain?: string | null;
  sslStatus?: string;
  containerStatus?: string;
  createdAt: string;
  updatedAt: string;
}

/** Deployment record */
export interface Deployment {
  id: string;
  projectId: string;
  applicationId: string;
  status: DeploymentStatus;
  commitSha: string | null;
  commitMessage: string | null;
  branch: string | null;
  triggerType: string;
  triggeredBy: string | null;
  buildDuration: number | null;
  deployDuration: number | null;
  imageTag: string | null;
  containerPort: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  project?: {
    id: string;
    name: string;
    slug: string;
  };
}

/** Deployment log entry */
export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
  timestamp: string;
  source: string;
}

/** Project list item */
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  gitRepoUrl: string | null;
  gitBranch: string | null;
  autoDeployEnabled: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  applications: Application[];
  latestDeployment: Deployment | null;
}

/** Full project detail */
export interface ProjectDetail extends Project {
  applications: Application[];
  latestDeployment: Deployment | null;
}

/** Project stats */
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  byFramework: Record<string, number>;
}

/** Environment variable */
export interface EnvVar {
  id: string;
  key: string;
  value: string;
  target: EnvTarget;
  createdAt: string;
  updatedAt: string;
}

/** GitHub repository */
export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  updatedAt: string;
  cloneUrl: string;
}

/** GitHub branch */
export interface GitHubBranch {
  name: string;
  isDefault: boolean;
}

/** Create project payload */
export interface CreateProjectData {
  name: string;
  description?: string;
  framework: Framework;
  gitRepoUrl?: string;
  gitBranch?: string;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
  rootDirectory: string;
  nodeVersion: string;
  envVars?: Array<{ key: string; value: string; target: EnvTarget }>;
  zipPath?: string;
}

/** Update project payload */
export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  gitBranch?: string;
  autoDeployEnabled?: boolean;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
  nodeVersion?: string;
}

/** Filters for project list */
export interface ProjectFilters {
  page?: number;
  perPage?: number;
  status?: ProjectStatus;
  search?: string;
  framework?: Framework;
}

/** Paginated API response */
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/** Standard API response */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Pagination metadata */
interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
}

/* ============================================================================
   Store
   ============================================================================ */

interface ProjectState {
  /** All fetched projects */
  projects: Project[];
  /** Currently viewed project detail */
  currentProject: ProjectDetail | null;
  /** Deployments for current project */
  deployments: Deployment[];
  /** Current deployment detail */
  currentDeployment: (Deployment & { logs?: DeploymentLog[] }) | null;
  /** Dashboard stats */
  stats: ProjectStats | null;
  /** Environment variables for current project */
  envVars: EnvVar[];
  /** GitHub repos */
  githubRepos: GitHubRepo[];
  /** GitHub branches for selected repo */
  githubBranches: GitHubBranch[];
  /** Detected framework for selected repo */
  detectedFramework: Framework | null;
  /** Global loading state */
  isLoading: boolean;
  /** Section-specific loading */
  isLoadingDeployments: boolean;
  isLoadingEnvVars: boolean;
  isLoadingGitHub: boolean;
  /** Error message */
  error: string | null;
  /** Pagination state */
  pagination: PaginationState;
  /** Deployment pagination */
  deploymentPagination: PaginationState;

  /* Actions */
  fetchProjects: (filters?: ProjectFilters) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  fetchDeployments: (projectId: string, page?: number) => Promise<void>;
  fetchDeployment: (id: string) => Promise<void>;
  fetchDeploymentLogs: (id: string) => Promise<DeploymentLog[]>;
  triggerDeployment: (projectId: string, options?: { branch?: string }) => Promise<Deployment | null>;
  cancelDeployment: (id: string) => Promise<boolean>;
  rollbackDeployment: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  fetchEnvVars: (projectId: string) => Promise<void>;
  addEnvVar: (projectId: string, data: { key: string; value: string; target: EnvTarget }) => Promise<boolean>;
  bulkAddEnvVars: (projectId: string, vars: Array<{ key: string; value: string; target: EnvTarget }>) => Promise<boolean>;
  deleteEnvVar: (projectId: string, envVarId: string) => Promise<boolean>;
  authorizeGitHub: () => Promise<string | null>;
  fetchGitHubRepos: () => Promise<void>;
  fetchGitHubBranches: (owner: string, repo: string) => Promise<void>;
  detectFramework: (owner: string, repo: string) => Promise<Framework | null>;
  clearError: () => void;
  clearCurrentProject: () => void;
}

/**
 * Extract a human-readable error message from a caught error.
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiRequestError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  deployments: [],
  currentDeployment: null,
  stats: null,
  envVars: [],
  githubRepos: [],
  githubBranches: [],
  detectedFramework: null,
  isLoading: false,
  isLoadingDeployments: false,
  isLoadingEnvVars: false,
  isLoadingGitHub: false,
  error: null,
  pagination: { page: 1, totalPages: 1, total: 0 },
  deploymentPagination: { page: 1, totalPages: 1, total: 0 },

  fetchProjects: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (filters?.page) params.page = String(filters.page);
      if (filters?.perPage) params.perPage = String(filters.perPage);
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.framework) params.framework = filters.framework;

      const response = await api.get<PaginatedResponse<Project>>('/projects', { params });
      set({
        projects: response.data,
        pagination: {
          page: response.meta.page,
          totalPages: response.meta.totalPages,
          total: response.meta.total,
        },
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to fetch projects.'),
      });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<ProjectDetail>>(`/projects/${id}`);
      set({ currentProject: response.data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to fetch project details.'),
      });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<ApiResponse<Project>>('/projects', data);
      set((state) => ({
        projects: [response.data, ...state.projects],
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to create project.'),
      });
      return null;
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<ApiResponse<Project>>(`/projects/${id}`, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...response.data } : p)),
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...response.data }
          : state.currentProject,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to update project.'),
      });
      return false;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to delete project.'),
      });
      return false;
    }
  },

  fetchDeployments: async (projectId, page = 1) => {
    set({ isLoadingDeployments: true });
    try {
      const response = await api.get<PaginatedResponse<Deployment>>(
        `/projects/${projectId}/deployments`,
        { params: { page: String(page) } },
      );
      set({
        deployments: response.data,
        deploymentPagination: {
          page: response.meta.page,
          totalPages: response.meta.totalPages,
          total: response.meta.total,
        },
        isLoadingDeployments: false,
      });
    } catch (err) {
      set({
        isLoadingDeployments: false,
        error: getErrorMessage(err, 'Failed to fetch deployments.'),
      });
    }
  },

  fetchDeployment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Deployment & { logs?: DeploymentLog[] }>>(
        `/deployments/${id}`,
      );
      set({ currentDeployment: response.data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to fetch deployment details.'),
      });
    }
  },

  fetchDeploymentLogs: async (id) => {
    try {
      const response = await api.get<ApiResponse<DeploymentLog[]>>(`/deployments/${id}/logs`);
      return response.data;
    } catch {
      return [];
    }
  },

  triggerDeployment: async (projectId, options) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<ApiResponse<Deployment>>(
        `/projects/${projectId}/deploy`,
        options ?? {},
      );
      set((state) => ({
        deployments: [response.data, ...state.deployments],
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to trigger deployment.'),
      });
      return null;
    }
  },

  cancelDeployment: async (id) => {
    try {
      await api.post(`/deployments/${id}/cancel`);
      set((state) => ({
        deployments: state.deployments.map((d) =>
          d.id === id ? { ...d, status: DEPLOYMENT_STATUSES.CANCELLED } : d,
        ),
        currentDeployment:
          state.currentDeployment?.id === id
            ? { ...state.currentDeployment, status: DEPLOYMENT_STATUSES.CANCELLED }
            : state.currentDeployment,
      }));
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to cancel deployment.') });
      return false;
    }
  },

  rollbackDeployment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<ApiResponse<Deployment>>(`/deployments/${id}/rollback`);
      set((state) => ({
        deployments: [response.data, ...state.deployments],
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err, 'Failed to rollback deployment.'),
      });
      return false;
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get<ApiResponse<{ stats: any }>>('/projects/stats');
      const apiStats = response.data.stats;
      set({
        stats: {
          totalProjects: apiStats?.total ?? 0,
          activeProjects: apiStats?.byStatus?.ACTIVE ?? 0,
          byFramework: apiStats?.byFramework ?? {},
        },
      });
    } catch {
      // Stats are non-critical, fail silently
    }
  },

  fetchEnvVars: async (projectId) => {
    set({ isLoadingEnvVars: true });
    try {
      const response = await api.get<ApiResponse<EnvVar[]>>(`/projects/${projectId}/env`);
      set({ envVars: response.data, isLoadingEnvVars: false });
    } catch (err) {
      set({
        isLoadingEnvVars: false,
        error: getErrorMessage(err, 'Failed to fetch environment variables.'),
      });
    }
  },

  addEnvVar: async (projectId, data) => {
    try {
      const response = await api.post<ApiResponse<EnvVar>>(`/projects/${projectId}/env`, data);
      set((state) => ({ envVars: [...state.envVars, response.data] }));
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to add environment variable.') });
      return false;
    }
  },

  bulkAddEnvVars: async (projectId, vars) => {
    try {
      await api.post(`/projects/${projectId}/env/bulk`, { variables: vars });
      // Refetch to get updated list
      await get().fetchEnvVars(projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to import environment variables.') });
      return false;
    }
  },

  deleteEnvVar: async (projectId, envVarId) => {
    try {
      await api.delete(`/projects/${projectId}/env/${envVarId}`);
      set((state) => ({
        envVars: state.envVars.filter((v) => v.id !== envVarId),
      }));
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to delete environment variable.') });
      return false;
    }
  },

  authorizeGitHub: async () => {
    try {
      const response = await api.get<ApiResponse<{ url: string }>>('/projects/github/authorize');
      return response.data.url;
    } catch {
      set({ error: 'Failed to initiate GitHub authorization.' });
      return null;
    }
  },

  fetchGitHubRepos: async () => {
    set({ isLoadingGitHub: true });
    try {
      const response = await api.get<ApiResponse<GitHubRepo[]>>('/projects/github/repos');
      set({ githubRepos: response.data, isLoadingGitHub: false });
    } catch (err) {
      set({
        isLoadingGitHub: false,
        error: getErrorMessage(err, 'Failed to fetch GitHub repositories.'),
      });
    }
  },

  fetchGitHubBranches: async (owner, repo) => {
    set({ isLoadingGitHub: true });
    try {
      const response = await api.get<ApiResponse<GitHubBranch[]>>(
        `/projects/github/repos/${owner}/${repo}/branches`,
      );
      set({ githubBranches: response.data, isLoadingGitHub: false });
    } catch (err) {
      set({
        isLoadingGitHub: false,
        error: getErrorMessage(err, 'Failed to fetch branches.'),
      });
    }
  },

  detectFramework: async (owner, repo) => {
    try {
      const response = await api.get<ApiResponse<{ framework: Framework }>>(
        `/projects/github/repos/${owner}/${repo}/detect`,
      );
      const fw = response.data.framework;
      set({ detectedFramework: fw });
      return fw;
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentProject: () => set({ currentProject: null, deployments: [], envVars: [] }),
}));
