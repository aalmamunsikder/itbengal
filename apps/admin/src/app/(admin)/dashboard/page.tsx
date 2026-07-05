'use client';

import {
  Users,
  DollarSign,
  Server,
  Rocket,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Admin stats */
const STATS = [
  {
    label: 'Total Customers',
    value: '0',
    change: '+0 this month',
    icon: Users,
    gradient: 'from-primary-500 to-primary-600',
    bgGradient: 'from-primary-500/10 to-primary-600/5',
  },
  {
    label: 'Monthly Revenue',
    value: '৳0',
    change: '+0% from last month',
    icon: DollarSign,
    gradient: 'from-success-500 to-success-600',
    bgGradient: 'from-success-500/10 to-success-600/5',
  },
  {
    label: 'Active Servers',
    value: '0',
    change: '0 healthy',
    icon: Server,
    gradient: 'from-accent-500 to-accent-600',
    bgGradient: 'from-accent-500/10 to-accent-600/5',
  },
  {
    label: 'Deployments Today',
    value: '0',
    change: '0 succeeded',
    icon: Rocket,
    gradient: 'from-warning-500 to-warning-600',
    bgGradient: 'from-warning-500/10 to-warning-600/5',
  },
] as const;

/** System services */
const SERVICES = [
  { name: 'API Server', status: 'operational' as const },
  { name: 'Build Pipeline', status: 'operational' as const },
  { name: 'DNS Service', status: 'operational' as const },
  { name: 'Database', status: 'operational' as const },
  { name: 'Redis Cache', status: 'operational' as const },
  { name: 'Email Service', status: 'operational' as const },
] as const;

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Platform overview and system health monitoring
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
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
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Health */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  System Health
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 dark:bg-success-500/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
                <span className="text-xs font-medium text-success-700 dark:text-success-400">
                  All systems operational
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {SERVICES.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-success-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {service.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium capitalize text-success-600 dark:text-success-400">
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Alerts
              </h2>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <CheckCircle2 className="h-6 w-6 text-success-500" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                No active alerts
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Everything is running smoothly
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Quick Links
            </h2>
            <div className="mt-4 space-y-2">
              {[
                { label: 'View all customers', href: '/customers' },
                { label: 'Server management', href: '/servers' },
                { label: 'Billing overview', href: '/billing' },
                { label: 'Support tickets', href: '/support' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  {link.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
