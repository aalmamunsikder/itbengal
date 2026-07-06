'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  Play,
  Loader2,
  Table,
  Terminal,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WordPressDatabasePage(props: PageProps) {
  const params = use(props.params);
  const [tables, setTables] = useState<string[]>([]);
  const [query, setQuery] = useState('SHOW TABLES;');
  const [loading, setLoading] = useState(true);
  const [runningQuery, setRunningQuery] = useState(false);
  const [siteTitle, setSiteTitle] = useState('WordPress Site');
  const [queryResult, setQueryResult] = useState<{
    rows?: Record<string, any>[];
    affected?: number;
    error?: string;
  } | null>(null);

  const fetchTables = async () => {
    try {
      const res = await api.get<{ success: boolean; data: string[] }>(`/wordpress/${params.id}/db/tables`);
      if (res.success) {
        setTables(res.data);
      }
    } catch (err) {
      console.error('Failed to load database tables:', err);
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
    fetchTables();
  }, [params.id]);

  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setRunningQuery(true);
    setQueryResult(null);

    try {
      const res = await api.post<{ success: boolean; data: any }>(
        `/wordpress/${params.id}/db/query`,
        { query }
      );
      if (res.success) {
        setQueryResult(res.data);
        // Refresh tables if we ran a table-modifying query
        if (/create|drop|alter|rename/i.test(query)) {
          fetchTables();
        }
      }
    } catch (err: any) {
      setQueryResult({ error: err.message || 'Failed to execute query' });
    } finally {
      setRunningQuery(false);
    }
  };

  const selectTableName = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 10;`);
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
            Database table browser and SQL queries runner
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
        <Link href={`/wordpress/${params.id}/db-manager`} className="border-b-2 border-primary-500 pb-4 text-primary-500">
          Database
        </Link>
        <Link href={`/wordpress/${params.id}/backups`} className="text-gray-500 hover:text-gray-900 dark:hover:text-white pb-4">
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
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Tables Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 p-4 space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-primary-500" /> Database Tables
            </h3>
            <ul className="space-y-1 overflow-y-auto max-h-[400px] font-mono text-xs pr-1">
              {tables.map((t) => (
                <li key={t}>
                  <button
                    onClick={() => selectTableName(t)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500 dark:hover:text-primary-400 flex items-center gap-1.5 transition-colors"
                  >
                    <Table className="h-3.5 w-3.5" /> {t}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main SQL Console */}
          <div className="flex-1 space-y-6">
            <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 p-6 space-y-4 shadow-sm">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary-500" /> SQL Query Editor
              </h3>
              <form onSubmit={handleRunQuery} className="space-y-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-32 bg-gray-950 text-gray-200 p-4 font-mono text-sm outline-none rounded-xl resize-none"
                  spellCheck={false}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={runningQuery}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-sm font-semibold text-white transition-colors disabled:opacity-40"
                  >
                    {runningQuery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Run Query (SQL)
                  </button>
                </div>
              </form>
            </div>

            {/* Query results panel */}
            {queryResult && (
              <div className="bg-white dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 overflow-hidden shadow-sm">
                {queryResult.error ? (
                  <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-500 text-sm flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>Error: {queryResult.error}</span>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span>Success: {queryResult.rows ? `${queryResult.rows.length} rows returned.` : `${queryResult.affected} rows affected.`}</span>
                  </div>
                )}

                {queryResult.rows && queryResult.rows.length > 0 && (
                  <div className="overflow-x-auto max-h-[350px]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                          {Object.keys(queryResult.rows[0] || {}).map((key) => (
                            <th key={key} className="px-4 py-2.5">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-900 dark:text-gray-300 font-mono">
                        {queryResult.rows.map((row, rIndex) => (
                          <tr key={rIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors">
                            {Object.values(row).map((val: any, vIndex) => (
                              <td key={vIndex} className="px-4 py-2 max-w-[200px] truncate" title={String(val)}>
                                {val === null ? <span className="text-gray-400">NULL</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
