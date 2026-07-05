/**
 * WordPress hosting types.
 * @module @itbengal/types/wordpress
 */

import type { BackupStatus, BackupType } from './enums.js';

/**
 * A managed WordPress installation.
 */
export interface WordPressSite {
  /** Primary key (UUIDv7). */
  id: string;
  /** The application / container hosting this WP site. */
  applicationId: string;
  /** WordPress core version installed. */
  wpVersion: string;
  /** PHP version powering the site. */
  phpVersion: string;
  /** Database name. */
  dbName: string;
  /** Database user. */
  dbUser: string;
  /** Site title. */
  siteTitle: string;
  /** Primary URL of the site. */
  siteUrl: string;
  /** Admin email address. */
  adminEmail: string;
  /** Whether object caching is enabled. */
  cacheEnabled: boolean;
  /** Whether WordPress auto-updates are enabled. */
  autoUpdatesEnabled: boolean;
  /** When the WP site record was created. */
  createdAt: string;
  /** When the WP site record was last updated. */
  updatedAt: string;
}

/**
 * A backup snapshot for an application.
 */
export interface Backup {
  /** Primary key (UUIDv7). */
  id: string;
  /** The application this backup belongs to. */
  applicationId: string;
  /** What was included in the backup. */
  type: BackupType;
  /** Current backup job status. */
  status: BackupStatus;
  /** Size of the backup archive in bytes. */
  sizeBytes: number | null;
  /** Path in object storage / filesystem where the backup is stored. */
  storagePath: string | null;
  /** Number of days this backup is retained before automatic deletion. */
  retentionDays: number;
  /** User ID of whoever triggered the backup. */
  triggeredBy: string;
  /** When the backup job finished. */
  completedAt: string | null;
  /** When the backup will be auto-deleted. */
  expiresAt: string | null;
  /** When the backup record was created. */
  createdAt: string;
}

/**
 * Request body for creating a new managed WordPress site.
 */
export interface CreateWordPressSiteRequest {
  /** Desired site title. */
  siteTitle: string;
  /** Admin email address. */
  adminEmail: string;
  /** WordPress version to install (defaults to latest). */
  wpVersion?: string;
  /** PHP version to use (defaults to latest stable). */
  phpVersion?: string;
  /** Whether to enable object caching from the start. */
  cacheEnabled?: boolean;
  /** Whether to enable auto-updates. */
  autoUpdatesEnabled?: boolean;
}

/**
 * Request body for restoring a backup.
 */
export interface RestoreBackupRequest {
  /** The ID of the backup to restore. */
  backupId: string;
  /** Whether to overwrite existing data (destructive restore). */
  overwrite?: boolean;
}

/**
 * A single file or directory entry in a WordPress installation's file manager.
 */
export interface FileEntry {
  /** File or directory name. */
  name: string;
  /** Full path relative to the site root. */
  path: string;
  /** Whether this entry is a file or a directory. */
  type: 'file' | 'directory';
  /** Size in bytes (null for directories). */
  size: number | null;
  /** POSIX permission string (e.g. "755"). */
  permissions: string;
  /** Last modification timestamp (ISO-8601). */
  modifiedAt: string;
}
