'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

/**
 * Log entry from a deployment build/deploy process.
 */
export interface DeploymentLog {
  id: string;
  deploymentId: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
  timestamp: string;
  source: 'BUILD' | 'DEPLOY' | 'HEALTH';
}

/** Connection mode for the log stream */
export type ConnectionMode = 'websocket' | 'polling' | 'disconnected';

/** Standard API success envelope */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Maximum reconnection attempts before falling back to polling permanently */
const MAX_RECONNECT_ATTEMPTS = 3;

/** Delay between reconnection attempts (ms) */
const RECONNECT_DELAY = 2000;

/** Polling interval when using HTTP fallback (ms) */
const POLL_INTERVAL = 2000;

/**
 * React hook for real-time deployment log streaming.
 *
 * Attempts a WebSocket connection first for true real-time streaming.
 * If WebSocket fails or is unavailable, falls back to HTTP polling every 2 seconds.
 *
 * @param deploymentId - The deployment to stream logs for
 * @param isActive - Whether to actively stream (e.g., deployment is in progress)
 *
 * @example
 * ```tsx
 * const { logs, connectionMode, reconnect } = useDeploymentLogs(deployment.id, isInProgress);
 * ```
 */
export function useDeploymentLogs(deploymentId: string, isActive: boolean) {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pollFallbackRef = useRef(false);

  /**
   * Append new log entries, deduplicating by ID.
   */
  const appendLogs = useCallback((newLogs: DeploymentLog | DeploymentLog[]) => {
    const entries = Array.isArray(newLogs) ? newLogs : [newLogs];
    setLogs((prev) => {
      const unique = entries.filter((entry) => {
        if (seenIdsRef.current.has(entry.id)) return false;
        seenIdsRef.current.add(entry.id);
        return true;
      });
      if (unique.length === 0) return prev;
      return [...prev, ...unique];
    });
  }, []);

  /**
   * Replace all logs (used for initial HTTP fetch or full refresh).
   */
  const replaceLogs = useCallback((newLogs: DeploymentLog[]) => {
    seenIdsRef.current = new Set(newLogs.map((l) => l.id));
    setLogs(newLogs);
  }, []);

  /**
   * Attempt to establish a WebSocket connection.
   */
  const connectWebSocket = useCallback(() => {
    if (!deploymentId || !isActive) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    const ws = new WebSocket(`${wsUrl}/ws/deployments/${deploymentId}/logs`);

    ws.onopen = () => {
      setConnectionMode('websocket');
      reconnectAttemptsRef.current = 0;
      pollFallbackRef.current = false;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as DeploymentLog | DeploymentLog[];
        appendLogs(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      // Will trigger onclose, which handles fallback
    };

    ws.onclose = () => {
      wsRef.current = null;

      if (!isActive) {
        setConnectionMode('disconnected');
        return;
      }

      // Attempt reconnection up to MAX_RECONNECT_ATTEMPTS
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, RECONNECT_DELAY);
      } else {
        // Fall back to HTTP polling
        pollFallbackRef.current = true;
        setConnectionMode('polling');
      }
    };

    wsRef.current = ws;
  }, [deploymentId, isActive, appendLogs]);

  /**
   * Force a reconnection attempt, resetting the attempt counter.
   */
  const reconnect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    pollFallbackRef.current = false;
    setConnectionMode('disconnected');

    // Reconnect after a brief delay
    setTimeout(() => {
      connectWebSocket();
    }, 100);
  }, [connectWebSocket]);

  /**
   * Clear all logs and reset state.
   */
  const clearLogs = useCallback(() => {
    seenIdsRef.current.clear();
    setLogs([]);
  }, []);

  // WebSocket lifecycle
  useEffect(() => {
    if (!isActive || !deploymentId) {
      setConnectionMode('disconnected');
      return;
    }

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [deploymentId, isActive, connectWebSocket]);

  // HTTP polling fallback
  useEffect(() => {
    if (!isActive || !deploymentId) return;
    if (connectionMode !== 'polling') return;

    const fetchLogs = async () => {
      try {
        const response = await api.get<ApiResponse<DeploymentLog[]>>(
          `/deployments/${deploymentId}/logs`,
        );
        if (response.success) {
          replaceLogs(response.data);
        }
      } catch {
        // Silently fail polling — will retry next interval
      }
    };

    // Immediate first fetch
    void fetchLogs();

    const interval = setInterval(fetchLogs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [deploymentId, isActive, connectionMode, replaceLogs]);

  // Initial log fetch (regardless of connection mode)
  useEffect(() => {
    if (!deploymentId) return;

    const fetchInitialLogs = async () => {
      try {
        const response = await api.get<ApiResponse<DeploymentLog[]>>(
          `/deployments/${deploymentId}/logs`,
        );
        if (response.success && response.data.length > 0) {
          replaceLogs(response.data);
        }
      } catch {
        // Non-critical — logs will stream in via WS or polling
      }
    };

    void fetchInitialLogs();
  }, [deploymentId, replaceLogs]);

  return {
    /** All deployment log entries, in order */
    logs,
    /** Whether any connection (WS or polling) is active */
    isConnected: connectionMode !== 'disconnected',
    /** Current connection mode */
    connectionMode,
    /** Force a WebSocket reconnection attempt */
    reconnect,
    /** Clear all log entries */
    clearLogs,
  };
}
