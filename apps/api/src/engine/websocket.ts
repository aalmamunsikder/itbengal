/**
 * WebSocket handler — real-time deployment log streaming.
 *
 * Provides a WebSocket upgrade handler at `/ws/deployments/:deploymentId/logs`
 * that streams deployment log entries to connected clients in real time.
 * The deployment pipeline calls `broadcastDeploymentLog()` to push new
 * log entries to all clients watching a specific deployment.
 *
 * @module engine/websocket
 */

import type { Server as HttpServer, IncomingMessage } from 'node:http';

import { logger } from '../utils/logger.js';
import { WebSocketServer, WebSocket } from 'ws';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A deployment log entry broadcast to WebSocket clients. */
interface DeploymentLogEntry {
  /** Deployment UUID. */
  deploymentId: string;
  /** Log severity level. */
  level: string;
  /** Log message. */
  message: string;
  /** Log source (BUILD, DEPLOY, HEALTH). */
  source: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * Map of deployment IDs to sets of connected WebSocket clients.
 * Clients are automatically removed on disconnect.
 */
const deploymentClients = new Map<string, Set<WebSocket>>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Set up the WebSocket server on an existing HTTP server.
 *
 * Listens for upgrade requests on `/ws/deployments/:deploymentId/logs`
 * and establishes WebSocket connections for log streaming.
 *
 * @param server - The Node.js HTTP server to attach to.
 */
export function setupWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = request.url ?? '';

    // Match: /ws/deployments/:deploymentId/logs
    const match = /^\/ws\/deployments\/([a-zA-Z0-9-]+)\/logs/.exec(url);

    if (!match) {
      // Not a deployment log WebSocket — reject the upgrade
      socket.destroy();
      return;
    }

    const deploymentId = match[1];

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, deploymentId);
    });
  });

  wss.on('connection', (ws: WebSocket, _request: IncomingMessage, deploymentId: string) => {
    logger.info(`WebSocket client connected for deployment: ${deploymentId}`);

    // Register client
    if (!deploymentClients.has(deploymentId)) {
      deploymentClients.set(deploymentId, new Set());
    }
    deploymentClients.get(deploymentId)!.add(ws);

    // Send a welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        deploymentId,
        message: 'Connected to deployment log stream',
        timestamp: new Date().toISOString(),
      }),
    );

    // Handle client disconnect
    ws.on('close', () => {
      const clients = deploymentClients.get(deploymentId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          deploymentClients.delete(deploymentId);
        }
      }
      logger.debug(`WebSocket client disconnected for deployment: ${deploymentId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.warn(`WebSocket error for deployment ${deploymentId}: ${error.message}`);
    });

    // Handle pong for keep-alive
    ws.on('pong', () => {
      // Client is alive
    });
  });

  // Keep-alive ping every 30 seconds
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30_000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  logger.info('WebSocket server initialised for deployment log streaming');
}

/**
 * Broadcast a deployment log entry to all connected WebSocket clients
 * watching the specified deployment.
 *
 * Called by the deployment pipeline at each log step to provide
 * real-time log streaming to the dashboard.
 *
 * @param deploymentId - Deployment UUID.
 * @param log          - The log entry to broadcast.
 */
export function broadcastDeploymentLog(
  deploymentId: string,
  log: Omit<DeploymentLogEntry, 'deploymentId' | 'timestamp'>,
): void {
  const clients = deploymentClients.get(deploymentId);
  if (!clients || clients.size === 0) {
    return; // No clients watching this deployment
  }

  const message = JSON.stringify({
    type: 'log',
    deploymentId,
    level: log.level,
    message: log.message,
    source: log.source,
    timestamp: new Date().toISOString(),
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Notify all connected clients that a deployment has reached a terminal state.
 * Closes all WebSocket connections for the deployment.
 *
 * @param deploymentId - Deployment UUID.
 * @param finalStatus  - The terminal status (LIVE, FAILED, CANCELLED).
 */
export function notifyDeploymentComplete(
  deploymentId: string,
  finalStatus: string,
): void {
  const clients = deploymentClients.get(deploymentId);
  if (!clients || clients.size === 0) {
    return;
  }

  const message = JSON.stringify({
    type: 'status',
    deploymentId,
    status: finalStatus,
    message: `Deployment ${finalStatus.toLowerCase()}`,
    timestamp: new Date().toISOString(),
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      // Close the connection after a short delay to allow the message to be delivered
      setTimeout(() => ws.close(1000, 'Deployment complete'), 500);
    }
  }

  deploymentClients.delete(deploymentId);
}

export type { DeploymentLogEntry };
