/**
 * Git clone service — repository operations for the deployment pipeline.
 *
 * Uses `child_process.execFile` (promisified) to run git commands.
 * No external git library required — relies on the system `git` binary.
 *
 * @module engine/git
 */

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { logger } from '../utils/logger.js';

const execFile = promisify(execFileCb);

/** Maximum time (ms) allowed for a git clone operation. */
const CLONE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Insert an access token into a GitHub/GitLab HTTPS URL.
 *
 * @param repoUrl     - The original HTTPS repo URL.
 * @param accessToken - Personal access token / OAuth token.
 * @returns URL with the token embedded for authentication.
 *
 * @example
 * ```
 * injectToken('https://github.com/user/repo.git', 'ghp_abc123')
 * // => 'https://ghp_abc123@github.com/user/repo.git'
 * ```
 */
function injectToken(repoUrl: string, accessToken: string): string {
  const url = new URL(repoUrl);
  url.username = accessToken;
  url.password = ''; // token-only auth, no password needed
  return url.toString();
}

/**
 * Clone a git repository to a target directory.
 *
 * Performs a shallow clone (`--depth 1`) of a specific branch for speed.
 * If an `accessToken` is provided, it is injected into the HTTPS URL.
 *
 * @param repoUrl     - HTTPS URL of the git repository.
 * @param branch      - Branch name to clone.
 * @param targetDir   - Absolute path to clone into.
 * @param accessToken - Optional access token for private repos.
 * @throws Error if the clone operation fails.
 */
export async function cloneRepository(
  repoUrl: string,
  branch: string,
  targetDir: string,
  accessToken?: string,
): Promise<void> {
  const authenticatedUrl = accessToken
    ? injectToken(repoUrl, accessToken)
    : repoUrl;

  // Log without the token for security
  logger.info(`Cloning ${repoUrl} (branch: ${branch})...`);

  try {
    await execFile(
      'git',
      ['clone', '--depth', '1', '--branch', branch, authenticatedUrl, targetDir],
      {
        timeout: CLONE_TIMEOUT_MS,
        env: {
          ...process.env,
          // Prevent git from prompting for credentials
          GIT_TERMINAL_PROMPT: '0',
        },
      },
    );

    logger.info(`Repository cloned successfully to ${targetDir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Sanitise the error message to remove any token
    const sanitised = accessToken
      ? message.replaceAll(accessToken, '***')
      : message;

    throw new Error(`Git clone failed: ${sanitised}`);
  }
}

/**
 * Get the latest commit SHA and message from a cloned repository.
 *
 * @param repoDir - Absolute path to the cloned repository directory.
 * @returns Object containing the commit `sha` and `message`.
 * @throws Error if the git log command fails.
 */
export async function getLatestCommit(
  repoDir: string,
): Promise<{ sha: string; message: string }> {
  try {
    const { stdout } = await execFile(
      'git',
      ['log', '-1', '--format=%H|||%s'],
      { cwd: repoDir, timeout: 10_000 },
    );

    const trimmed = stdout.trim();
    const separatorIndex = trimmed.indexOf('|||');

    if (separatorIndex === -1) {
      throw new Error(`Unexpected git log output: ${trimmed}`);
    }

    return {
      sha: trimmed.slice(0, separatorIndex),
      message: trimmed.slice(separatorIndex + 3),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read latest commit: ${message}`);
  }
}
