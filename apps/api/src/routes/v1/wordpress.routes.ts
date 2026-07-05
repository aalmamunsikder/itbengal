/**
 * WordPress routing module.
 * Mounts all managed WordPress installation and operations endpoints.
 *
 * @module routes/v1/wordpress
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as wpController from '../../controllers/wordpress.controller.js';

const router = Router();

// Apply authenticate middleware to all wordpress routes
router.use(authenticate);

// Lifecycle routes
router.post('/', wpController.createSite);
router.get('/', wpController.listSites);
router.get('/:id', wpController.getSite);
router.patch('/:id', wpController.updateSite);
router.delete('/:id', wpController.deleteSite);

// File Manager routes
router.get('/:id/files', wpController.listFiles);
router.get('/:id/files/read', wpController.readFile);
router.post('/:id/files/write', wpController.writeFile);
router.delete('/:id/files', wpController.deleteFile);

// Database Manager routes
router.get('/:id/db/tables', wpController.listTables);
router.post('/:id/db/query', wpController.runQuery);

// Backups routes
router.get('/:id/backups', wpController.listBackups);
router.post('/:id/backups', wpController.createBackup);
router.post('/backups/:backupId/restore', wpController.restoreBackup);
router.delete('/backups/:backupId', wpController.deleteBackup);

export default router;
