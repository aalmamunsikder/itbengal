'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Rocket, Settings, ExternalLink, GitBranch, Clock,
  CircleDot, Triangle, Heart, Shield, Flame, Sparkles, Zap, FileCode,
  Loader2, AlertCircle, Plus, Trash2, Eye, EyeOff, Check,
  Play, RotateCcw, GitCommit, Upload, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface Application { domain: string; customDomain?: string | null; containerStatus: string; sslStatus: string }
interface Deployment {
  id: string; triggerType: string; gitCommitSha: string | null;
  gitCommitMessage: string | null; gitBranch: string | null; status: string;
  buildDurationMs: number | null; deployDurationMs: number | null;
  imageTag: string | null; errorMessage: string | null; createdAt: string;
  triggeredBy?: { firstName: string; lastName: string; email: string };
}
interface Project {
  id: string; name: string; slug: string; description: string | null;
  framework: string; gitProvider: string | null; gitRepoUrl: string | null;
  gitBranch: string; buildCommand: string | null; installCommand: string | null;
  outputDirectory: string | null; nodeVersion: string; rootDirectory: string;
  autoDeployEnabled: boolean; status: string; createdAt: string; updatedAt: string;
  applications?: Application[];
  latestDeployment?: Deployment | null;
  _count?: { deployments: number };
}
interface EnvVar {
  id: string; key: string; maskedValue: string;
  target: string; createdAt: string; updatedAt: string;
}

/* ─── Constants ─── */
const FW: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  REACT: { icon: CircleDot, color: 'text-cyan-500', label: 'React' },
  NEXTJS: { icon: Triangle, color: 'text-gray-900 dark:text-white', label: 'Next.js' },
  VUE: { icon: Heart, color: 'text-emerald-500', label: 'Vue' },
  ANGULAR: { icon: Shield, color: 'text-red-500', label: 'Angular' },
  SVELTE: { icon: Flame, color: 'text-orange-500', label: 'Svelte' },
  ASTRO: { icon: Sparkles, color: 'text-purple-500', label: 'Astro' },
  VITE: { icon: Zap, color: 'text-violet-500', label: 'Vite' },
  STATIC_HTML: { icon: FileCode, color: 'text-blue-500', label: 'Static HTML' },
};

const BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
  QUEUED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
  BUILDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DEPLOYING: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  LIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
  ROLLED_BACK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const TRIGGER_ICON: Record<string, React.ElementType> = {
  GIT_PUSH: GitCommit, MANUAL: Play, ROLLBACK: RotateCcw, ZIP_UPLOAD: Upload, WEBHOOK: Zap,
};

/* ─── Helpers ─── */
const dur = (ms: number | null) => { if (!ms) return '—'; const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; };
const ago = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };
const initials = (f: string, l: string) => `${f[0] || ''}${l[0] || ''}`.toUpperCase();

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
async function api(url: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json.data;
}

/* ══════════════════════════════════════════════ */
/*  MAIN PAGE                                     */
/* ══════════════════════════════════════════════ */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'deployments' | 'environment' | 'settings'>('overview');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); setProject(await api(`/api/v1/projects/${id}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const deploy = async () => {
    try { setDeploying(true); await api(`/api/v1/projects/${id}/deploy`, { method: 'POST', body: '{}' }); load(); }
    catch { /* ignore */ } finally { setDeploying(false); }
  };

  if (loading) return <Skeleton />;
  if (error || !project) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-gray-600 dark:text-gray-400">{error || 'Not found'}</p>
      <Link href="/projects" className="text-primary-600 hover:underline">← Back to Projects</Link>
    </div>
  );

  const fw = FW[project.framework] || FW.STATIC_HTML;
  const Icon = fw!.icon;
  const domain = project.applications?.[0]?.domain;
  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'deployments' as const, label: 'Deployments' },
    { id: 'environment' as const, label: 'Environment' },
    { id: 'settings' as const, label: 'Settings' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/projects')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', fw!.color)}>
                <Icon className="w-3.5 h-3.5" /> {fw!.label}
              </span>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', BADGE[project.status])}>{project.status}</span>
            </div>
            {domain && (
              <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mt-1">
                {domain} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={deploy} disabled={deploying}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 text-white font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:brightness-110 transition-all disabled:opacity-60">
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Deploy
          </button>
          <button onClick={() => setTab('settings')} className="p-2.5 rounded-xl border border-slate-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-slate-100 dark:border-gray-700">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === t.id ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ── */}
      {tab === 'overview' && <OverviewTab project={project} />}
      {tab === 'deployments' && <DeploymentsTab projectId={id} />}
      {tab === 'environment' && <EnvironmentTab projectId={id} />}
      {tab === 'settings' && <SettingsTab project={project} onUpdate={load} />}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  OVERVIEW TAB                                  */
/* ══════════════════════════════════════════════ */
function OverviewTab({ project }: { project: Project }) {
  const dep = project.latestDeployment;
  return (
    <div className="space-y-6">
      {/* Latest deployment */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Latest Deployment</h3>
        {dep ? (
          <Link href={`/projects/${project.id}/deployments/${dep.id}`} className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 py-2 rounded-xl transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', BADGE[dep.status])}>{dep.status}</span>
              {dep.gitCommitSha && <code className="text-sm text-gray-500 font-mono">{dep.gitCommitSha.slice(0, 7)}</code>}
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{dep.gitCommitMessage || 'Manual deployment'}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
              {dep.buildDurationMs != null && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{dur(dep.buildDurationMs)}</span>}
              <span>{ago(dep.createdAt)}</span>
            </div>
          </Link>
        ) : <p className="text-gray-500 text-sm">No deployments yet.</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Deployments', value: project._count?.deployments ?? 0 },
          { label: 'Framework', value: FW[project.framework]?.label || project.framework },
          { label: 'Node Version', value: `v${project.nodeVersion}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Project info */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Project Info</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {project.gitRepoUrl && (
            <div><dt className="text-gray-500">Repository</dt><dd className="mt-1"><a href={project.gitRepoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center gap-1">{project.gitRepoUrl.replace('https://github.com/', '')} <ExternalLink className="w-3 h-3" /></a></dd></div>
          )}
          <div><dt className="text-gray-500">Branch</dt><dd className="mt-1 flex items-center gap-1 text-gray-900 dark:text-white"><GitBranch className="w-3.5 h-3.5" /> {project.gitBranch}</dd></div>
          <div><dt className="text-gray-500">Build Command</dt><dd className="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded inline-block">{project.buildCommand || '—'}</dd></div>
          <div><dt className="text-gray-500">Output Directory</dt><dd className="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded inline-block">{project.outputDirectory || '—'}</dd></div>
          <div><dt className="text-gray-500">Auto-Deploy</dt><dd className="mt-1">{project.autoDeployEnabled ? '✓ Enabled' : '✗ Disabled'}</dd></div>
        </dl>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  DEPLOYMENTS TAB                               */
/* ══════════════════════════════════════════════ */
function DeploymentsTab({ projectId }: { projectId: string }) {
  const [deps, setDeps] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await api(`/api/v1/projects/${projectId}/deployments?page=${page}&perPage=10`);
      setDeps(d.data || d || []);
      setTotalPages(d.meta?.totalPages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId, page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  if (!deps.length) return (
    <div className="flex flex-col items-center py-16 gap-4">
      <Rocket className="w-16 h-16 text-gray-300 dark:text-gray-600" />
      <p className="text-lg font-semibold text-gray-900 dark:text-white">No deployments yet</p>
      <p className="text-sm text-gray-500">Trigger your first deployment.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {deps.map(d => {
        const TI = TRIGGER_ICON[d.triggerType] || Play;
        return (
          <button key={d.id} onClick={() => router.push(`/projects/${projectId}/deployments/${d.id}`)}
            className="w-full bg-white dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-700/50 p-4 flex items-center justify-between hover:border-primary-300 dark:hover:border-primary-600 transition-colors text-left">
            <div className="flex items-center gap-4 min-w-0">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', BADGE[d.status])}>{d.status}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {d.gitCommitSha && <code className="text-xs font-mono text-gray-500">{d.gitCommitSha.slice(0, 7)}</code>}
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{d.gitCommitMessage || 'Manual deployment'}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><TI className="w-3 h-3" />{d.triggerType.replace('_', ' ')}</span>
                  {d.gitBranch && <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{d.gitBranch}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
              {d.buildDurationMs != null && <span>{dur(d.buildDurationMs)}</span>}
              <span>{ago(d.createdAt)}</span>
              {d.triggeredBy && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {initials(d.triggeredBy.firstName, d.triggeredBy.lastName)}
                </div>
              )}
            </div>
          </button>
        );
      })}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-100 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Previous</button>
          <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-100 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  ENVIRONMENT TAB                               */
/* ══════════════════════════════════════════════ */
function EnvironmentTab({ projectId }: { projectId: string }) {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('');
  const [val, setVal] = useState('');
  const [target, setTarget] = useState('ALL');
  const [showVal, setShowVal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const load = useCallback(async () => {
    try { setLoading(true); const d = await api(`/api/v1/projects/${projectId}/env`); setVars(Array.isArray(d) ? d : d.envVars || []); }
    catch { /* ignore */ } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!key.trim() || !val.trim()) return;
    try { setSaving(true); await api(`/api/v1/projects/${projectId}/env`, { method: 'POST', body: JSON.stringify({ key: key.toUpperCase(), value: val, target }) }); setKey(''); setVal(''); load(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  const del = async (envId: string) => {
    if (!confirm('Delete this variable?')) return;
    await api(`/api/v1/projects/${projectId}/env/${envId}`, { method: 'DELETE' }); load();
  };

  const bulk = async () => {
    const parsed = bulkText.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
      const [k, ...r] = l.split('=');
      return { key: (k || '').trim().toUpperCase(), value: r.join('=').trim().replace(/^["']|["']$/g, ''), target: 'ALL' };
    }).filter(v => v.key && v.value);
    if (!parsed.length) return;
    await api(`/api/v1/projects/${projectId}/env/bulk`, { method: 'POST', body: JSON.stringify({ variables: parsed }) });
    setShowBulk(false); setBulkText(''); load();
  };

  const ic = 'w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Variable</h3>
          <button onClick={() => setShowBulk(true)} className="text-sm text-primary-600 hover:underline flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Bulk Import</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={key} onChange={e => setKey(e.target.value.toUpperCase())} placeholder="KEY_NAME" className={cn(ic, 'flex-1 font-mono')} />
          <div className="flex-1 relative">
            <input type={showVal ? 'text' : 'password'} value={val} onChange={e => setVal(e.target.value)} placeholder="Value" className={cn(ic, 'pr-10')} />
            <button onClick={() => setShowVal(!showVal)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showVal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <select value={target} onChange={e => setTarget(e.target.value)} className={cn(ic, 'w-auto')}>
            <option value="ALL">All</option><option value="PRODUCTION">Production</option><option value="PREVIEW">Preview</option>
          </select>
          <button onClick={add} disabled={saving || !key || !val} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-40 transition-colors flex items-center gap-2 whitespace-nowrap">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/50">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-50 dark:bg-gray-800" />) :
          !vars.length ? <div className="p-8 text-center text-gray-500">No environment variables set.</div> :
          vars.map(v => (
            <div key={v.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <code className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{v.key}</code>
                <code className="text-sm text-gray-400 font-mono">{v.maskedValue}</code>
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                  v.target === 'PRODUCTION' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  v.target === 'PREVIEW' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400')}>{v.target}</span>
              </div>
              <button onClick={() => del(v.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))
        }
      </div>

      {/* Bulk modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowBulk(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bulk Import</h3>
            <p className="text-sm text-gray-500 mb-3">Paste .env format (KEY=VALUE per line)</p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={10} className={cn(ic, 'font-mono resize-none')} placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=sk_live_...'} />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowBulk(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={bulk} className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  SETTINGS TAB                                  */
/* ══════════════════════════════════════════════ */
function SettingsTab({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: project.name, description: project.description || '',
    buildCommand: project.buildCommand || '', installCommand: project.installCommand || 'npm install',
    outputDirectory: project.outputDirectory || '', nodeVersion: project.nodeVersion,
    rootDirectory: project.rootDirectory, gitBranch: project.gitBranch,
    autoDeployEnabled: project.autoDeployEnabled,
  });
  const [saving, setSaving] = useState(false);
  const [delName, setDelName] = useState('');
  const [showDel, setShowDel] = useState(false);

  const save = async () => {
    try { setSaving(true); await api(`/api/v1/projects/${project.id}`, { method: 'PATCH', body: JSON.stringify(form) }); onUpdate(); }
    catch { /* ignore */ } finally { setSaving(false); }
  };
  const doDelete = async () => { await api(`/api/v1/projects/${project.id}`, { method: 'DELETE' }); router.push('/projects'); };

  const ic = 'w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-6">
      {/* General */}
      <section className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">General</h3>
        <F label="Project Name"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={ic} /></F>
        <F label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={ic} /></F>
        <F label="Slug"><input value={project.slug} disabled className={cn(ic, 'opacity-50 cursor-not-allowed')} /></F>
      </section>

      {/* Build */}
      <section className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Build & Deploy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Build Command"><input value={form.buildCommand} onChange={e => setForm(f => ({ ...f, buildCommand: e.target.value }))} className={cn(ic, 'font-mono')} /></F>
          <F label="Install Command"><input value={form.installCommand} onChange={e => setForm(f => ({ ...f, installCommand: e.target.value }))} className={cn(ic, 'font-mono')} /></F>
          <F label="Output Directory"><input value={form.outputDirectory} onChange={e => setForm(f => ({ ...f, outputDirectory: e.target.value }))} className={cn(ic, 'font-mono')} /></F>
          <F label="Root Directory"><input value={form.rootDirectory} onChange={e => setForm(f => ({ ...f, rootDirectory: e.target.value }))} className={cn(ic, 'font-mono')} /></F>
          <F label="Node Version">
            <select value={form.nodeVersion} onChange={e => setForm(f => ({ ...f, nodeVersion: e.target.value }))} className={ic}>
              <option value="18">18</option><option value="20">20</option><option value="22">22</option>
            </select>
          </F>
        </div>
      </section>

      {/* Git */}
      <section className="bg-white dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-700/50 p-6 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Git</h3>
        <F label="Repository">{project.gitRepoUrl ? <a href={project.gitRepoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm hover:underline">{project.gitRepoUrl}</a> : <span className="text-sm text-gray-400">Not connected</span>}</F>
        <F label="Branch"><input value={form.gitBranch} onChange={e => setForm(f => ({ ...f, gitBranch: e.target.value }))} className={ic} /></F>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Deploy</p><p className="text-xs text-gray-500">Deploy on push to branch</p></div>
          <button onClick={() => setForm(f => ({ ...f, autoDeployEnabled: !f.autoDeployEnabled }))} className="text-primary-600">
            {form.autoDeployEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
        </button>
      </div>

      {/* Danger */}
      <section className="bg-white dark:bg-gray-800/50 rounded-2xl border-2 border-red-200 dark:border-red-900/50 p-6">
        <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-900 dark:text-white">Delete Project</p><p className="text-xs text-gray-500">Cannot be undone.</p></div>
          <button onClick={() => setShowDel(true)} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </section>

      {showDel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete {project.name}?</h3>
            <p className="text-sm text-gray-500 mb-4">Type <strong className="text-gray-900 dark:text-white">{project.name}</strong> to confirm.</p>
            <input value={delName} onChange={e => setDelName(e.target.value)} className={ic} placeholder={project.name} />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowDel(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={doDelete} disabled={delName !== project.name} className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" /><div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" /></div>
      <div className="h-10 w-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}</div>
    </div>
  );
}
