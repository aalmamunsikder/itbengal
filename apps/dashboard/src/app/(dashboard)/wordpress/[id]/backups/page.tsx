'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  History,
  Trash2,
  RefreshCw,
  Loader2,
  Database,
  FileCode,
  FileArchive,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface Backup {
  id: string;
  type: 'FULL' | 'DATABASE_ONLY' | 'FILES_ONLY';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'DELETED';
  sizeBytes: number | null;
  triggeredBy: 'SCHEDULED' | 'MANUAL' | 'SYSTEM';
  completedAt: string | null;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WordPressBackupsPage(props: PageProps) {
  const params = use(props.params);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState('WordPress Site');
  const [backupType, setBackupType] = useState<'FULL' | 'DATABASE_ONLY' | 'FILES_ONLY'>('FULL');

  const fetchBackups = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Backup[] }>(`/wordpress/${params.id}/backups`);
      if (res.success) {
        setBackups(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    }
  };

  const fetchSiteTitle = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: any }>(`/wordpress/${params.id}`);
      if (res.success && res.data.wordpressSite) {
        setSiteTitle(res.data.wordpressSite.siteTitle);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteTitle();
    fetchBackups();
  }, [params.id]);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post<{ success: boolean; data: Backup }>(
        `/wordpress/${params.id}/backups`,
        { type: backupType }
      );
      if (res.success) {
        fetchBackups();
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm('Warning: Restoring this backup will overwrite current files and database tables. Do you want to proceed?')) {
      return;
    }
    setRestoringId(backupId);
    try {
      const res = await api.post<{ success: boolean }>(`/wordpress/backups/${backupId}/restore`);
      if (res.success) {
        alert('Site restored successfully!');
      }
    } catch (err: any) {
      alert(`Restoration failed: ${err.message}`);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm('Are you sure you want to permanently delete this backup archive?')) {
      return;
    }
    try {
      const res = await api.delete<{ success: boolean }>(`/wordpress/backups/${backupId}`);
      if (res.success) {
        setBackups((prev) => prev.filter((b) => b.id !== backupId));
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Navigation */}
      <Link
        href="/wordpress"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to installations
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {siteTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Managed database & file backups orchestrator
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 dark:border-gray-800 gap-6 overflow-x-auto text-sm font-medium">
        <Link href={`/wordpress/${params.id}`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Overview
        </Link>
        <Link href={`/wordpress/${params.id}/file-manager`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          File Manager
        </Link>
        <Link href={`/wordpress/${params.id}/db-manager`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Database
        </Link>
        <Link href={`/wordpress/${params.id}/backups`} className="border-b-2 border-primary-500 pb-4 text-primary-500">
          Backups
        </Link>
        <Link href={`/wordpress/${params.id}/settings`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Settings
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Creator Widget */}
          <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 p-6 space-y-4 shadow-sm h-fit">
            <h3 className="font-semibold text-md text-gray-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-primary-500" /> Take New Backup
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create an encrypted backup of your database tables or file structure. Archives are retained for 7 days.
            </p>
            <form onSubmit={handleCreateBackup} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Backup Scope
                </label>
                <select
                  value={backupType}
                  onChange={(e: any) => setBackupType(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                >
                  <option value="FULL">Full Backup (DB + Files)</option>
                  <option value="DATABASE_ONLY">Database Only</option>
                  <option value="FILES_ONLY">wp-content Only</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors disabled:opacity-40"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? 'Creating Backup...' : 'Backup Now'}
              </button>
            </form>
          </div>

          {/* Backups List */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Backup Archives</h3>
              <button
                onClick={fetchBackups}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-100 dark:border-gray-800 p-12 text-center">
                <FileArchive className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No backups yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Trigger your first backup manually, or set up scheduled daily runs in settings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 shadow-xs hover:shadow-sm transition-all gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-400">
                        {b.type === 'DATABASE_ONLY' ? (
                          <Database className="h-5 w-5" />
                        ) : b.type === 'FILES_ONLY' ? (
                          <FileCode className="h-5 w-5" />
                        ) : (
                          <FileArchive className="h-5 w-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {b.type === 'DATABASE_ONLY'
                              ? 'Database Backup'
                              : b.type === 'FILES_ONLY'
                              ? 'Files Backup'
                              : 'Full System Backup'}
                          </span>
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                            {b.triggeredBy}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(b.createdAt).toLocaleString()} | {formatSize(b.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      {b.status === 'COMPLETED' ? (
                        <>
                          <button
                            disabled={restoringId === b.id}
                            onClick={() => handleRestore(b.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-xs font-semibold text-primary-400 hover:bg-primary-600 hover:text-white transition-all disabled:opacity-40"
                          >
                            {restoringId === b.id && <Loader2 className="h-3 w-3 animate-spin" />}
                            Restore
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </>
                      ) : b.status === 'FAILED' ? (
                        <span className="text-xs text-rose-500 font-semibold inline-flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> Failed
                        </span>
                      ) : (
                        <span className="text-xs text-primary-400 font-semibold flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
