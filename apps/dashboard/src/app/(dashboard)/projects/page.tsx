'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  FolderGit2,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Filter,
  Rocket,
  X,
} from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { useProjectStore } from '@/stores/projectStore';
import type {
  Framework,
  ProjectStatus,
  DeploymentStatus,
  ProjectFilters,
} from '@/stores/projectStore';
import { FRAMEWORKS, PROJECT_STATUSES } from '@/stores/projectStore';

/* ============================================================================
   Framework display config
   ============================================================================ */

interface FrameworkConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

const FRAMEWORK_CONFIG: Record<Framework, FrameworkConfig> = {
  REACT: {
    label: 'React',
    icon: '⚛️',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50',
    darkBgColor: 'dark:bg-cyan-500/10',
  },
  NEXTJS: {
    label: 'Next.js',
    icon: '▲',
    color: 'text-gray-900 dark:text-white',
    bgColor: 'bg-gray-100',
    darkBgColor: 'dark:bg-gray-700',
  },
  VUE: {
    label: 'Vue',
    icon: '💚',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-500/10',
  },
  ANGULAR: {
    label: 'Angular',
    icon: '🅰️',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50',
    darkBgColor: 'dark:bg-red-500/10',
  },
  SVELTE: {
    label: 'Svelte',
    icon: '🔥',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50',
    darkBgColor: 'dark:bg-orange-500/10',
  },
  ASTRO: {
    label: 'Astro',
    icon: '🚀',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-500/10',
  },
  VITE: {
    label: 'Vite',
    icon: '⚡',
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50',
    darkBgColor: 'dark:bg-violet-500/10',
  },
  STATIC_HTML: {
    label: 'Static',
    icon: '📄',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50',
    darkBgColor: 'dark:bg-slate-500/10',
  },
};

/** Status badge styles */
const STATUS_STYLES: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
  },
  PAUSED: {
    label: 'Paused',
    className: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
};

/** Deployment status badge styles */
const DEPLOY_STATUS_STYLES: Record<DeploymentStatus, { label: string; className: string; dotColor: string }> = {
  QUEUED: {
    label: 'Queued',
    className: 'text-gray-600 dark:text-gray-400',
    dotColor: 'bg-gray-400',
  },
  BUILDING: {
    label: 'Building',
    className: 'text-warning-600 dark:text-warning-400',
    dotColor: 'bg-warning-500 animate-pulse-soft',
  },
  DEPLOYING: {
    label: 'Deploying',
    className: 'text-primary-600 dark:text-primary-400',
    dotColor: 'bg-primary-500 animate-pulse-soft',
  },
  LIVE: {
    label: 'Live',
    className: 'text-success-600 dark:text-success-400',
    dotColor: 'bg-success-500',
  },
  FAILED: {
    label: 'Failed',
    className: 'text-danger-600 dark:text-danger-400',
    dotColor: 'bg-danger-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'text-gray-500 dark:text-gray-400',
    dotColor: 'bg-gray-400',
  },
  ROLLED_BACK: {
    label: 'Rolled Back',
    className: 'text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500',
  },
};

/* ============================================================================
   Loading Skeleton
   ============================================================================ */

function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats bar skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl shimmer" />
        ))}
      </div>

      {/* Controls skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 max-w-sm rounded-xl shimmer" />
        <div className="h-10 w-32 rounded-xl shimmer" />
        <div className="h-10 w-32 rounded-xl shimmer" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl shimmer" />
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   Empty State
   ============================================================================ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-20 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10">
        <FolderGit2 className="h-8 w-8 text-primary-500" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
        No projects yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Deploy your first project from GitHub or start with a template.
        It only takes a few minutes to get your app live.
      </p>
      <Link
        href="/projects/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:from-primary-700 hover:to-primary-600"
      >
        <Plus className="h-4 w-4" />
        Create your first project
      </Link>
    </div>
  );
}

/* ============================================================================
   Main Page Component
   ============================================================================ */

export default function ProjectsPage() {
  const {
    projects,
    stats,
    isLoading,
    pagination,
    fetchProjects,
    fetchStats,
  } = useProjectStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [frameworkFilter, setFrameworkFilter] = useState<Framework | ''>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch projects when filters change
  const loadProjects = useCallback(
    (page = 1) => {
      const filters: ProjectFilters = { page, perPage: 12 };
      if (debouncedSearch) filters.search = debouncedSearch;
      if (statusFilter) filters.status = statusFilter as ProjectStatus;
      if (frameworkFilter) filters.framework = frameworkFilter as Framework;
      fetchProjects(filters);
    },
    [debouncedSearch, statusFilter, frameworkFilter, fetchProjects],
  );

  useEffect(() => {
    loadProjects(1);
  }, [loadProjects]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFrameworkFilter('');
  };

  const hasActiveFilters = search || statusFilter || frameworkFilter;

  if (isLoading && projects.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and deploy your applications
            </p>
          </div>
        </div>
        <ProjectsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and deploy your applications
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:from-primary-700 hover:to-primary-600"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
                <FolderGit2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-success-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-success-500 to-success-600 shadow-sm">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-card-hover dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 shadow-sm">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Frameworks</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(stats.byFramework)
                    .filter(([, count]) => count > 0)
                    .slice(0, 4)
                    .map(([fw, count]) => (
                      <span
                        key={fw}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {FRAMEWORK_CONFIG[fw as Framework]?.icon}{' '}
                        {count}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All Statuses</option>
          {Object.entries(PROJECT_STATUSES).map(([key, value]) => (
            <option key={key} value={value}>
              {STATUS_STYLES[value].label}
            </option>
          ))}
        </select>

        {/* Framework filter */}
        <select
          value={frameworkFilter}
          onChange={(e) => setFrameworkFilter(e.target.value as Framework | '')}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All Frameworks</option>
          {Object.entries(FRAMEWORKS).map(([key, value]) => (
            <option key={key} value={value}>
              {FRAMEWORK_CONFIG[value].icon} {FRAMEWORK_CONFIG[value].label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const app = project.applications?.[0];
              const fw = app ? FRAMEWORK_CONFIG[app.framework] : null;
              const statusStyle = STATUS_STYLES[project.status];
              const deployment = project.latestDeployment;
              const deployStyle = deployment
                ? DEPLOY_STATUS_STYLES[deployment.status]
                : null;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200',
                    'hover:border-primary-200 hover:shadow-card-hover hover:-translate-y-0.5',
                    'dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800',
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.02] to-accent-500/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative">
                    {/* Header: Framework icon + Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {fw && (
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-xl text-lg',
                              fw.bgColor,
                              fw.darkBgColor,
                            )}
                          >
                            {fw.icon}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {project.slug}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'badge',
                          statusStyle.className,
                        )}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {truncate(project.description, 80)}
                      </p>
                    )}

                    {/* Framework badge */}
                    {fw && (
                      <div className="mt-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium',
                            fw.bgColor,
                            fw.darkBgColor,
                            fw.color,
                          )}
                        >
                          {fw.icon} {fw.label}
                        </span>
                      </div>
                    )}

                    {/* Footer: Deployment info */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                      {deployment && deployStyle ? (
                        <div className="flex items-center gap-1.5">
                          <div className={cn('h-2 w-2 rounded-full', deployStyle.dotColor)} />
                          <span className={cn('text-xs font-medium', deployStyle.className)}>
                            {deployStyle.label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            · {formatRelativeTime(new Date(deployment.createdAt))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          No deployments
                        </span>
                      )}

                      {project.gitBranch && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <GitBranch className="h-3 w-3" />
                          {project.gitBranch}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-white">{projects.length}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> projects
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadProjects(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => loadProjects(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
