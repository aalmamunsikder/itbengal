'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, GitBranch, Clock, CheckCircle2, XCircle, Loader2,
  AlertCircle, Circle, Copy, Check, ArrowDown, Play, RotateCcw,
  GitCommit, Upload, Zap, Minus, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeploymentLogs } from '@/hooks/useDeploymentLogs';

/* ─── Types ─── */
interface Deployment {
  id: string; triggerType: string; gitCommitSha: string | null;
  gitCommitMessage: string | null; gitBranch: string | null; status: string;
  buildDurationMs: number | null; deployDurationMs: number | null;
  imageTag: string | null; containerPort: number | null;
  errorMessage: string | null; createdAt: string; updatedAt: string;
  triggeredBy?: { firstName: string; lastName: string; email: string };
}

/* ─── Helpers ─── */
const dur = (ms: number | null) => { if (!ms) return '—'; const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; };
const ago = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; };
const initials = (f: string, l: string) => `${f[0] || ''}${l[0] || ''}`.toUpperCase();
const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
async function api(url: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed');
  return json.data;
}

/* ─── Status badge styles ─── */
const BADGE: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
  BUILDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DEPLOYING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  LIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
  ROLLED_BACK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  GIT_PUSH: GitCommit, MANUAL: Play, ROLLBACK: RotateCcw, ZIP_UPLOAD: Upload, WEBHOOK: Zap,
};

/* ─── Pipeline steps ─── */
const STEPS = ['QUEUED', 'BUILDING', 'DEPLOYING', 'LIVE'] as const;
function getStepState(step: string, current: string) {
  const si = STEPS.indexOf(step as typeof STEPS[number]);
  const ci = STEPS.indexOf(current as typeof STEPS[number]);
  if (current === 'FAILED') return si < ci ? 'done' : si === ci ? 'failed' : 'pending';
  if (current === 'CANCELLED') return si < ci ? 'done' : si === ci ? 'cancelled' : 'pending';
  if (current === 'ROLLED_BACK') return 'done';
  if (si < ci) return 'done';
  if (si === ci) return 'active';
  return 'pending';
}

/* ─── Log level colors ─── */
const LOG_COLORS: Record<string, string> = {
  INFO: 'text-gray-400', WARN: 'text-amber-400', ERROR: 'text-red-400', DEBUG: 'text-blue-400', SUCCESS: 'text-emerald-400',
};
const SOURCE_COLORS: Record<string, string> = {
  BUILD: 'bg-blue-500/20 text-blue-400', DEPLOY: 'bg-indigo-500/20 text-indigo-400', HEALTH: 'bg-emerald-500/20 text-emerald-400',
};

/* ════════════════════════════════════════════ */
/*  MAIN PAGE                                   */
/* ════════════════════════════════════════════ */
export default function DeploymentDetailPage() {
  const { id: projectId, deploymentId } = useParams<{ id: string; deploymentId: string }>();
  const router = useRouter();
  const [dep, setDep] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRollback, setShowRollback] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isInProgress = dep && ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(dep.status);

  // Hook for streaming logs
  const { logs, isConnected, connectionMode, reconnect } = useDeploymentLogs(deploymentId, !!isInProgress);

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/v1/deployments/${deploymentId}`);
      setDep(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Poll deployment state (metadata only, logs are handled by hook)
  useEffect(() => {
    if (isInProgress) {
      pollRef.current = setInterval(load, 3000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [isInProgress, load]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const copyLogs = () => {
    const text = logs.map(l => `[${fmtTime(l.timestamp)}] [${l.source}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const cancelDep = async () => {
    await api(`/api/v1/deployments/${deploymentId}/cancel`, { method: 'POST' });
    setShowCancel(false); load();
  };

  const rollbackDep = async () => {
    const newDep = await api(`/api/v1/deployments/${deploymentId}/rollback`, { method: 'POST' });
    setShowRollback(false);
    router.push(`/projects/${projectId}/deployments/${newDep.id}`);
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" /><div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded-lg" /></div>
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
    </div>
  );

  if (error || !dep) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-gray-600 dark:text-gray-400">{error || 'Not found'}</p>
      <Link href={`/projects/${projectId}`} className="text-indigo-600 hover:underline">← Back to Project</Link>
    </div>
  );

  const TI = TRIGGER_ICONS[dep.triggerType] || Play;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push(`/projects/${projectId}`)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-0.5">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Deployment <code className="text-lg font-mono text-indigo-600 dark:text-indigo-400">#{dep.id.slice(0, 8)}</code>
              </h1>
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', BADGE[dep.status])}>{dep.status}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
              {dep.gitCommitSha && (
                <span className="flex items-center gap-1">
                  <GitCommit className="w-3.5 h-3.5" />
                  <code className="font-mono">{dep.gitCommitSha.slice(0, 7)}</code>
                  {dep.gitCommitMessage && <span className="text-gray-400 truncate max-w-[200px]">{dep.gitCommitMessage}</span>}
                </span>
              )}
              {dep.gitBranch && <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{dep.gitBranch}</span>}
              <span className="flex items-center gap-1"><TI className="w-3.5 h-3.5" />{dep.triggerType.replace('_', ' ')}</span>
              {dep.triggeredBy && (
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[8px] font-bold text-white">
                    {initials(dep.triggeredBy.firstName, dep.triggeredBy.lastName)}
                  </span>
                  {dep.triggeredBy.firstName} {dep.triggeredBy.lastName}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ago(dep.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isInProgress && (
            <button onClick={() => setShowCancel(true)} className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Cancel
            </button>
          )}
          {dep.status === 'LIVE' && (
            <button onClick={() => setShowRollback(true)} className="px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-600 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Rollback
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline Timeline ── */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="absolute top-5 left-8 h-0.5 bg-indigo-500 transition-all duration-500" style={{
            width: `${Math.max(0, (STEPS.indexOf(dep.status as typeof STEPS[number]) / (STEPS.length - 1)) * 100)}%`,
            maxWidth: 'calc(100% - 4rem)'
          }} />

          {STEPS.map((step) => {
            const state = getStepState(step, dep.status);
            return (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  state === 'done' ? 'bg-emerald-500 border-emerald-500' :
                  state === 'active' ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/30 animate-pulse' :
                  state === 'failed' ? 'bg-red-500 border-red-500' :
                  state === 'cancelled' ? 'bg-gray-400 border-gray-400' :
                  'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600')}>
                  {state === 'done' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  {state === 'active' && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                  {state === 'failed' && <XCircle className="w-5 h-5 text-white" />}
                  {state === 'cancelled' && <Minus className="w-5 h-5 text-white" />}
                  {state === 'pending' && <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                </div>
                <span className={cn('text-xs font-medium', state === 'active' ? 'text-indigo-600 dark:text-indigo-400' : state === 'done' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400')}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Terminal Log Viewer ── */}
        <div className="lg:col-span-3">
          <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-medium text-gray-400">Build Logs</span>
                
                {/* WebSocket log status indicator */}
                {isInProgress && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
                    <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                      {connectionMode === 'websocket' ? 'Live Stream' : 'Polling fallback'}
                    </span>
                    {!isConnected && (
                      <button onClick={reconnect} className="ml-1 text-gray-400 hover:text-white transition-colors" title="Reconnect stream">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors" title="Scroll to bottom">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={copyLogs} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors" title="Copy logs">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Log content */}
            <div ref={logRef} className="p-4 h-[500px] overflow-y-auto font-mono text-sm space-y-0.5 scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800">
              {!logs.length ? (
                <div className="flex items-center justify-center h-full text-gray-600">
                  {isInProgress ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Waiting for logs...</span>
                  ) : 'No logs available'}
                </div>
              ) : logs.map((log, i) => (
                <div key={log.id || i} className="flex gap-3 py-0.5 hover:bg-gray-900/50 px-1 -mx-1 rounded group">
                  <span className="text-gray-700 select-none w-8 text-right shrink-0 text-xs leading-5">{i + 1}</span>
                  <span className="text-gray-600 shrink-0 text-xs leading-5 w-16">{fmtTime(log.timestamp)}</span>
                  <span className={cn('px-1.5 py-0 rounded text-[10px] font-semibold uppercase shrink-0 leading-5', SOURCE_COLORS[log.source] || 'bg-gray-800 text-gray-400')}>{log.source}</span>
                  <span className={cn('leading-5 whitespace-pre-wrap break-all', LOG_COLORS[log.level] || 'text-gray-300')}>{log.message}</span>
                </div>
              ))}
              {isInProgress && (
                <div className="flex items-center gap-2 text-gray-600 pt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="animate-pulse">█</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar Metadata ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-gray-500">Build Duration</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{dur(dep.buildDurationMs)}</dd></div>
              <div><dt className="text-gray-500">Deploy Duration</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{dur(dep.deployDurationMs)}</dd></div>
              <div><dt className="text-gray-500">Trigger</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1"><TI className="w-3.5 h-3.5" />{dep.triggerType.replace('_', ' ')}</dd></div>
              {dep.imageTag && <div><dt className="text-gray-500">Image Tag</dt><dd className="font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-0.5 break-all">{dep.imageTag}</dd></div>}
              {dep.containerPort && <div><dt className="text-gray-500">Port</dt><dd className="font-semibold text-gray-900 dark:text-white mt-0.5">{dep.containerPort}</dd></div>}
            </dl>
          </div>

          {dep.errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-5">
              <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Error</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{dep.errorMessage}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timing</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Created</dt><dd className="text-gray-900 dark:text-white mt-0.5">{new Date(dep.createdAt).toLocaleString()}</dd></div>
              <div><dt className="text-gray-500">Updated</dt><dd className="text-gray-900 dark:text-white mt-0.5">{new Date(dep.updatedAt).toLocaleString()}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      {/* ── Cancel Modal ── */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cancel Deployment?</h3>
            <p className="text-sm text-gray-500 mb-4">This will stop the current build.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancel(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">No, keep it</button>
              <button onClick={cancelDep} className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Cancel Deploy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rollback Modal ── */}
      {showRollback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rollback?</h3>
            <p className="text-sm text-gray-500 mb-4">This will create a new deployment from this version.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRollback(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={rollbackDep} className="px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
