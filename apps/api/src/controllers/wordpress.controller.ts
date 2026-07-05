/**
 * Managed WordPress endpoints controller.
 * Exposes API request handlers for lifecycle, backups, file manager, and DB query execution.
 *
 * @module controllers/wordpress
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@itbengal/database';
import * as wpService from '../services/wordpress.service.js';
import * as backupService from '../services/backup.service.js';
import { successResponse } from '@itbengal/utils';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

/**
 * Create a new managed WordPress site installation.
 */
export async function createSite(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const userId = (req as any).user?.id as string;

    const {
      name,
      siteTitle,
      adminUsername,
      adminEmail,
      domain,
      customDomain,
      phpVersion,
      wpVersion,
    } = req.body;

    if (!name || !siteTitle || !adminUsername || !adminEmail || !domain) {
      throw new ValidationError('Missing required fields for installation');
    }

    const result = await wpService.createWordPressSite(userId, orgId, {
      name,
      siteTitle,
      adminUsername,
      adminEmail,
      domain,
      customDomain,
      phpVersion,
      wpVersion,
    });

    res.status(201).json(successResponse(result, 'WordPress installation started successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * List all managed WordPress applications inside the current organization.
 */
export async function listSites(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;

    const apps = await prisma.application.findMany({
      where: {
        type: 'WORDPRESS',
        project: { organizationId: orgId },
      },
      include: {
        wordpressSite: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(successResponse(apps, 'WordPress sites retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get details of a single managed WordPress application.
 */
export async function getSite(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const id = req.params.id as string;

    const app = await prisma.application.findFirst({
      where: {
        id,
        type: 'WORDPRESS',
        project: { organizationId: orgId },
      },
      include: {
        wordpressSite: true,
      },
    });

    if (!app) {
      throw new NotFoundError('WordPress site not found');
    }

    res.status(200).json(successResponse(app, 'WordPress site details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a managed WordPress installation.
 */
export async function deleteSite(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const id = req.params.id as string;

    await wpService.deleteWordPressSite(orgId, id);

    res.status(200).json(successResponse(true, 'WordPress site deleted successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * List files in container.
 */
export async function listFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const path = (req.query.path as string) || '/';

    const files = await wpService.listFiles(id, path);
    res.status(200).json(successResponse(files, 'Directory contents retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Read file contents.
 */
export async function readFile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const path = req.query.path as string;

    if (!path) {
      throw new ValidationError('File path is required');
    }

    const content = await wpService.readFile(id, path);
    res.status(200).json(successResponse({ content }, 'File read successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Write file contents.
 */
export async function writeFile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { path, content } = req.body;

    if (!path || content === undefined) {
      throw new ValidationError('Path and content are required');
    }

    await wpService.writeFile(id, path, content);
    res.status(200).json(successResponse(true, 'File written successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete file.
 */
export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const path = req.query.path as string;

    if (!path) {
      throw new ValidationError('Path is required');
    }

    await wpService.deleteFile(id, path);
    res.status(200).json(successResponse(true, 'File or directory deleted successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * List database tables.
 */
export async function listTables(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const tables = await wpService.listTables(id);
    res.status(200).json(successResponse(tables, 'Database tables retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Execute custom SQL query.
 */
export async function runQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { query } = req.body;

    if (!query) {
      throw new ValidationError('SQL query is required');
    }

    const result = await wpService.runQuery(id, query);
    res.status(200).json(successResponse(result, 'Query executed successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * List site backups.
 */
export async function listBackups(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const id = req.params.id as string;

    const backups = await backupService.listBackups(orgId, id);
    res.status(200).json(successResponse(backups, 'Backups retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new site backup.
 */
export async function createBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const id = req.params.id as string;
    const { type = 'FULL' } = req.body;

    const backup = await backupService.createBackup(orgId, id, type, 'MANUAL');
    res.status(201).json(successResponse(backup, 'Backup started successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Restore site from a backup.
 */
export async function restoreBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const backupId = req.params.backupId as string;

    await backupService.restoreBackup(orgId, backupId);
    res.status(200).json(successResponse(true, 'Backup restoration completed successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a backup.
 */
export async function deleteBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const backupId = req.params.backupId as string;

    await backupService.deleteBackup(orgId, backupId);
    res.status(200).json(successResponse(true, 'Backup deleted successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/wordpress/:id
 * Update WordPress site configuration details.
 */
export async function updateSite(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { siteTitle, customDomain, phpVersion, autoUpdatesEnabled, cacheEnabled } = req.body;

    const result = await wpService.updateWordPressSite(id, {
      siteTitle,
      customDomain,
      phpVersion,
      autoUpdatesEnabled,
      cacheEnabled,
    });

    res.status(200).json(successResponse(result, 'WordPress settings updated successfully'));
  } catch (error) {
    next(error);
  }
}
