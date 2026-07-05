/**
 * Environment variable service — encrypted env var management for projects.
 *
 * All environment variable values are encrypted at rest using AES-256-GCM
 * via the shared `@itbengal/utils` encrypt/decrypt functions. The service
 * never returns raw values in list responses — only masked previews.
 *
 * @module services/env-var
 */

import { prisma } from '@itbengal/database';
import type { EnvironmentVariable, EnvVarTarget } from '@itbengal/database';
import { encrypt, decrypt } from '@itbengal/utils';

import { appConfig } from '../config/app.js';
import { NotFoundError } from '../middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Environment variable as returned to API consumers (value masked). */
interface EnvVarListItem {
  id: string;
  key: string;
  target: string;
  maskedValue: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Decrypted environment variable for internal use (deployment engine). */
interface DecryptedEnvVar {
  key: string;
  value: string;
}

/** Input for setting a single env var. */
interface SetEnvVarInput {
  key: string;
  value: string;
  target: EnvVarTarget;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a masked preview of a value.
 * Shows the first 3 characters followed by `***` for values longer than 3 chars.
 * Short values are fully masked.
 */
function maskValue(decryptedValue: string): string {
  if (decryptedValue.length > 3) {
    return `${decryptedValue.slice(0, 3)}***`;
  }
  return '***';
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * List all environment variables for a project.
 * Returns masked values — never the raw encrypted or decrypted content.
 *
 * @param projectId - Project UUID.
 * @param target    - Optional filter by target (PRODUCTION, PREVIEW, ALL).
 * @returns Array of env vars with masked values.
 */
export async function listEnvVars(
  projectId: string,
  target?: string,
): Promise<EnvVarListItem[]> {
  const envVars = await prisma.environmentVariable.findMany({
    where: {
      projectId,
      ...(target && { target: target as EnvVarTarget }),
    },
    orderBy: { key: 'asc' },
  });

  return envVars.map((ev) => {
    let maskedValue = '***';
    try {
      const decrypted = decrypt(ev.encryptedValue, appConfig.encryptionKey);
      maskedValue = maskValue(decrypted);
    } catch {
      // If decryption fails, keep default mask
    }

    return {
      id: ev.id,
      key: ev.key,
      target: ev.target,
      maskedValue,
      createdAt: ev.createdAt,
      updatedAt: ev.updatedAt,
    };
  });
}

/**
 * Get a single environment variable with its decrypted value.
 * **Internal use only** — not exposed to API consumers directly.
 *
 * @param envVarId - Environment variable UUID.
 * @returns The env var with decrypted value.
 * @throws NotFoundError if the env var doesn't exist.
 */
export async function getEnvVar(
  envVarId: string,
): Promise<EnvironmentVariable & { decryptedValue: string }> {
  const envVar = await prisma.environmentVariable.findUnique({
    where: { id: envVarId },
  });

  if (!envVar) {
    throw new NotFoundError('Environment variable not found');
  }

  const decryptedValue = decrypt(envVar.encryptedValue, appConfig.encryptionKey);

  return { ...envVar, decryptedValue };
}

/**
 * Set (create or update) a single environment variable.
 * The value is encrypted before storage. If a variable with the same
 * key and target already exists for the project, it is updated.
 *
 * @param projectId - Project UUID.
 * @param key       - Environment variable key.
 * @param value     - Plaintext value to encrypt and store.
 * @param target    - Deployment target (PRODUCTION, PREVIEW, ALL).
 * @returns The created or updated env var.
 */
export async function setEnvVar(
  projectId: string,
  key: string,
  value: string,
  target: EnvVarTarget,
): Promise<EnvironmentVariable> {
  const encryptedValue = encrypt(value, appConfig.encryptionKey);

  return prisma.environmentVariable.upsert({
    where: {
      projectId_key_target: {
        projectId,
        key,
        target,
      },
    },
    update: {
      encryptedValue,
      updatedAt: new Date(),
    },
    create: {
      projectId,
      key,
      encryptedValue,
      target,
    },
  });
}

/**
 * Bulk set (create or update) multiple environment variables in a transaction.
 *
 * @param projectId - Project UUID.
 * @param vars      - Array of env var inputs.
 * @returns Array of created/updated env vars.
 */
export async function bulkSetEnvVars(
  projectId: string,
  vars: SetEnvVarInput[],
): Promise<EnvironmentVariable[]> {
  return prisma.$transaction(
    vars.map((v) => {
      const encryptedValue = encrypt(v.value, appConfig.encryptionKey);

      return prisma.environmentVariable.upsert({
        where: {
          projectId_key_target: {
            projectId,
            key: v.key,
            target: v.target,
          },
        },
        update: {
          encryptedValue,
          updatedAt: new Date(),
        },
        create: {
          projectId,
          key: v.key,
          encryptedValue,
          target: v.target,
        },
      });
    }),
  );
}

/**
 * Delete a single environment variable.
 *
 * @param envVarId - Environment variable UUID.
 * @throws NotFoundError if the env var doesn't exist.
 */
export async function deleteEnvVar(envVarId: string): Promise<void> {
  const envVar = await prisma.environmentVariable.findUnique({
    where: { id: envVarId },
  });

  if (!envVar) {
    throw new NotFoundError('Environment variable not found');
  }

  await prisma.environmentVariable.delete({
    where: { id: envVarId },
  });
}

/**
 * Get all decrypted environment variables for a project and target.
 * Used by the deployment engine to inject env vars at build/runtime.
 *
 * @param projectId - Project UUID.
 * @param target    - Deployment target to match (PRODUCTION, PREVIEW, or ALL).
 * @returns Array of `{ key, value }` pairs with decrypted values.
 */
export async function getDecryptedEnvVars(
  projectId: string,
  target: EnvVarTarget,
): Promise<DecryptedEnvVar[]> {
  const envVars = await prisma.environmentVariable.findMany({
    where: {
      projectId,
      OR: [{ target }, { target: 'ALL' as EnvVarTarget }],
    },
    orderBy: { key: 'asc' },
  });

  return envVars.map((ev) => ({
    key: ev.key,
    value: decrypt(ev.encryptedValue, appConfig.encryptionKey),
  }));
}
