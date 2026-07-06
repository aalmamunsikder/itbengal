'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Monitor, RotateCcw, FileText, Activity, Server,
  Cpu, HardDrive, RefreshCw, Loader2, AlertCircle, X
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Container {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  ports: Array<{ PrivatePort: number; PublicPort: number; Type: string }>;
  created: number;
  labels: Record<string, string>;
}

interface SystemHealth {
  containers: { total: number; running: number; stopped: number };
  docker: {
    serverVersion: string; operatingSystem: string;
    ncpu: number; memTotalGb: string; kernelVersion: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function AdminContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Logs modal state
  const [showLogsId, setShowLogsId] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [resC, resH] = await Promise.all([
        api.get<ApiResponse<Container[]>>('/admin/containers'),
        api.get<ApiResponse<SystemHealth>>('/admin/system/health'),
      ]);
      setContainers(resC.data || []);
      setHealth(resH.data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const restart = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/admin/containers/${id}/restart`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restart failed');
    } finally {
      setActionId(null);
    }
  };

  const fetchLogs = async (id: string) => {
    setLoadingLogs(true);
    setShowLogsId(id);
    try {
      const res = await api.get<ApiResponse<{ logs: string }>>(`/admin/containers/${id}/logs`);
      setContainerLogs(res.data.logs || 'No logs available');
    } catch (err) {
      setContainerLogs('Failed to fetch logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const Card = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-250 dark:border-gray-700/50 p-5 flex items-center gap-4">
      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in text-gray-800 dark:text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-500" /> Host & Containers
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor running docker engines and system resources</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* System info bar */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="OS / Kernel" icon={Server}>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{health.docker.operatingSystem}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{health.docker.kernelVersion}</p>
          </Card>
          <Card title="CPU Resources" icon={Cpu}>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{health.docker.ncpu} Cores</p>
          </Card>
          <Card title="RAM Capacity" icon={HardDrive}>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{health.docker.memTotalGb} GB</p>
          </Card>
          <Card title="Containers" icon={Activity}>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {health.containers.running} <span className="text-xs text-gray-400 font-normal">running</span> / {health.containers.total} <span className="text-xs text-gray-400 font-normal">total</span>
            </p>
          </Card>
        </div>
      )}

      {/* Container Cards */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-250 dark:border-gray-700/50 p-6 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Containers</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : containers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No Docker containers discovered on host.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {containers.map(c => {
              const name = c.names[0]?.replace(/^\//, '') || c.id.slice(0, 12);
              const isManaged = c.labels['itbengal.managed'] === 'true';
              return (
                <div key={c.id} className={cn('p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all',
                  isManaged ? 'border-primary-150 dark:border-primary-900/40 bg-primary-50/5 dark:bg-primary-950/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30')}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-950 dark:text-white truncate">{name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{c.image}</p>
                      </div>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        c.state === 'running' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                        {c.state}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-gray-500">
                      <p>Status: <span className="text-gray-700 dark:text-gray-300">{c.status}</span></p>
                      {c.ports.length > 0 && (
                        <p>Ports: <span className="font-mono text-gray-700 dark:text-gray-300">{c.ports.map(p => `${p.PublicPort ? `${p.PublicPort}→` : ''}${p.PrivatePort}`).join(', ')}</span></p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-3">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      {isManaged ? '✨ ITBengal Managed' : 'Docker Host App'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => fetchLogs(c.id)} className="p-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors" title="Logs">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => restart(c.id)} disabled={actionId === c.id} className="p-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors" title="Restart">
                        {actionId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs Modal */}
      {showLogsId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-950 text-gray-300 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col h-[550px] border border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 rounded-t-2xl">
              <span className="font-bold text-gray-200 flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-500" /> Container Logs</span>
              <button onClick={() => { setShowLogsId(null); setContainerLogs(''); }} className="p-1 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-1 bg-gray-950 scrollbar-thin select-text">
              {loadingLogs ? (
                <div className="flex items-center justify-center h-full gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching logs...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all leading-5">{containerLogs}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
