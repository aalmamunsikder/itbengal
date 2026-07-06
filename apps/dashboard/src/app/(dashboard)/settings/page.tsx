'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle, User } from 'lucide-react';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await api.patch<ApiResponse<{ user: any }>>('/users/me', {
        firstName,
        lastName,
        avatarUrl: avatarUrl.trim() || null,
      });
      setUser(response.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" /> Profile Information
        </h2>
        <p className="text-sm text-gray-500 mt-1">Update your name and profile avatar</p>
      </div>

      <form onSubmit={save} className="space-y-4 max-w-md">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
          <input value={user?.email || ''} disabled className={cn(inputClass, 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800')} />
          <p className="text-xs text-gray-400 mt-1">To change your email, please contact support.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Avatar URL (Optional)</label>
          <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" className={inputClass} />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving || !firstName.trim() || !lastName.trim()} className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium text-sm flex items-center gap-2 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
