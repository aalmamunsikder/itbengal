/**
 * Managed backups service.
 * Handles backup creation (mysql dump + wp-content compression + AES encryption)
 * and restoration (decryption + streaming import).
 *
 * @module services/backup
 */

import { join } from 'node:path';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import crypto from 'node:crypto';
import { prisma } from '@itbengal/database';
import type { Backup } from '@itbengal/database';
import { encrypt, decrypt } from '@itbengal/utils';
import { docker } from '../engine/index.js';
import { appConfig } from '../config/app.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Local directory where backups are stored on host
const BACKUP_DIR = join(process.cwd(), 'backups');

/**
 * Execute command on host shell (used for docker streaming redirection).
 */
async function runHostCommand(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(command);
  if (stderr && !stderr.includes('warn') && !stderr.includes('Note')) {
    // MySQL dump often prints notes/warnings to stderr, we ignore those
    if (stderr.includes('ERROR') || stderr.includes('failed')) {
      throw new Error(stderr);
    }
  }
  return stdout;
}

/**
 * Create a new backup for a WordPress application.
 */
export async function createBackup(
  orgId: string,
  applicationId: string,
  type: 'FULL' | 'DATABASE_ONLY' | 'FILES_ONLY',
  triggeredBy: 'MANUAL' | 'SCHEDULED' | 'SYSTEM'
): Promise<Backup> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, project: { organizationId: orgId } },
    include: { wordpressSite: true },
  });

  if (!application || !application.wordpressSite) {
    throw new NotFoundError('WordPress application not found');
  }

  const wpSite = application.wordpressSite;
  const dbPassword = wpSite.dbPasswordEncrypted 
    ? decrypt(wpSite.dbPasswordEncrypted, appConfig.encryptionKey) 
    : '';

  const backupId = crypto.randomUUID();
  const backupFilename = `backup_${backupId}.enc`;
  
  await mkdir(BACKUP_DIR, { recursive: true });
  const finalBackupPath = join(BACKUP_DIR, backupFilename);

  const dbContainerName = `itbengal-wp-db-${application.id.slice(0, 8)}`;
  const appContainerName = application.containerId || `itbengal-wp-app-${application.id.slice(0, 8)}`;

  // Create PENDING database record
  await prisma.backup.create({
    data: {
      id: backupId,
      applicationId,
      type,
      status: 'IN_PROGRESS',
      triggeredBy,
      retentionDays: 7,
    },
  });

  try {
    let sqlDump = '';
    let filesTarBase64 = '';

    // 1. Database dump
    if (type === 'FULL' || type === 'DATABASE_ONLY') {
      // Execute mysqldump inside the db container and capture standard output
      sqlDump = await runHostCommand(
        `docker exec ${dbContainerName} mysqldump -u ${wpSite.dbUser} -p${dbPassword} ${wpSite.dbName}`
      );
    }

    // 2. Files archiving
    if (type === 'FULL' || type === 'FILES_ONLY') {
      // Compress wp-content directory inside the container and stream it base64-encoded to host
      const phpTarCode = `
        $dir = '/var/www/html';
        if (!is_dir("$dir/wp-content")) {
          echo json_encode(['error' => 'wp-content not found']);
          exit(1);
        }
        // Output tar to stdout, captured by host
        passthru("tar -czf - -C $dir wp-content");
      `;

      // Run docker exec and get raw buffer, then encode
      const container = docker.getContainer(appContainerName);
      const exec = await container.exec({
        Cmd: ['php', '-r', phpTarCode],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ Detach: false });
      const chunks: Buffer[] = [];
      
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          let offset = 0;
          while (offset < chunk.length) {
            if (chunk.length - offset < 8) break;
            const type = chunk.readUInt8(offset);
            const size = chunk.readUInt32BE(offset + 4);
            const payload = chunk.subarray(offset + 8, offset + 8 + size);
            
            // Only attach stdout stream (type 1)
            if (type === 1) {
              chunks.push(payload);
            }
            offset += 8 + size;
          }
        });
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      filesTarBase64 = Buffer.concat(chunks).toString('base64');
    }

    // 3. Assemble backup payload and encrypt it
    const payload = JSON.stringify({
      sqlDump,
      filesTarBase64,
      timestamp: Date.now(),
    });

    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const encryptedPayload = encrypt(payload, encryptionKey);

    // Save backup file on host
    await writeFile(finalBackupPath, encryptedPayload, 'utf-8');

    // Update database record
    const updatedBackup = await prisma.backup.update({
      where: { id: backupId },
      data: {
        status: 'COMPLETED',
        sizeBytes: Buffer.byteLength(encryptedPayload),
        storagePath: finalBackupPath,
        encryptionKey,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days retention
      },
    });

    return updatedBackup;
  } catch (error) {
    // Mark backup as FAILED
    await prisma.backup.update({
      where: { id: backupId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

/**
 * Restore a WordPress application from a backup.
 */
export async function restoreBackup(orgId: string, backupId: string): Promise<boolean> {
  const backup = await prisma.backup.findUnique({
    where: { id: backupId },
    include: { application: { include: { wordpressSite: true, project: true } } },
  });

  if (!backup || backup.application.project.organizationId !== orgId) {
    throw new NotFoundError('Backup not found');
  }

  if (backup.status !== 'COMPLETED' || !backup.storagePath || !backup.encryptionKey) {
    throw new ForbiddenError('Cannot restore a backup that is not completed');
  }

  const application = backup.application;
  const wpSite = application.wordpressSite!;
  const dbPassword = wpSite.dbPasswordEncrypted 
    ? decrypt(wpSite.dbPasswordEncrypted, appConfig.encryptionKey) 
    : '';

  const dbContainerName = `itbengal-wp-db-${application.id.slice(0, 8)}`;
  const appContainerName = application.containerId || `itbengal-wp-app-${application.id.slice(0, 8)}`;

  // 1. Read and decrypt backup file
  const encryptedPayload = await readFile(backup.storagePath, 'utf-8');
  const payload = decrypt(encryptedPayload, backup.encryptionKey);
  const { sqlDump, filesTarBase64 } = JSON.parse(payload);

  // 2. Restore Database
  if (sqlDump) {
    // Write temporary sql file on host
    const tempSqlPath = join(BACKUP_DIR, `temp_restore_${backupId}.sql`);
    await writeFile(tempSqlPath, sqlDump, 'utf-8');

    try {
      // Stream sql dump file back into db container mysql command line
      await runHostCommand(
        `docker exec -i ${dbContainerName} mysql -u ${wpSite.dbUser} -p${dbPassword} ${wpSite.dbName} < "${tempSqlPath}"`
      );
    } finally {
      await unlink(tempSqlPath).catch(() => {});
    }
  }

  // 3. Restore Files
  if (filesTarBase64) {
    const tarBuffer = Buffer.from(filesTarBase64, 'base64');
    const tempTarPath = join(BACKUP_DIR, `temp_restore_${backupId}.tar.gz`);
    await writeFile(tempTarPath, tarBuffer);

    try {
      // Unpack tar file back inside wordpress container app path
      await runHostCommand(
        `docker exec -i ${appContainerName} tar -xzf - -C /var/www/html < "${tempTarPath}"`
      );
    } finally {
      await unlink(tempTarPath).catch(() => {});
    }
  }

  return true;
}

/**
 * Delete a backup record and its backup file on host.
 */
export async function deleteBackup(orgId: string, backupId: string): Promise<boolean> {
  const backup = await prisma.backup.findUnique({
    where: { id: backupId },
    include: { application: { include: { project: true } } },
  });

  if (!backup || backup.application.project.organizationId !== orgId) {
    throw new NotFoundError('Backup not found');
  }

  // Remove backup file on host
  if (backup.storagePath) {
    await unlink(backup.storagePath).catch(() => {});
  }

  // Delete DB record
  await prisma.backup.delete({ where: { id: backupId } });
  return true;
}

/**
 * List all backups for a WordPress application.
 */
export async function listBackups(orgId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, project: { organizationId: orgId } },
  });

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  const backups = await prisma.backup.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });

  // Convert BigInt sizes to numbers for JSON serialization
  return backups.map(b => ({
    ...b,
    sizeBytes: b.sizeBytes ? Number(b.sizeBytes) : null,
  }));
}
