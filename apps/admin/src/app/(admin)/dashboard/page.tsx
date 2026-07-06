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
        <h1 className="text-2xl font-black text-slate-800 tracking-tight dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider dark:text-gray-400">
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
                'group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 transition-all duration-300',
                'hover:border-[#0066ff]/20 hover:shadow-[0_4px_20px_-4px_rgba(0,102,255,0.08)]',
                'dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700',
              )}
            >
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-800 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-gray-400">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    {stat.change}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0066ff] dark:bg-blue-950/50 dark:text-[#0066ff] shrink-0"
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Health */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0066ff]" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  System Health
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-500/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  All systems operational
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-gray-800">
              {SERVICES.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                      {service.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
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
          <div className="rounded-xl border border-slate-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Alerts
              </h2>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-gray-800">
                <CheckCircle2 className="h-6 w-6 text-[#0066ff]" />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-800 dark:text-white">
                No active alerts
              </p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-400">
                Everything is running smoothly
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
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
                  className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-[#0066ff] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0066ff] transition-all" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
