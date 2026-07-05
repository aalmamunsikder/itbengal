/**
 * Server infrastructure types.
 * @module @itbengal/types/server
 */

import type { ServerStatus, ServerType } from './enums.js';

/**
 * A physical or virtual server node in the infrastructure pool.
 */
export interface ServerNode {
  /** Primary key (UUIDv7). */
  id: string;
  /** Hostname of the server. */
  hostname: string;
  /** Public IP address. */
  ipAddress: string;
  /** Server classification. */
  type: ServerType;
  /** Operational status. */
  status: ServerStatus;
  /** Number of CPU cores available. */
  cpuCores: number;
  /** Total memory in megabytes. */
  memoryMb: number;
  /** Total storage in megabytes. */
  storageMb: number;
  /** Current CPU utilisation (0–100). */
  cpuUsage: number;
  /** Current memory utilisation (0–100). */
  memoryUsage: number;
  /** Current storage utilisation (0–100). */
  storageUsage: number;
  /** Number of containers currently running on this node. */
  containerCount: number;
  /** Maximum number of containers this node can host. */
  maxContainers: number;
  /** Computed health score (0–100). */
  healthScore: number;
  /** ISO-8601 timestamp of the last health check. */
  lastHealthCheck: string | null;
  /** Data-centre region identifier. */
  region: string;
  /** Arbitrary metadata stored as JSONB. */
  metadata: Record<string, unknown> | null;
  /** When the server record was created. */
  createdAt: string;
  /** When the server record was last updated. */
  updatedAt: string;
}

/**
 * Response returned by the server health-check endpoint.
 */
export interface ServerHealthResponse {
  /** Server node ID. */
  nodeId: string;
  /** Current status. */
  status: ServerStatus;
  /** CPU utilisation percentage (0–100). */
  cpuUsage: number;
  /** Memory utilisation percentage (0–100). */
  memoryUsage: number;
  /** Storage utilisation percentage (0–100). */
  storageUsage: number;
  /** Number of running containers. */
  containerCount: number;
  /** Computed health score (0–100). */
  healthScore: number;
  /** ISO-8601 timestamp of the check. */
  checkedAt: string;
}

/**
 * Request body for registering a new server node.
 */
export interface RegisterNodeRequest {
  /** Hostname of the new server. */
  hostname: string;
  /** Public IP address. */
  ipAddress: string;
  /** Server classification. */
  type: ServerType;
  /** Number of CPU cores. */
  cpuCores: number;
  /** Total memory in megabytes. */
  memoryMb: number;
  /** Total storage in megabytes. */
  storageMb: number;
  /** Maximum containers this node can host. */
  maxContainers: number;
  /** Data-centre region identifier. */
  region: string;
  /** Optional metadata. */
  metadata?: Record<string, unknown>;
}
