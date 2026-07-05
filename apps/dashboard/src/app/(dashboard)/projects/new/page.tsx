'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Github,
  Search,
  Lock,
  Globe,
  GitBranch,
  Trash2,
  Plus,
  Upload,
  Rocket,
  Loader2,
  FileText,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type {
  Framework,
  EnvTarget,
  GitHubRepo,
  CreateProjectData,
} from '@/stores/projectStore';
import { FRAMEWORKS, ENV_TARGETS } from '@/stores/projectStore';

/* ============================================================================
   Framework display config (duplicated here to keep page self-contained)
   ============================================================================ */

interface FrameworkDisplayConfig {
  label: string;
  icon: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
}

const FRAMEWORK_DEFAULTS: Record<Framework, FrameworkDisplayConfig> = {
  REACT: { label: 'React', icon: '⚛️', buildCommand: 'npm run build', outputDirectory: 'build', installCommand: 'npm install' },
  NEXTJS: { label: 'Next.js', icon: '▲', buildCommand: 'npm run build', outputDirectory: '.next', installCommand: 'npm install' },
  VUE: { label: 'Vue', icon: '💚', buildCommand: 'npm run build', outputDirectory: 'dist', installCommand: 'npm install' },
  ANGULAR: { label: 'Angular', icon: '🅰️', buildCommand: 'npm run build', outputDirectory: 'dist', installCommand: 'npm install' },
  SVELTE: { label: 'Svelte', icon: '🔥', buildCommand: 'npm run build', outputDirectory: 'build', installCommand: 'npm install' },
  ASTRO: { label: 'Astro', icon: '🚀', buildCommand: 'npm run build', outputDirectory: 'dist', installCommand: 'npm install' },
  VITE: { label: 'Vite', icon: '⚡', buildCommand: 'npm run build', outputDirectory: 'dist', installCommand: 'npm install' },
  STATIC_HTML: { label: 'Static HTML', icon: '📄', buildCommand: '', outputDirectory: '.', installCommand: '' },
};

const NODE_VERSIONS = ['18', '20', '22'] as const;

/* ============================================================================
   Step indicator
   ============================================================================ */

const STEPS = [
  { id: 1, label: 'Source', description: 'Choose repository' },
  { id: 2, label: 'Configure', description: 'Build settings' },
  { id: 3, label: 'Environment', description: 'Variables' },
  { id: 4, label: 'Review', description: 'Deploy' },
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-0 right-0 top-4 hidden h-0.5 bg-gray-200 dark:bg-gray-700 sm:block" />

      <div className="relative flex justify-between">
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                  isCompleted
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : isCurrent
                      ? 'border-primary-600 bg-white text-primary-600 ring-4 ring-primary-100 dark:bg-gray-900 dark:ring-primary-500/20'
                      : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    'text-xs font-medium sm:text-sm',
                    isCurrent || isCompleted
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {step.label}
                </p>
                <p className="hidden text-xs text-gray-400 dark:text-gray-500 sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   Step 1: Source selection
   ============================================================================ */

function StepSource({
  onSelectRepo,
  onSelectTemplate,
  onSelectZip,
}: {
  onSelectRepo: (repo: GitHubRepo) => void;
  onSelectTemplate: (framework: Framework) => void;
  onSelectZip: (fileName: string, zipPath: string) => void;
}) {
  const {
    githubRepos,
    isLoadingGitHub,
    authorizeGitHub,
    fetchGitHubRepos,
  } = useProjectStore();

  const [mode, setMode] = useState<'select' | 'github' | 'template' | 'zip'>('select');
  const [repoSearch, setRepoSearch] = useState('');
  const [hasConnected, setHasConnected] = useState(false);

  useEffect(() => {
    if (hasConnected) {
      console.log('GitHub connection initiated');
    }
  }, [hasConnected]);

  const filteredRepos = useMemo(
    () =>
      githubRepos.filter((repo) =>
        repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(repoSearch.toLowerCase()),
      ),
    [githubRepos, repoSearch],
  );

  const handleConnectGitHub = async () => {
    const url = await authorizeGitHub();
    if (url) {
      window.open(url, '_blank', 'width=600,height=700');
      // Poll for repos after OAuth flow
      setHasConnected(true);
      setTimeout(() => fetchGitHubRepos(), 3000);
    }
  };

  useEffect(() => {
    if (mode === 'github') {
      fetchGitHubRepos();
    }
  }, [mode, fetchGitHubRepos]);

  if (mode === 'select') {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {/* GitHub import */}
        <button
          onClick={() => setMode('github')}
          className={cn(
            'group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all duration-200',
            'hover:border-primary-300 hover:shadow-lg',
            'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-600',
          )}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary-500/10 to-transparent transition-transform group-hover:scale-150" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 dark:bg-white">
              <Github className="h-7 w-7 text-white dark:text-gray-900" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Import from GitHub
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Connect your GitHub account and import an existing repository.
            </p>
          </div>
        </button>

        {/* Upload ZIP Archive */}
        <button
          onClick={() => setMode('zip')}
          className={cn(
            'group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all duration-200',
            'hover:border-primary-300 hover:shadow-lg',
            'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-600',
          )}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary-500/10 to-transparent transition-transform group-hover:scale-150" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Upload ZIP Archive
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Deploy your static web pages or React package directly from a ZIP file.
            </p>
          </div>
        </button>

        {/* Template */}
        <button
          onClick={() => setMode('template')}
          className={cn(
            'group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all duration-200',
            'hover:border-accent-300 hover:shadow-lg',
            'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-accent-600',
          )}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-accent-500/10 to-transparent transition-transform group-hover:scale-150" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Start from Template
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Choose a framework template and start with a fresh project.
            </p>
          </div>
        </button>
      </div>
    );
  }

  if (mode === 'zip') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode('select')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upload ZIP Package
        </h3>
        
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <Upload className="h-10 w-10 text-gray-400 animate-bounce mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Select project ZIP file to upload</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">Supported formats: .zip (max 50MB)</p>
          
          <input
            type="file"
            accept=".zip"
            id="zip-upload-input"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const formData = new FormData();
              formData.append('file', file);
              
              setHasConnected(true); // Reuse state as upload loading indicator
              try {
                const res = await api.post<{ success: boolean; data: { zipPath: string } }>('/projects/upload-zip', formData);
                if (res.success && res.data.zipPath) {
                  onSelectZip(file.name, res.data.zipPath);
                }
              } catch (err: any) {
                alert(err.message || 'File upload failed');
              } finally {
                setHasConnected(false);
              }
            }}
          />
          
          <label
            htmlFor="zip-upload-input"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-all shadow-md shadow-primary-500/20"
          >
            {hasConnected ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {hasConnected ? 'Uploading...' : 'Choose File'}
          </label>
        </div>
      </div>
    );
  }

  if (mode === 'template') {
    return (
      <div>
        <button
          onClick={() => setMode('select')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose a Framework
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(FRAMEWORK_DEFAULTS).map(([key, fw]) => (
            <button
              key={key}
              onClick={() => onSelectTemplate(key as Framework)}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all duration-200',
                'hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5',
                'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-600',
              )}
            >
              <span className="text-3xl">{fw.icon}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {fw.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // GitHub mode
  return (
    <div>
      <button
        onClick={() => setMode('select')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {githubRepos.length === 0 && !isLoadingGitHub ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 dark:bg-white">
            <Github className="h-8 w-8 text-white dark:text-gray-900" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
            Connect GitHub
          </h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Authorize ITBengal to access your GitHub repositories for seamless deployments.
          </p>
          <button
            onClick={handleConnectGitHub}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <Github className="h-4 w-4" />
            Connect GitHub Account
          </button>
        </div>
      ) : (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {isLoadingGitHub ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl scrollbar-hidden">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onSelectRepo(repo)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all',
                    'hover:border-primary-300 hover:bg-primary-50/50',
                    'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-600 dark:hover:bg-primary-500/5',
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {repo.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {repo.language && <span>{repo.language} · </span>}
                      Updated {new Date(repo.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {repo.isPrivate ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-gray-400" />
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                  </div>
                </button>
              ))}
              {filteredRepos.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No repositories found matching &ldquo;{repoSearch}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Step 2: Configuration
   ============================================================================ */

interface ConfigData {
  name: string;
  framework: Framework;
  branch: string;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
  nodeVersion: string;
  rootDirectory: string;
}

function StepConfigure({
  config,
  onChange,
  selectedRepo,
}: {
  config: ConfigData;
  onChange: (data: Partial<ConfigData>) => void;
  selectedRepo: GitHubRepo | null;
}) {
  const { githubBranches, fetchGitHubBranches } = useProjectStore();

  useEffect(() => {
    if (selectedRepo) {
      fetchGitHubBranches(selectedRepo.owner, selectedRepo.name);
    }
  }, [selectedRepo, fetchGitHubBranches]);

  const handleFrameworkChange = (fw: Framework) => {
    const defaults = FRAMEWORK_DEFAULTS[fw];
    onChange({
      framework: fw,
      buildCommand: defaults.buildCommand,
      installCommand: defaults.installCommand,
      outputDirectory: defaults.outputDirectory,
    });
  };

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Project Name
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="my-awesome-project"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Framework */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Framework
          </label>
          <div className="relative">
            <select
              value={config.framework}
              onChange={(e) => handleFrameworkChange(e.target.value as Framework)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {Object.entries(FRAMEWORK_DEFAULTS).map(([key, fw]) => (
                <option key={key} value={key}>
                  {fw.icon} {fw.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Branch */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Branch
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            {selectedRepo && githubBranches.length > 0 ? (
              <select
                value={config.branch}
                onChange={(e) => onChange({ branch: e.target.value })}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {githubBranches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} {b.isDefault ? '(default)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.branch}
                onChange={(e) => onChange({ branch: e.target.value })}
                placeholder="main"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            )}
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Build Command */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Build Command
          </label>
          <input
            type="text"
            value={config.buildCommand}
            onChange={(e) => onChange({ buildCommand: e.target.value })}
            placeholder="npm run build"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Install Command */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Install Command
          </label>
          <input
            type="text"
            value={config.installCommand}
            onChange={(e) => onChange({ installCommand: e.target.value })}
            placeholder="npm install"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* Output Directory */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Output Directory
          </label>
          <input
            type="text"
            value={config.outputDirectory}
            onChange={(e) => onChange({ outputDirectory: e.target.value })}
            placeholder="dist"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Node Version */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Node.js Version
          </label>
          <div className="relative">
            <select
              value={config.nodeVersion}
              onChange={(e) => onChange({ nodeVersion: e.target.value })}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {NODE_VERSIONS.map((v) => (
                <option key={v} value={v}>Node {v} LTS</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Root Directory */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Root Directory
          </label>
          <input
            type="text"
            value={config.rootDirectory}
            onChange={(e) => onChange({ rootDirectory: e.target.value })}
            placeholder="."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Step 3: Environment Variables
   ============================================================================ */

interface EnvVarEntry {
  key: string;
  value: string;
  target: EnvTarget;
}

function StepEnvironment({
  envVars,
  onAdd,
  onRemove,
  onChange,
  onBulkImport,
}: {
  envVars: EnvVarEntry[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof EnvVarEntry, value: string) => void;
  onBulkImport: (text: string) => void;
}) {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleImport = () => {
    onBulkImport(importText);
    setImportText('');
    setShowImport(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Environment Variables
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add environment variables for your deployment. These can be changed later.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Upload className="h-4 w-4" />
            Import .env
          </button>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Bulk import modal */}
      {showImport && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-500/5">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Paste your .env file contents:
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=sk-...'}
            rows={6}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowImport(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {/* Env vars list */}
      {envVars.length > 0 ? (
        <div className="space-y-3">
          {envVars.map((envVar, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <input
                type="text"
                placeholder="KEY"
                value={envVar.key}
                onChange={(e) => onChange(index, 'key', e.target.value)}
                className="w-1/3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="text"
                placeholder="value"
                value={envVar.value}
                onChange={(e) => onChange(index, 'value', e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <select
                value={envVar.target}
                onChange={(e) => onChange(index, 'target', e.target.value)}
                className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="ALL">All</option>
                <option value="PRODUCTION">Production</option>
                <option value="PREVIEW">Preview</option>
              </select>
              <button
                onClick={() => onRemove(index)}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
          <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No environment variables added yet.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            You can add them later in the project settings.
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Step 4: Review & Deploy
   ============================================================================ */

function StepReview({
  config,
  envVars,
  selectedRepo,
  isDeploying,
  zipPath,
}: {
  config: ConfigData;
  envVars: EnvVarEntry[];
  selectedRepo: GitHubRepo | null;
  isDeploying: boolean;
  zipPath?: string | null;
}) {
  const fw = FRAMEWORK_DEFAULTS[config.framework];

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Deployment Summary
        </h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Project
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {config.name || 'Unnamed Project'}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Framework
            </p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <span>{fw.icon}</span> {fw.label}
            </p>
          </div>

          {selectedRepo && (
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Repository
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Github className="h-4 w-4" /> {selectedRepo.fullName}
              </p>
            </div>
          )}

          {zipPath && (
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Source Type
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Upload className="h-4 w-4 text-indigo-500" /> ZIP Archive Upload
              </p>
            </div>
          )}

          {!zipPath && (
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Branch
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <GitBranch className="h-4 w-4" /> {config.branch || 'main'}
              </p>
            </div>
          )}
        </div>

        {/* Build settings */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Build Settings</p>
          <div className="space-y-2 rounded-xl bg-gray-50 p-4 font-mono text-sm dark:bg-gray-800/50">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Install:</span>
              <span className="text-gray-900 dark:text-white">{config.installCommand || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Build:</span>
              <span className="text-gray-900 dark:text-white">{config.buildCommand || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Output:</span>
              <span className="text-gray-900 dark:text-white">{config.outputDirectory || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Node:</span>
              <span className="text-gray-900 dark:text-white">v{config.nodeVersion}</span>
            </div>
            {config.rootDirectory !== '.' && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Root:</span>
                <span className="text-gray-900 dark:text-white">{config.rootDirectory}</span>
              </div>
            )}
          </div>
        </div>

        {/* Environment variables */}
        {envVars.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Environment Variables ({envVars.length})
            </p>
            <div className="space-y-1.5 rounded-xl bg-gray-50 p-4 font-mono text-sm dark:bg-gray-800/50">
              {envVars.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-white">{v.key}</span>
                  <span>=</span>
                  <span className="text-gray-400">{'•'.repeat(Math.min(v.value.length, 20))}</span>
                  <span className="ml-auto badge bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {v.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isDeploying && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-500/5">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
            Creating project and triggering deployment...
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Main New Project Page
   ============================================================================ */

export default function NewProjectPage() {
  const router = useRouter();
  const {
    error,
    createProject,
    triggerDeployment,
    detectFramework,
    clearError,
  } = useProjectStore();

  const [step, setStep] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [zipPath, setZipPath] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const [config, setConfig] = useState<ConfigData>({
    name: '',
    framework: FRAMEWORKS.REACT,
    branch: 'main',
    buildCommand: 'npm run build',
    installCommand: 'npm install',
    outputDirectory: 'build',
    nodeVersion: '20',
    rootDirectory: '.',
  });

  const [envVars, setEnvVars] = useState<EnvVarEntry[]>([]);

  const updateConfig = (data: Partial<ConfigData>) => {
    setConfig((prev) => ({ ...prev, ...data }));
  };

  const handleSelectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    updateConfig({
      name: repo.name,
      branch: repo.defaultBranch,
    });

    // Detect framework
    const fw = await detectFramework(repo.owner, repo.name);
    if (fw) {
      const defaults = FRAMEWORK_DEFAULTS[fw];
      updateConfig({
        framework: fw,
        buildCommand: defaults.buildCommand,
        installCommand: defaults.installCommand,
        outputDirectory: defaults.outputDirectory,
      });
    }

    setStep(2);
  };

  const handleSelectTemplate = (framework: Framework) => {
    const defaults = FRAMEWORK_DEFAULTS[framework];
    updateConfig({
      framework,
      buildCommand: defaults.buildCommand,
      installCommand: defaults.installCommand,
      outputDirectory: defaults.outputDirectory,
    });
    setStep(2);
  };

  const handleSelectZip = (fileName: string, path: string) => {
    setZipPath(path);
    setSelectedRepo(null);
    const name = fileName.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    updateConfig({
      name,
      framework: FRAMEWORKS.STATIC_HTML,
      branch: '',
    });
    setStep(2);
  };

  const handleAddEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '', target: ENV_TARGETS.ALL }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeEnvVar = (index: number, field: keyof EnvVarEntry, value: string) => {
    setEnvVars((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const handleBulkImport = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    const newVars: EnvVarEntry[] = lines
      .map((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) return null;
        return {
          key: line.slice(0, eqIndex).trim(),
          value: line.slice(eqIndex + 1).trim(),
          target: ENV_TARGETS.ALL as EnvTarget,
        };
      })
      .filter(Boolean) as EnvVarEntry[];
    setEnvVars((prev) => [...prev, ...newVars]);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    clearError();

    const projectData: CreateProjectData = {
      name: config.name,
      framework: config.framework,
      gitRepoUrl: selectedRepo?.cloneUrl,
      gitBranch: config.branch,
      buildCommand: config.buildCommand,
      installCommand: config.installCommand,
      outputDirectory: config.outputDirectory,
      rootDirectory: config.rootDirectory,
      nodeVersion: config.nodeVersion,
      envVars: envVars.filter((v) => v.key.trim()),
      zipPath: zipPath || undefined,
    };

    const project = await createProject(projectData);
    if (project) {
      if (!zipPath) {
        await triggerDeployment(project.id);
      }
      router.push(`/projects/${project.id}`);
    } else {
      setIsDeploying(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return false; // Proceeding from step 1 requires explicit repo/template selection
      case 2:
        return config.name.trim().length > 0;
      case 3:
        return true; // Env vars are optional
      case 4:
        return !isDeploying;
      default:
        return false;
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create a New Project
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Import a repository or start from a template to deploy your application.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={step} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-500/10">
          <X className="h-5 w-5 text-danger-600 dark:text-danger-400" />
          <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
          <button
            onClick={clearError}
            className="ml-auto rounded-lg p-1 text-danger-400 hover:text-danger-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        {step === 1 && (
          <StepSource
            onSelectRepo={handleSelectRepo}
            onSelectTemplate={handleSelectTemplate}
            onSelectZip={handleSelectZip}
          />
        )}
        {step === 2 && (
          <StepConfigure
            config={config}
            onChange={updateConfig}
            selectedRepo={selectedRepo}
          />
        )}
        {step === 3 && (
          <StepEnvironment
            envVars={envVars}
            onAdd={handleAddEnvVar}
            onRemove={handleRemoveEnvVar}
            onChange={handleChangeEnvVar}
            onBulkImport={handleBulkImport}
          />
        )}
        {step === 4 && (
          <StepReview
            config={config}
            envVars={envVars}
            selectedRepo={selectedRepo}
            isDeploying={isDeploying}
            zipPath={zipPath}
          />
        )}
      </div>

      {/* Navigation buttons */}
      {step > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={isDeploying}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 transition-all hover:text-gray-700 dark:text-gray-400"
              >
                Skip
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !config.name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
