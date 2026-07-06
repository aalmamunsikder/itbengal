'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Loader2, Monitor, Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function SessionsSettingsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<Session[]>>('/users/me/sessions');
      setSessions(res.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revoke = async (sessionId: string) => {
    if (!confirm('Revoke this session? You will be logged out of that device.')) return;
    setRevokingId(sessionId);
    setError(null);
    try {
      await api.delete(`/users/me/sessions/${sessionId}`);
      setSuccess('Session revoked successfully');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const revokeAll = async () => {
    if (!confirm('Revoke all other sessions? This will log you out of all other devices.')) return;
    setRevokingAll(true);
    setError(null);
    try {
      await api.delete('/users/me/sessions');
      setSuccess('All other sessions revoked successfully');
      // Keep only the current session
      setSessions(prev => prev.filter(s => s.isCurrent));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  const parseUA = (ua: string) => {
    if (ua.includes('Firefox/')) return 'Mozilla Firefox';
    if (ua.includes('Chrome/')) return 'Google Chrome';
    if (ua.includes('Safari/')) return 'Apple Safari';
    if (ua.includes('Edge/')) return 'Microsoft Edge';
    return 'Web Browser / App';
  };

  const parseOS = (ua: string) => {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown OS';
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary-500" /> Active Sessions
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage and revoke your active sessions on other devices</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 transition-colors" title="Reload sessions">
            <RefreshCw className="w-4 h-4" />
          </button>
          {sessions.length > 1 && (
            <button onClick={revokeAll} disabled={revokingAll} className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors">
              {revokingAll ? 'Revoking...' : 'Revoke All Others'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {sessions.map(s => (
            <div key={s.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/80 border border-gray-150 dark:border-gray-700/50 text-gray-500 shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{parseUA(s.userAgent)} on {parseOS(s.userAgent)}</span>
                    {s.isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">This Device</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>IP: {s.ipAddress}</span>
                    <span>•</span>
                    <span>Last active: {new Date(s.lastActive).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {!s.isCurrent && (
                <button onClick={() => revoke(s.id)} disabled={revokingId === s.id} className="p-2 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                  {revokingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
