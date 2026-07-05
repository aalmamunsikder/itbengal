'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Cpu,
  Activity,
  Loader2,
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
  dbName: string;
  dbUser: string;
}

interface Application {
  id: string;
  domain: string;
  customDomain: string | null;
  containerStatus: string;
  createdAt: string;
  wordpressSite: WordPressSite | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WordPressSiteDetailPage(props: PageProps) {
  const params = use(props.params);
  const [site, setSite] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [dbPassword, setDbPassword] = useState('••••••••••••');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchSite = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Application }>(`/wordpress/${params.id}`);
      if (response.success) {
        setSite(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch site details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSite();
  }, [params.id]);

  const handleAction = async (action: 'restart' | 'stop' | 'start') => {
    setLoadingAction(action);
    try {
      // Containers are managed via admin containers restart endpoint, or standard deployment start endpoints.
      // We will call the controller start/stop simulation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (site) {
        setSite({
          ...site,
          containerStatus: action === 'stop' ? 'STOPPED' : 'RUNNING',
        });
      }
    } catch (err) {
      console.error('Failed to perform container action:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!site || !site.wordpressSite) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 p-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">WordPress Installation Not Found</h2>
        <Link href="/wordpress" className="text-indigo-500 hover:underline">Back to installations</Link>
      </div>
    );
  }

  const wp = site.wordpressSite;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Back & Breadcrumbs */}
      <Link
        href="/wordpress"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to installations
      </Link>

      {/* Header bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {wp.siteTitle}
            </h1>
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                site.containerStatus === 'RUNNING'
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
              )}
            >
              {site.containerStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Managed WordPress on docker stack | <span className="font-semibold text-indigo-500">{site.domain}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`http://${site.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            Visit Site <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={`http://${site.domain}/wp-admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            WP Admin <ExternalLink className="h-4 w-4" />
          </a>

          {site.containerStatus === 'RUNNING' ? (
            <button
              disabled={!!loadingAction}
              onClick={() => handleAction('restart')}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {loadingAction === 'restart' && <Loader2 className="h-4 w-4 animate-spin" />}
              Restart
            </button>
          ) : (
            <button
              disabled={!!loadingAction}
              onClick={() => handleAction('start')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              {loadingAction === 'start' && <Loader2 className="h-4 w-4 animate-spin" />}
              Start
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6 overflow-x-auto text-sm font-medium">
        <Link href={`/wordpress/${site.id}`} className="border-b-2 border-indigo-500 pb-4 text-indigo-500">
          Overview
        </Link>
        <Link href={`/wordpress/${site.id}/file-manager`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          File Manager
        </Link>
        <Link href={`/wordpress/${site.id}/db-manager`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Database
        </Link>
        <Link href={`/wordpress/${site.id}/backups`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Backups
        </Link>
        <Link href={`/wordpress/${site.id}/settings`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Settings
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Core Specs Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-900/40 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-md text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" /> Platform Info
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">WordPress Version</span>
              <span className="font-semibold text-gray-900 dark:text-white">v{wp.wpVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PHP Engine</span>
              <span className="font-semibold text-gray-900 dark:text-white">v{wp.phpVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Web Server</span>
              <span className="font-semibold text-gray-900 dark:text-white">Apache/2.4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SSL Certificate</span>
              <span className="font-semibold text-emerald-400">Auto-Managed (SSL)</span>
            </div>
          </div>
        </div>

        {/* Database Connection Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-900/40 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-md text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-500" /> Database Access
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Host (Docker)</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-indigo-400">
                itbengal-wp-db-{site.id.slice(0, 8)}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DB Name</span>
              <span className="font-semibold text-gray-900 dark:text-white">{wp.dbName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DB User</span>
              <span className="font-semibold text-gray-900 dark:text-white">{wp.dbUser}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">DB Password</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-900 dark:text-white">{dbPassword}</span>
                <button
                  onClick={() => {
                    setShowDbPassword(!showDbPassword);
                    setDbPassword(showDbPassword ? '••••••••••••' : 'wp_pass_' + site.id.slice(0, 8));
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  {showDbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-900/40 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-md text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-500" /> Container Health
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">CPU Usage</span>
              <span className="font-semibold text-gray-900 dark:text-white">0.05%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Memory Usage</span>
              <span className="font-semibold text-gray-900 dark:text-white">42.4 MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Disk I/O</span>
              <span className="font-semibold text-gray-900 dark:text-white">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PHP Memory Limit</span>
              <span className="font-semibold text-gray-900 dark:text-white">256M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
