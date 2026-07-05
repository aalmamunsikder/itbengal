/**
 * GitHub integration service — OAuth, repository listing, and framework detection.
 *
 * Uses the native Node.js `fetch` API (no axios) for all GitHub API calls.
 * Supports OAuth code exchange, user info retrieval, repository listing,
 * branch enumeration, and automatic framework detection from package.json.
 *
 * @module services/github
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** GitHub OAuth client ID from environment. */
const GITHUB_CLIENT_ID = process.env['GITHUB_CLIENT_ID'] ?? '';

/** GitHub OAuth client secret from environment. */
const GITHUB_CLIENT_SECRET = process.env['GITHUB_CLIENT_SECRET'] ?? '';

/** GitHub OAuth redirect URI from environment. */
const GITHUB_REDIRECT_URI =
  process.env['GITHUB_REDIRECT_URI'] ?? 'http://localhost:4000/api/v1/projects/github/callback';

/** OAuth scopes requested from GitHub. */
const GITHUB_SCOPES = 'repo read:user';

/** Standard headers sent with every GitHub API request. */
const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'ITBengal-Platform',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Normalized GitHub repository info. */
interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  updatedAt: string;
  htmlUrl: string;
  cloneUrl: string;
}

/** GitHub branch info. */
interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

/** GitHub user info. */
interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
  htmlUrl: string;
}

/** Detected framework result. */
type DetectedFramework =
  | 'REACT'
  | 'NEXTJS'
  | 'VUE'
  | 'ANGULAR'
  | 'SVELTE'
  | 'ASTRO'
  | 'VITE'
  | 'STATIC_HTML';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build authorization headers for GitHub API requests.
 */
function authHeaders(accessToken: string): Record<string, string> {
  return {
    ...GITHUB_API_HEADERS,
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Make a GitHub API request and parse the JSON response.
 * Throws on non-2xx status codes.
 */
async function githubFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText} — ${body}`,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/**
 * Generate the GitHub OAuth authorization URL.
 *
 * @param state - CSRF state token for the OAuth flow.
 * @returns The full GitHub authorization URL.
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: GITHUB_SCOPES,
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange an OAuth authorization code for an access token.
 *
 * @param code - The authorization code from the GitHub OAuth callback.
 * @returns The access token string.
 */
export async function exchangeCode(code: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub OAuth token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };

  if (data.error || !data.access_token) {
    throw new Error(
      `GitHub OAuth error: ${data.error ?? 'unknown'} — ${data.error_description ?? 'No access token received'}`,
    );
  }

  return data.access_token;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/**
 * Get the authenticated GitHub user's profile.
 *
 * @param accessToken - GitHub OAuth access token.
 * @returns Normalized GitHub user info.
 */
export async function getUser(accessToken: string): Promise<GitHubUser> {
  interface GitHubUserResponse {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
    html_url: string;
  }

  const data = await githubFetch<GitHubUserResponse>(
    'https://api.github.com/user',
    { headers: authHeaders(accessToken) },
  );

  return {
    id: data.id,
    login: data.login,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
  };
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

/**
 * List the authenticated user's GitHub repositories.
 *
 * @param accessToken - GitHub OAuth access token.
 * @param options     - Pagination options.
 * @returns Array of normalized repository info objects.
 */
export async function listRepositories(
  accessToken: string,
  options?: { page?: number; perPage?: number },
): Promise<GitHubRepository[]> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 30;

  interface GitHubRepoResponse {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    default_branch: string;
    language: string | null;
    updated_at: string;
    html_url: string;
    clone_url: string;
  }

  const repos = await githubFetch<GitHubRepoResponse[]>(
    `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`,
    { headers: authHeaders(accessToken) },
  );

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    defaultBranch: repo.default_branch,
    language: repo.language,
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
  }));
}

/**
 * List branches for a specific repository.
 *
 * @param accessToken - GitHub OAuth access token.
 * @param owner       - Repository owner (user or org).
 * @param repo        - Repository name.
 * @returns Array of branch info objects.
 */
export async function listBranches(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GitHubBranch[]> {
  return githubFetch<GitHubBranch[]>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
    { headers: authHeaders(accessToken) },
  );
}

/**
 * Get a single repository's details.
 *
 * @param accessToken - GitHub OAuth access token.
 * @param owner       - Repository owner.
 * @param repo        - Repository name.
 * @returns Normalized repository info.
 */
export async function getRepository(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GitHubRepository> {
  interface GitHubRepoResponse {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    default_branch: string;
    language: string | null;
    updated_at: string;
    html_url: string;
    clone_url: string;
  }

  const data = await githubFetch<GitHubRepoResponse>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: authHeaders(accessToken) },
  );

  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    private: data.private,
    defaultBranch: data.default_branch,
    language: data.language,
    updatedAt: data.updated_at,
    htmlUrl: data.html_url,
    cloneUrl: data.clone_url,
  };
}

// ---------------------------------------------------------------------------
// Framework Detection
// ---------------------------------------------------------------------------

/**
 * Detect the frontend framework used in a repository by analysing package.json.
 *
 * Fetches the raw package.json from the repository's default (or specified)
 * branch and inspects `dependencies` + `devDependencies` for known framework
 * packages.
 *
 * @param accessToken - GitHub OAuth access token.
 * @param owner       - Repository owner.
 * @param repo        - Repository name.
 * @param branch      - Branch to check (defaults to repo default branch).
 * @returns The detected framework identifier.
 */
export async function detectFramework(
  accessToken: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<DetectedFramework> {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : '';

  try {
    // Fetch raw package.json content from the GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/package.json${ref}`,
      {
        headers: {
          ...authHeaders(accessToken),
          Accept: 'application/vnd.github.v3.raw+json',
        },
      },
    );

    if (!response.ok) {
      // No package.json → assume static HTML
      return 'STATIC_HTML';
    }

    const packageJson = (await response.json()) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Detection priority: most specific first
    if ('next' in allDeps) {
      return 'NEXTJS';
    }

    if ('@angular/core' in allDeps) {
      return 'ANGULAR';
    }

    if ('svelte' in allDeps || '@sveltejs/kit' in allDeps) {
      return 'SVELTE';
    }

    if ('astro' in allDeps) {
      return 'ASTRO';
    }

    if ('vue' in allDeps) {
      return 'VUE';
    }

    if ('react' in allDeps || 'react-dom' in allDeps) {
      // Check if using Vite
      if ('vite' in allDeps) {
        return 'VITE';
      }
      return 'REACT';
    }

    if ('vite' in allDeps) {
      return 'VITE';
    }

    return 'STATIC_HTML';
  } catch {
    // If we can't read package.json, assume static
    return 'STATIC_HTML';
  }
}

// ---------------------------------------------------------------------------
// Exports (types)
// ---------------------------------------------------------------------------

export type { GitHubRepository, GitHubBranch, GitHubUser, DetectedFramework };
