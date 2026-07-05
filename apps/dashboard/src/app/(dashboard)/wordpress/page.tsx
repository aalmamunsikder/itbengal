'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Globe,
  Settings,
  Database,
  FolderOpen,
  History,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface WordPressSite {
  id: string;
  applicationId: string;
  wpVersion: string;
  phpVersion: string;
  siteTitle: string;
  siteUrl: string;
  adminEmail: string;
  adminUsername: string;
}

interface Application {
  id: string;
  domain: string;
  customDomain: string | null;
  containerStatus: string;
  createdAt: string;
  wordpressSite: WordPressSite | null;
}

export default function WordPressPage() {
  const [sites, setSites] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Application[] }>('/wordpress');
      if (response.success) {
        setSites(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch WordPress sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this WordPress installation? This will permanently erase all files and databases.')) {
      return;
    }
    setDeletingId(id);
    try {
      const response = await api.delete<{ success: boolean }>(`/wordpress/${id}`);
      if (response.success) {
        setSites((prev) => prev.filter((site) => site.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete WordPress site:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.wordpressSite?.siteTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'RUNNING' && site.containerStatus === 'RUNNING') ||
      (statusFilter === 'STOPPED' && site.containerStatus !== 'RUNNING');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Managed WordPress
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            One-click WordPress installations with high performance, automatic backups, files, and DB management.
          </p>
        </div>
        <Link
          href="/wordpress/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" /> Install WordPress
        </Link>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search installations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">Running Only</option>
            <option value="STOPPED">Stopped / Error</option>
          </select>
          <button
            onClick={fetchSites}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:bg-gray-55 hover:dark:bg-gray-800/50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900/30 p-6 shimmer" />
          ))}
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No installations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by installing your first managed WordPress site.
          </p>
          <div className="mt-6">
            <Link
              href="/wordpress/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Install WordPress
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="group relative rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-900/40 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[180px]">
                      {site.wordpressSite?.siteTitle || 'WordPress Site'}
                    </h3>
                    <a
                      href={`http://${site.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:underline inline-flex items-center gap-1"
                    >
                      {site.domain} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                      site.containerStatus === 'RUNNING'
                        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                    )}
                  >
                    {site.containerStatus}
                  </span>
                </div>

                {/* Specs */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-gray-150 dark:border-gray-800 py-3 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-400">WP Version</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      v{site.wordpressSite?.wpVersion || 'latest'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-400">PHP Version</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      PHP {site.wordpressSite?.phpVersion || '8.2'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-6 flex items-center justify-between gap-1 border-t border-gray-100 dark:border-gray-800/50 pt-4">
                <div className="flex gap-1">
                  <Link
                    href={`/wordpress/${site.id}/file-manager`}
                    title="File Explorer"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    <FolderOpen className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href={`/wordpress/${site.id}/db-manager`}
                    title="Database Explorer"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    <Database className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href={`/wordpress/${site.id}/backups`}
                    title="Backups & Restoration"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    <History className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href={`/wordpress/${site.id}/settings`}
                    title="Site Settings"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    <Settings className="h-4.5 w-4.5" />
                  </Link>
                </div>

                <button
                  disabled={deletingId === site.id}
                  onClick={() => handleDelete(site.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
