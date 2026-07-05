'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Rocket,
  Globe,
  Zap,
  Plus,
  ArrowUpRight,
  Server,
  CheckCircle2,
  GitBranch,
  GitCommit,
  Clock,
} from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import type { DeploymentStatus } from '@/stores/projectStore';

/* ============================================================================
   Deployment status styles (for recent deployments)
   ============================================================================ */

const DEPLOY_STATUS_STYLES: Record<
  DeploymentStatus,
  { label: string; className: string; dotColor: string }
> = {
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
   Quick action buttons
   ============================================================================ */

const QUICK_ACTIONS = [
  {
    label: 'New Project',
    description: 'Create a new React or WordPress project',
    icon: Plus,
    href: '/projects/new',
    gradient: 'from-primary-600 to-primary-500',
  },
  {
    label: 'View Projects',
    description: 'Manage your existing projects',
    icon: FolderGit2,
    href: '/projects',
    gradient: 'from-accent-600 to-accent-500',
  },
  {
    label: 'Add Domain',
    description: 'Connect a custom domain',
    icon: Globe,
    href: '/domains/new',
    gradient: 'from-success-600 to-success-500',
  },
] as const;

/* ============================================================================
   Skeleton Components
   ============================================================================ */

function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between animate-pulse">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded shimmer" />
              <div className="h-8 w-12 rounded shimmer" />
            </div>
            <div className="h-10 w-10 rounded-lg shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentDeploymentsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-3"
        >
          <div className="h-3 w-3 rounded-full shimmer" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-40 rounded shimmer" />
            <div className="h-3 w-28 rounded shimmer" />
          </div>
          <div className="h-4 w-16 rounded shimmer" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Main Dashboard Page
   ============================================================================ */

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName ?? 'Developer';

  const {
    stats,
    projects,
    isLoading,
    fetchStats,
    fetchProjects,
  } = useProjectStore();

  // Fetch stats and recent projects on mount
  useEffect(() => {
    fetchStats();
    fetchProjects({ perPage: 10, page: 1 });
  }, [fetchStats, fetchProjects]);

  // Derive recent deployments from projects (last 5 across all projects)
  const recentDeployments = projects
    .filter((p) => p.latestDeployment)
    .map((p) => ({
      ...p.latestDeployment!,
      project: { id: p.id, name: p.name, slug: p.slug },
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate success rate from recent deployments
  const allDeployments = projects.filter((p) => p.latestDeployment).length;
  const liveDeployments = projects.filter((p) => p.latestDeployment?.status === 'LIVE').length;
  const successRate = allDeployments > 0 ? Math.round((liveDeployments / allDeployments) * 100) : 0;

  // Stats data — use real data when available
  const statsCards = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects?.toString() ?? '0',
      change: null,
      icon: FolderGit2,
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-500/10 to-primary-600/5',
    },
    {
      label: 'Active Projects',
      value: stats?.activeProjects?.toString() ?? '0',
      change: null,
      icon: Rocket,
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-500/10 to-accent-600/5',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      change: null,
      icon: CheckCircle2,
      gradient: 'from-success-500 to-success-600',
      bgGradient: 'from-success-500/10 to-success-600/5',
    },
    {
      label: 'Current Plan',
      value: 'Free',
      change: null,
      icon: Zap,
      gradient: 'from-warning-500 to-warning-600',
      bgGradient: 'from-warning-500/10 to-warning-600/5',
    },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white shadow-lg lg:p-8">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent-500/10 blur-2xl" />
        <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm lg:block" />

        <div className="relative">
          <h1 className="text-2xl font-bold lg:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-2 max-w-lg text-primary-100/80">
            Your hosting dashboard is ready. Deploy projects, manage domains, and
            monitor your applications from one place.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              View Projects
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {isLoading && !stats ? (
        <StatsGridSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200',
                  'hover:border-gray-300 hover:shadow-card-hover',
                  'dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700',
                )}
              >
                {/* Background gradient */}
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                    stat.bgGradient,
                  )}
                />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm',
                      stat.gradient,
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Deployments */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Recent Deployments
              </h2>
              <Link
                href="/projects"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                View all
              </Link>
            </div>

            {isLoading && projects.length === 0 ? (
              <RecentDeploymentsSkeleton />
            ) : recentDeployments.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Rocket className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                  No deployments yet
                </h3>
                <p className="mt-1.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                  Deploy your first project to see deployment history and status
                  updates here.
                </p>
                <Link
                  href="/projects/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Deploy a project
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentDeployments.map((deployment) => {
                  const statusStyle = DEPLOY_STATUS_STYLES[deployment.status];
                  return (
                    <Link
                      key={deployment.id}
                      href={`/projects/${deployment.project.id}/deployments/${deployment.id}`}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {/* Status dot */}
                      <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', statusStyle.dotColor)} />

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors">
                            {deployment.project.name}
                          </span>
                          <span className={cn('text-xs font-semibold', statusStyle.className)}>
                            {statusStyle.label}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          {deployment.commitSha && (
                            <span className="inline-flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              <code className="font-mono">{deployment.commitSha.slice(0, 7)}</code>
                            </span>
                          )}
                          {deployment.commitMessage && (
                            <span className="truncate">{truncate(deployment.commitMessage, 40)}</span>
                          )}
                          {deployment.branch && (
                            <span className="inline-flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {deployment.branch}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(new Date(deployment.createdAt))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="mt-4 space-y-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-gray-700"
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm',
                        action.gradient,
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-400 dark:text-gray-600" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Server Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Server Status
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Server</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    Operational
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Build Server</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    Operational
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">DNS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                  <span className="text-sm font-medium text-success-600 dark:text-success-400">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
