'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  Trash2,
  Save,
  Loader2,
  AlertOctagon,
} from 'lucide-react';
import api from '@/lib/api';

interface WordPressSite {
  id: string;
  applicationId: string;
  wpVersion: string;
  phpVersion: string;
  siteTitle: string;
  siteUrl: string;
  adminEmail: string;
  adminUsername: string;
  autoUpdatesEnabled: boolean;
  cacheEnabled: boolean;
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

export default function WordPressSettingsPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [site, setSite] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Editable settings
  const [siteTitle, setSiteTitle] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [phpVersion, setPhpVersion] = useState('8.2');
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [caching, setCaching] = useState(false);
  const [baseDomain, setBaseDomain] = useState('itbengal.xyz');

  const fetchSite = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Application }>(`/wordpress/${params.id}`);
      if (response.success && response.data.wordpressSite) {
        const app = response.data;
        const wp = app.wordpressSite!;
        setSite(app);
        setSiteTitle(wp.siteTitle);
        setCustomDomain(app.customDomain || '');
        setPhpVersion(wp.phpVersion);
        setAutoUpdates(wp.autoUpdatesEnabled);
        setCaching(wp.cacheEnabled);
      }
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSite();
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          setBaseDomain(parts.slice(-2).join('.'));
        }
      }
    }
  }, [params.id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch<{ success: boolean; data: any }>(`/wordpress/${params.id}`, {
        siteTitle,
        customDomain,
        phpVersion,
        autoUpdatesEnabled: autoUpdates,
        cacheEnabled: caching,
      });
      if (res.success) {
        alert('Settings updated successfully!');
        fetchSite();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== site?.domain) {
      alert('Confirmation domain does not match.');
      return;
    }
    setDeleting(true);
    try {
      const response = await api.delete<{ success: boolean }>(`/wordpress/${params.id}`);
      if (response.success) {
        router.push('/wordpress');
      }
    } catch (err) {
      console.error('Failed to delete WordPress site:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!site || !site.wordpressSite) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 p-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">WordPress Site Not Found</h2>
        <Link href="/wordpress" className="text-primary-500 hover:underline">Back to installations</Link>
      </div>
    );
  }

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
            Configure application variables, php engines, and custom domains
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
        <Link href={`/wordpress/${params.id}/backups`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Backups
        </Link>
        <Link href={`/wordpress/${params.id}/settings`} className="border-b-2 border-primary-500 pb-4 text-primary-500">
          Settings
        </Link>
      </div>

      {/* Panels */}
      <div className="space-y-6">
        {/* Core Config form */}
        <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 p-8 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary-500" /> Site Configurations
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Site Title
              </label>
              <input
                type="text"
                required
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm focus:border-primary-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Domain Name
              </label>
              <input
                type="text"
                placeholder="my-blog.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-955 px-4 py-2.5 text-sm focus:border-primary-500 outline-none"
              />
              <p className="text-[11px] text-gray-400">
                Point your domain&apos;s CNAME record to <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-primary-400">{baseDomain}</code> to activate SSL.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                PHP Engine Version
              </label>
              <select
                value={phpVersion}
                onChange={(e) => setPhpVersion(e.target.value)}
                className="w-full rounded-xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-955 px-4 py-2.5 text-sm outline-none"
              >
                <option value="8.1">PHP 8.1</option>
                <option value="8.2">PHP 8.2</option>
                <option value="8.3">PHP 8.3</option>
              </select>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoUpdates}
                  onChange={(e) => setAutoUpdates(e.target.checked)}
                  className="rounded border-gray-350 text-primary-600 focus:ring-primary-500"
                />
                <div className="text-sm">
                  <span className="block font-medium text-gray-900 dark:text-white">Enable WordPress Auto-Updates</span>
                  <span className="block text-xs text-gray-400">Keep WordPress core updated with security patches.</span>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={caching}
                  onChange={(e) => setCaching(e.target.checked)}
                  className="rounded border-gray-350 text-primary-600 focus:ring-primary-500"
                />
                <div className="text-sm">
                  <span className="block font-medium text-gray-900 dark:text-white">Enable Page Caching</span>
                  <span className="block text-xs text-gray-400">Boost response speeds by serving static HTML cached pages.</span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-rose-500/5 rounded-2xl border border-rose-500/20 p-8 space-y-4">
          <h3 className="font-bold text-lg text-rose-500 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5" /> Danger Zone
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Deleting this managed WordPress installation will terminate all Docker containers, clean database records, and permanently wipe all files in the uploads folder and tables.
          </p>

          <form onSubmit={handleDeleteSite} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type domain <code className="bg-rose-500/10 px-1 py-0.5 rounded text-rose-500">{site.domain}</code> to confirm:
              </label>
              <input
                type="text"
                required
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={site.domain}
                className="w-full rounded-xl border border-rose-500/30 bg-white dark:bg-gray-950 px-4 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={deleting || deleteConfirm !== site.domain}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white disabled:opacity-40 transition-colors"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete WordPress Installation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
