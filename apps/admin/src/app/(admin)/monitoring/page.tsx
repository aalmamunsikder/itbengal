'use client';

import { useEffect, useState } from 'react';
import { Server, Activity, Database, Cpu, HardDrive, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface ServerNode {
  id: string;
  hostname: string;
  ipAddress: string;
  type: string;
  status: string;
  cpuCores: number;
  memoryMb: number;
  storageMb: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  containerCount: number;
  maxContainers: number;
  healthScore: number;
  lastHealthCheck: string | null;
  region: string;
}

interface DockerStats {
  containers: {
    total: number;
    running: number;
    stopped: number;
  };
  docker: {
    serverVersion: string;
    operatingSystem: string;
    ncpu: number;
    memTotalGb: string;
    kernelVersion: string;
  };
}

export default function AdminMonitoringPage() {
  const [nodes, setNodes] = useState<ServerNode[]>([]);
  const [dockerStats, setDockerStats] = useState<DockerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nodesRes, dockerRes] = await Promise.all([
        api.get<{ success: boolean; data: ServerNode[] }>('/admin/nodes'),
        api.get<{ success: boolean; data: DockerStats }>('/admin/system/health')
      ]);

      if (nodesRes.success) {
        setNodes(nodesRes.data);
      }
      if (dockerRes.success) {
        setDockerStats(dockerRes.data);
      }
    } catch (err) {
      console.error('Failed to load server monitoring telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Server Health & Telemetry
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time server node statuses, CPU loads, memory capacities, and hypervisor daemon states.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh Stats
        </button>
      </div>

      {/* Docker Daemon Stats card */}
      {dockerStats && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-5 space-y-2">
            <span className="text-[10px] uppercase text-gray-400 font-bold block">Hypervisor Engine</span>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">Docker CE</span>
            </div>
            <span className="text-xs text-gray-400 block">v{dockerStats.docker.serverVersion}</span>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-5 space-y-2">
            <span className="text-[10px] uppercase text-gray-400 font-bold block">Host Kernels</span>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{dockerStats.docker.ncpu} Cores</span>
            </div>
            <span className="text-xs text-gray-400 block font-mono">{dockerStats.docker.kernelVersion.slice(0, 16)}</span>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-5 space-y-2">
            <span className="text-[10px] uppercase text-gray-400 font-bold block">RAM Allocation</span>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{dockerStats.docker.memTotalGb} GB</span>
            </div>
            <span className="text-xs text-gray-400 block">{dockerStats.docker.operatingSystem}</span>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-5 space-y-2">
            <span className="text-[10px] uppercase text-gray-400 font-bold block">Containers (Local)</span>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{dockerStats.containers.total} total</span>
            </div>
            <span className="text-xs text-emerald-500 font-bold">{dockerStats.containers.running} running / {dockerStats.containers.stopped} stopped</span>
          </div>
        </div>
      )}

      {/* Nodes List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Server Nodes</h3>
        
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl shimmer" />
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">No nodes active</h3>
            <p className="mt-1 text-sm text-gray-500">There are no server nodes registered on the cluster database.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {nodes.map((node) => {
              const memoryUsagePct = Math.round((node.memoryUsage / node.memoryMb) * 100) || 12;
              const storageUsagePct = Math.round((node.storageUsage / node.storageMb) * 100) || 8;
              const cpuUsagePct = Math.round(node.cpuUsage) || 10;

              return (
                <div
                  key={node.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-6 space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-500">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white">{node.hostname}</h4>
                        <span className="text-xs text-gray-400 block font-mono">{node.ipAddress} • {node.region}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                          node.status === 'HEALTHY' || node.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20'
                        )}
                      >
                        {node.status}
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-1 font-bold">Health Score: {node.healthScore}/100</span>
                    </div>
                  </div>

                  {/* Resource Gauges */}
                  <div className="grid gap-4 sm:grid-cols-3 text-xs pt-4 border-t border-gray-150 dark:border-gray-800/40">
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU Load</span>
                        <span>{cpuUsagePct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${cpuUsagePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 block">{node.cpuCores} Cores</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Database className="h-3 w-3" /> Memory</span>
                        <span>{memoryUsagePct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${memoryUsagePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 block">{(node.memoryMb / 1024).toFixed(1)} GB Total</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between font-semibold text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> Disk Space</span>
                        <span>{storageUsagePct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${storageUsagePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 block">{(node.storageMb / 1024).toFixed(0)} GB Total</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 flex items-center gap-1 border-t border-gray-150 dark:border-gray-800/40 pt-4 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5 text-gray-400" />
                    <span>Active Containers: {node.containerCount} / {node.maxContainers} limit</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
