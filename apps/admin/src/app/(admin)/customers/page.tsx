'use client';

import { useEffect, useState } from 'react';
import { Users, Globe, RefreshCw, LayoutGrid, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface UserOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Application {
  id: string;
  type: string;
  domain: string;
}

interface Project {
  id: string;
  name: string;
  applications: Application[];
}

interface Subscription {
  id: string;
  status: string;
  plan: {
    name: string;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: UserOwner;
  projects: Project[];
  subscriptions: Subscription[];
}

export default function AdminCustomersPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Organization[] }>('/admin/customers');
      if (res.success) {
        setOrganizations(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Customers & Tenants
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View all tenant accounts, organization owners, subscription models, and active site distributions.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white dark:bg-gray-900/30 border border-slate-100 dark:border-gray-800 shimmer" />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-100 dark:border-gray-800 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No organizations found</h3>
          <p className="mt-1 text-sm text-gray-500">There are no customer tenant accounts registered in the database.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => {
            const activeSub = org.subscriptions.find(s => s.status === 'ACTIVE');
            const projectsCount = org.projects.length;
            const wordpressCount = org.projects.flatMap(p => p.applications).filter(app => app.type === 'WORDPRESS').length;

            return (
              <div
                key={org.id}
                className="rounded-2xl border border-slate-100 dark:border-gray-800/80 bg-white dark:bg-gray-900/40 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[180px]">
                        {org.name}
                      </h3>
                      <span className="text-xs text-gray-400 block font-mono">/{org.slug}</span>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
                        activeSub
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-500/20'
                      )}
                    >
                      {activeSub ? activeSub.plan.name : 'No active sub'}
                    </span>
                  </div>

                  {/* Owner details */}
                  <div className="mt-6 space-y-2 text-xs border-t border-gray-100 dark:border-gray-800/50 pt-4 text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400">Owner</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {org.owner ? `${org.owner.firstName} ${org.owner.lastName}` : 'System'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400">Email</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300 font-mono">
                        {org.owner?.email || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Node specs */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800/40 py-3.5 text-center text-xs">
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400 flex items-center gap-1 justify-center">
                        <LayoutGrid className="h-3 w-3" /> Projects
                      </span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200 mt-1 block">
                        {projectsCount}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400 flex items-center gap-1 justify-center">
                        <Globe className="h-3 w-3" /> WordPress
                      </span>
                      <span className="font-extrabold text-gray-800 dark:text-gray-200 mt-1 block">
                        {wordpressCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800/40 pt-4 text-[10px] text-gray-400 font-semibold">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {new Date(org.createdAt).toLocaleDateString()}</span>
                  <span className="text-gray-400 block font-mono text-[9px] truncate max-w-[80px]">ID:{org.id.slice(0,8)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
