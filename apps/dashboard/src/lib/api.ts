/**
 * ITBengal API Client
 *
 * Type-safe fetch wrapper with automatic token refresh, error transformation,
 * and request/response interceptors.
 */

/** Typed API error returned by the ITBengal API */
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
}

/** Custom error class for API errors */
export class ApiRequestError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: Record<string, unknown>;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiRequestError';
    this.statusCode = apiError.statusCode;
    this.error = apiError.error;
    this.details = apiError.details;
  }
}

/** Request interceptor function signature */
type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;

/** Response interceptor function signature */
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

interface ApiClientConfig {
  baseUrl: string;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
}

class ApiClient {
  private config: ApiClientConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl?: string) {
    this.config = {
      baseUrl: baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
      requestInterceptors: [],
      responseInterceptors: [],
    };
  }

  /** Add a request interceptor */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.config.requestInterceptors.push(interceptor);
  }

  /** Add a response interceptor */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.config.responseInterceptors.push(interceptor);
  }

  /** Build the full URL for a given path */
  private buildUrl(path: string, params?: Record<string, string>): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanBase = this.config.baseUrl.endsWith('/') ? this.config.baseUrl : `${this.config.baseUrl}/`;
    const url = new URL(cleanPath, cleanBase);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  /** Apply request interceptors */
  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let current = config;
    for (const interceptor of this.config.requestInterceptors) {
      current = await interceptor(current);
    }
    return current;
  }

  /** Apply response interceptors */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let current = response;
    for (const interceptor of this.config.responseInterceptors) {
      current = await interceptor(current);
    }
    return current;
  }

  /** Attempt to refresh the access token */
  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /** Core request method */
  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);

    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;

    let config: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        ...options?.headers,
      },
      signal: options?.signal,
    };

    if (options?.body !== undefined) {
      config.body = isFormData ? (options.body as any) : JSON.stringify(options.body);
    }

    config = await this.applyRequestInterceptors(config);

    let response = await fetch(url, config);
    response = await this.applyResponseInterceptors(response);

    // Handle 401 — attempt token refresh and retry once
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        response = await fetch(url, config);
        response = await this.applyResponseInterceptors(response);
      } else {
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiRequestError({
          statusCode: 401,
          message: 'Authentication expired. Please log in again.',
          error: 'Unauthorized',
        });
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      let apiError: ApiError;
      try {
        apiError = (await response.json()) as ApiError;
      } catch {
        apiError = {
          statusCode: response.status,
          message: response.statusText || 'An unexpected error occurred',
          error: 'UnknownError',
        };
      }
      throw new ApiRequestError(apiError);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /** HTTP GET */
  async get<T>(
    path: string,
    options?: { params?: Record<string, string>; headers?: Record<string, string>; signal?: AbortSignal },
  ): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  /** HTTP POST */
  async post<T>(
    path: string,
    body?: unknown,
    options?: { params?: Record<string, string>; headers?: Record<string, string>; signal?: AbortSignal },
  ): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  /** HTTP PUT */
  async put<T>(
    path: string,
    body?: unknown,
    options?: { params?: Record<string, string>; headers?: Record<string, string>; signal?: AbortSignal },
  ): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  /** HTTP PATCH */
  async patch<T>(
    path: string,
    body?: unknown,
    options?: { params?: Record<string, string>; headers?: Record<string, string>; signal?: AbortSignal },
  ): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  /** HTTP DELETE */
  async delete<T>(
    path: string,
    options?: { params?: Record<string, string>; headers?: Record<string, string>; signal?: AbortSignal },
  ): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}

/** Singleton API client instance */
export const api = new ApiClient();

export default api;
