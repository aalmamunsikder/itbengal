'use client';

import { useEffect, useState } from 'react';
import { Globe, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface WordPressSite {
  id: string;
  siteTitle: string;
  wpVersion: string;
}

interface Application {
  id: string;
  domain: string;
  containerStatus: string;
  wordpressSite: WordPressSite | null;
}

interface SiteMetrics {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryUsagePercent: number;
  status: string;
  uptimeSeconds: number;
  networkRxBytes: number;
  networkTxBytes: number;
}

interface SiteWithMetrics extends Application {
  metrics?: SiteMetrics | null;
  metricsLoading?: boolean;
}

export default function UsagePage() {
  const [sites, setSites] = useState<SiteWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSitesAndMetrics = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get<{ success: boolean; data: Application[] }>('/wordpress');
      if (res.success) {
        const sitesData: SiteWithMetrics[] = res.data.map(site => ({
          ...site,
          metricsLoading: true,
        }));
        setSites(sitesData);

        // Fetch metrics for each running site in parallel
        await Promise.all(
          sitesData.map(async (site, idx) => {
            if (site.containerStatus !== 'RUNNING') {
              setSites(prev => {
                const copy = [...prev];
                if (copy[idx]) {
                  copy[idx].metrics = null;
                  copy[idx].metricsLoading = false;
                }
                return copy;
              });
              return;
            }

            try {
              const metricsRes = await api.get<{ success: boolean; data: SiteMetrics }>(
                `/monitoring/${site.wordpressSite?.id}`
              );
              setSites(prev => {
                const copy = [...prev];
                if (copy[idx]) {
                  copy[idx].metrics = metricsRes.data;
                  copy[idx].metricsLoading = false;
                }
                return copy;
              });
            } catch (err) {
              console.error(`Failed to fetch metrics for site ${site.id}:`, err);
              setSites(prev => {
                const copy = [...prev];
                if (copy[idx]) {
                  copy[idx].metrics = null;
                  copy[idx].metricsLoading = false;
                }
                return copy;
              });
            }
          })
        );
      }
    } catch (err) {
      console.error('Failed to retrieve WordPress installations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSitesAndMetrics();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Resource Usage & Monitoring
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time memory, CPU utilization, network logs, and container stats.
          </p>
        </div>
        <button
          onClick={() => fetchSitesAndMetrics(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-55 dark:hover:bg-gray-800 transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 rounded-2xl bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 shimmer" />
          <div className="h-64 rounded-2xl bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 shimmer" />
        </div>
      ) : sites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No active instances</h3>
          <p className="mt-1 text-sm text-gray-500">
            Provision a WordPress site first to view container resource metrics.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sites.map((site) => {
            const isRunning = site.containerStatus === 'RUNNING';
            const metrics = site.metrics;
            const metricsLoading = site.metricsLoading;

            return (
              <div
                key={site.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 flex flex-col justify-between"
              >
                {/* Site Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {site.wordpressSite?.siteTitle || 'WordPress Site'}
                      </h3>
                      <p className="text-xs text-gray-400">{site.domain}</p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                        isRunning
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20'
                      )}
                    >
                      {site.containerStatus}
                    </span>
                  </div>

                  {!isRunning ? (
                    <div className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800 mt-4">
                      Container is not active. Resource metrics are unavailable.
                    </div>
                  ) : metricsLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 border-t border-gray-100 dark:border-gray-800 mt-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                      <span className="text-xs text-gray-400">Fetching Docker container stats...</span>
                    </div>
                  ) : !metrics ? (
                    <div className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800 mt-4">
                      Failed to contact Docker agent for telemetry metrics.
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 dark:border-gray-800/60 pt-4 mt-4 space-y-4">
                      {/* CPU Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Cpu className="h-4 w-4" /> CPU Usage</span>
                          <span className="font-mono text-gray-800 dark:text-gray-200">{metrics.cpuUsagePercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              metrics.cpuUsagePercent > 80
                                ? 'bg-red-500'
                                : metrics.cpuUsagePercent > 50
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-500'
                            )}
                            style={{ width: `${Math.min(100, metrics.cpuUsagePercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Memory Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><HardDrive className="h-4 w-4" /> RAM Utilization</span>
                          <span className="font-mono text-gray-800 dark:text-gray-200">
                            {metrics.memoryUsageMb} MB / {metrics.memoryLimitMb} MB ({metrics.memoryUsagePercent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              metrics.memoryUsagePercent > 85
                                ? 'bg-red-500'
                                : metrics.memoryUsagePercent > 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(100, metrics.memoryUsagePercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Network & Uptime grid */}
                      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800/40 pt-4 text-center">
                        <div>
                          <span className="block text-[10px] uppercase text-gray-400">Uptime</span>
                          <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {formatUptime(metrics.uptimeSeconds)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-gray-400">Network RX</span>
                          <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {formatBytes(metrics.networkRxBytes)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-gray-400">Network TX</span>
                          <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {formatBytes(metrics.networkTxBytes)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
