'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Folder,
  Loader2,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  X,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';

interface FileEntry {
  name: string;
  type: 'directory' | 'file';
  size: number;
  permissions: string;
  updatedAt: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WordPressFileManagerPage(props: PageProps) {
  const params = use(props.params);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [siteTitle, setSiteTitle] = useState('WordPress Site');
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [newPathName, setNewPathName] = useState('');
  const [newPathType, setNewPathType] = useState<'file' | 'directory'>('file');
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: FileEntry[] }>(
        `/wordpress/${params.id}/files?path=${encodeURIComponent(path)}`
      );
      if (response.success) {
        setFiles(response.data);
        setCurrentPath(path);
      }
    } catch (err) {
      console.error('Failed to list files:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteTitle = async () => {
    try {
      const res = await api.get<{ success: boolean; data: any }>(`/wordpress/${params.id}`);
      if (res.success && res.data.wordpressSite) {
        setSiteTitle(res.data.wordpressSite.siteTitle);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSiteTitle();
    fetchFiles('/');
  }, [params.id]);

  const handleFolderClick = (folderName: string) => {
    const nextPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    fetchFiles(nextPath);
  };

  const handleBackClick = () => {
    if (currentPath === '/' || currentPath === '') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const prevPath = '/' + parts.join('/');
    fetchFiles(prevPath);
  };

  const handleFileClick = async (fileName: string) => {
    const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { content: string } }>(
        `/wordpress/${params.id}/files/read?path=${encodeURIComponent(filePath)}`
      );
      if (res.success) {
        setEditingFile({ path: filePath, content: res.data.content });
        setEditingContent(res.data.content);
      }
    } catch (err) {
      console.error('Failed to read file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await api.post<{ success: boolean }>(`/wordpress/${params.id}/files/write`, {
        path: editingFile.path,
        content: editingContent,
      });
      if (res.success) {
        setEditingFile(null);
        fetchFiles(currentPath);
      }
    } catch (err) {
      console.error('Failed to write file:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    if (!confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.delete<{ success: boolean }>(
        `/wordpress/${params.id}/files?path=${encodeURIComponent(filePath)}`
      );
      if (res.success) {
        fetchFiles(currentPath);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPathName) return;

    const fullPath = currentPath === '/' ? `/${newPathName}` : `${currentPath}/${newPathName}`;
    setLoading(true);
    setShowNewModal(false);
    try {
      if (newPathType === 'file') {
        // Create an empty file
        await api.post(`/wordpress/${params.id}/files/write`, {
          path: fullPath,
          content: '',
        });
      } else {
        // Mock directory creation by placing a dummy hidden file inside
        await api.post(`/wordpress/${params.id}/files/write`, {
          path: `${fullPath}/.itbengal-keep`,
          content: 'placeholder',
        });
      }
      setNewPathName('');
      fetchFiles(currentPath);
    } catch (err) {
      console.error('Failed to create path:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in relative">
      {/* Navigation */}
      <Link
        href="/wordpress"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to installations
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {siteTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Interactive container File Explorer
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6 overflow-x-auto text-sm font-medium">
        <Link href={`/wordpress/${params.id}`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Overview
        </Link>
        <Link href={`/wordpress/${params.id}/file-manager`} className="border-b-2 border-primary-500 pb-4 text-primary-500">
          File Manager
        </Link>
        <Link href={`/wordpress/${params.id}/db-manager`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Database
        </Link>
        <Link href={`/wordpress/${params.id}/backups`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Backups
        </Link>
        <Link href={`/wordpress/${params.id}/settings`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
          Settings
        </Link>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
          <span className="text-gray-400">/var/www/html</span>
          {currentPath.split('/').filter(Boolean).map((part, index) => (
            <span key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-white">{part}</span>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          {currentPath !== '/' && currentPath !== '' && (
            <button
              onClick={handleBackClick}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Go Up
            </button>
          )}
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" /> New File/Folder
          </button>
        </div>
      </div>

      {/* Files List / Editor */}
      {editingFile ? (
        <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[500px]">
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{editingFile.path}</span>
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={handleSaveFile}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
              <button
                onClick={() => setEditingFile(null)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="flex-1 w-full bg-gray-950 text-gray-200 p-6 font-mono text-sm outline-none resize-none"
            spellCheck={false}
          />
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-900 dark:text-gray-300">
              {files.map((file) => (
                <tr key={file.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4">
                    {file.type === 'directory' ? (
                      <button
                        onClick={() => handleFolderClick(file.name)}
                        className="inline-flex items-center gap-2 font-semibold text-primary-500 hover:underline"
                      >
                        <Folder className="h-4.5 w-4.5" /> {file.name}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFileClick(file.name)}
                        className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-500"
                      >
                        <FileText className="h-4.5 w-4.5 text-gray-400" /> {file.name}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {file.type === 'directory' ? '-' : `${(file.size / 1024).toFixed(2)} KB`}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {file.permissions}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New File/Folder Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Item</h3>
            <form onSubmit={handleCreatePath} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={newPathType === 'file'}
                    onChange={() => setNewPathType('file')}
                  />
                  File
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={newPathType === 'directory'}
                    onChange={() => setNewPathType('directory')}
                  />
                  Folder
                </label>
              </div>

              <input
                type="text"
                required
                placeholder={newPathType === 'file' ? 'index.php' : 'my-plugin'}
                value={newPathName}
                onChange={(e) => setNewPathName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2 text-sm outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 text-sm font-semibold text-white hover:bg-primary-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
