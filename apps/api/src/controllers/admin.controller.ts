/**
 * Admin API Controller — manages containers, system health, and logging.
 *
 * All endpoints require authenticate + requireRole('ADMIN', 'SUPER_ADMIN') middleware.
 *
 * @module controllers/admin
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as dockerEngine from '../engine/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { prisma } from '@itbengal/database';

/**
 * List all Docker containers running on the host.
 * GET /api/v1/admin/containers
 */
export const listContainers = asyncHandler(async (req, res) => {
  // Option: pass ?managedOnly=true to filter for ITBengal-managed containers
  const managedOnly = req.query.managedOnly === 'true';
  const containers = await dockerEngine.listContainers(managedOnly);
  
  // Format the response for easier UI consumption
  const formatted = containers.map(c => ({
    id: c.Id,
    names: c.Names,
    image: c.Image,
    state: c.State,
    status: c.Status,
    ports: c.Ports,
    created: c.Created,
    labels: c.Labels,
  }));

  sendSuccess(res, formatted);
});

/**
 * Get container log output (last 200 lines).
 * GET /api/v1/admin/containers/:id/logs
 */
export const getContainerLogs = asyncHandler(async (req, res) => {
  const containerId = req.params.id as string;
  const tail = req.query.tail ? parseInt(req.query.tail as string, 10) : 200;

  try {
    const logs = await dockerEngine.containerLogs(containerId, tail);
    if (logs === 'not_found') {
      throw new NotFoundError(`Container ${containerId} not found`);
    }
    sendSuccess(res, { logs });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new Error(`Failed to fetch logs: ${error instanceof Error ? error.message : String(error)}`);
  }
});

/**
 * Restart a specific container.
 * POST /api/v1/admin/containers/:id/restart
 */
export const restartContainer = asyncHandler(async (req, res) => {
  const containerId = req.params.id as string;
  await dockerEngine.restartContainer(containerId);
  sendSuccess(res, null, `Container restarted successfully`, 200);
});

/**
 * Retrieve Docker system information (containers, images, memory, etc.).
 * GET /api/v1/admin/system/health
 */
export const getSystemHealth = asyncHandler(async (_req, res) => {
  const info = await dockerEngine.docker.info();
  const containers = await dockerEngine.listContainers(false);
  
  const stats = {
    containers: {
      total: containers.length,
      running: containers.filter((c: any) => c.State === 'running').length,
      stopped: containers.filter((c: any) => c.State === 'exited').length,
    },
    docker: {
      serverVersion: info.ServerVersion,
      operatingSystem: info.OperatingSystem,
      ncpu: info.NCPU,
      memTotalGb: info.MemTotal ? (info.MemTotal / (1024 * 1024 * 1024)).toFixed(2) : '—',
      kernelVersion: info.KernelVersion,
    },
  };

  sendSuccess(res, stats);
});

/**
 * List all customer organizations and metadata.
 * GET /api/v1/admin/customers
 */
export const listCustomers = asyncHandler(async (_req, res) => {
  const organizations = await prisma.organization.findMany({
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      members: true,
      projects: {
        include: {
          applications: true,
        },
      },
      subscriptions: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, organizations);
});

/**
 * List all invoices system-wide.
 * GET /api/v1/admin/invoices
 */
export const listAllInvoices = asyncHandler(async (_req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      payments: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, invoices);
});

/**
 * List server nodes.
 * GET /api/v1/admin/nodes
 */
export const listServerNodes = asyncHandler(async (_req, res) => {
  const nodes = await prisma.serverNode.findMany({
    orderBy: { hostname: 'asc' },
  });

  sendSuccess(res, nodes);
});
