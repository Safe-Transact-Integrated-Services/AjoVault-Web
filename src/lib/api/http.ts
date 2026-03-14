import { notifyAuthSessionExpired } from './authEvents';
import { clearAuthSession, getAccessToken } from './session';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:51707').replace(/\/+$/, '');

interface ApiProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  json?: unknown;
}

export class ApiError extends Error {
  status: number;
  detail?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, detail?: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong.') => {
  if (!isApiError(error)) {
    return fallback;
  }

  const firstFieldError = error.fieldErrors
    ? Object.values(error.fieldErrors).flat()[0]
    : undefined;

  return firstFieldError ?? error.detail ?? error.message ?? fallback;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { auth = true, headers, json, ...init } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set('Accept', 'application/json');

  if (json !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });

  if (!response.ok) {
    const apiError = await toApiError(response);

    if (auth && shouldExpireAuthSession(response, apiError)) {
      clearAuthSession();
      notifyAuthSessionExpired();
    }

    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (isJsonContentType(contentType)) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
};

const toApiError = async (response: Response) => {
  let message = `Request failed with status ${response.status}.`;
  let detail: string | undefined;
  let fieldErrors: Record<string, string[]> | undefined;

  const contentType = response.headers.get('content-type');
  if (isJsonContentType(contentType)) {
    const data = await response.json() as ApiProblemDetails;
    message = data.title ?? message;
    detail = data.detail;
    fieldErrors = data.errors;
  } else {
    const text = await response.text();
    if (text) {
      message = text;
    }
  }

  return new ApiError(message, response.status, detail, fieldErrors);
};

const isJsonContentType = (contentType: string | null) =>
  contentType?.toLowerCase().includes('json') ?? false;

const shouldExpireAuthSession = (response: Response, error: ApiError) => {
  if (response.status !== 401) {
    return false;
  }

  const authHeader = response.headers.get('www-authenticate')?.toLowerCase() ?? '';
  if (authHeader.includes('bearer')) {
    return true;
  }

  return SESSION_EXPIRED_MESSAGES.has(error.message);
};

const SESSION_EXPIRED_MESSAGES = new Set([
  'Authentication required.',
  'Unable to resolve the current user.',
  'Refresh token is invalid.',
  'Refresh token has expired.',
  'Unauthorized',
]);
