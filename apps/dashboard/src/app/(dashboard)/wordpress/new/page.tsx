'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export default function InstallWordPressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [phpVersion, setPhpVersion] = useState('8.2');
  const [wpVersion, setWpVersion] = useState('latest');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !siteTitle || !adminUsername || !adminPassword || !adminEmail || !subdomain) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    const domain = `${subdomain.toLowerCase().trim()}.itbengal.xyz`;

    try {
      const response = await api.post<{ success: boolean; message: string }>('/wordpress', {
        name,
        siteTitle,
        adminUsername,
        adminEmail,
        domain,
        phpVersion,
        wpVersion,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/wordpress');
        }, 1500);
      } else {
        setError(response.message || 'Installation setup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize WordPress installation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Back navigation */}
      <Link
        href="/wordpress"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to installations
      </Link>

      <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-500" /> Install WordPress
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure your managed WordPress site. We will handle container provisioning, MariaDB attachment, and wp-config setting.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>WordPress setup initialized! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Specs */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Installation Name *
              </label>
              <input
                type="text"
                required
                placeholder="My WordPress Site"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Domain Name *
              </label>
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
                <input
                  type="text"
                  required
                  placeholder="blog"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  className="w-full bg-transparent px-4 py-2.5 text-sm outline-none"
                />
                <span className="bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 px-4 py-2.5 text-sm text-gray-400 font-medium flex items-center">
                  .itbengal.xyz
                </span>
              </div>
            </div>
          </div>

          {/* WordPress Metadata */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white">WordPress Site Details</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Site Title *
              </label>
              <input
                type="text"
                required
                placeholder="My Business Blog"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Username *
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Engine specifications */}
          <div className="grid gap-6 sm:grid-cols-2 border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                PHP Version
              </label>
              <select
                value={phpVersion}
                onChange={(e) => setPhpVersion(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              >
                <option value="8.1">PHP 8.1</option>
                <option value="8.2">PHP 8.2 (Recommended)</option>
                <option value="8.3">PHP 8.3</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                WordPress Version
              </label>
              <select
                value={wpVersion}
                onChange={(e) => setWpVersion(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              >
                <option value="latest">Latest Stable (v6.6.x)</option>
                <option value="6.5">WordPress 6.5</option>
                <option value="6.4">WordPress 6.4</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-505 transition-all disabled:opacity-40"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Installing WordPress...' : 'Install WordPress Site'}
          </button>
        </form>
      </div>
    </div>
  );
}
