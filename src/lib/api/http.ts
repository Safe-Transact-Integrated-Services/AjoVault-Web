import { notifyAuthSessionExpired } from './authEvents';
import { clearAuthSession, getAccessToken } from './session';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
const localApiBaseCandidates = ['https://localhost:51707', 'http://localhost:51707'] as const;
const sensitiveRequestKeys = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'pin',
  'otp',
  'refreshToken',
  'token',
]);

export const API_BASE_URL = configuredApiBaseUrl ?? localApiBaseCandidates[0];

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

  assertSecureSensitiveRequest(json);

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

  const request = {
    ...init,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  };

  const response = await fetchWithLocalFallback(`${path}`, request);

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

const fetchWithLocalFallback = async (path: string, init: RequestInit) => {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    if (configuredApiBaseUrl) {
      throw error;
    }

    const alternateBaseUrl = localApiBaseCandidates.find(baseUrl => baseUrl !== API_BASE_URL);
    if (!alternateBaseUrl) {
      throw error;
    }

    return fetch(`${alternateBaseUrl}${path}`, init);
  }
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
  void error;
  return response.status === 401;
};

const assertSecureSensitiveRequest = (json: unknown) => {
  if (!containsSensitiveValue(json)) {
    return;
  }

  const apiUrl = new URL(API_BASE_URL);
  if (!isSecureOrigin(apiUrl)) {
    throw new Error('Sensitive actions require an HTTPS API endpoint.');
  }

  if (typeof window === 'undefined') {
    return;
  }

  const pageUrl = new URL(window.location.href);
  if (!isSecureOrigin(pageUrl)) {
    throw new Error('Sensitive actions are blocked on insecure pages. Open the app over HTTPS.');
  }
};

const containsSensitiveValue = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(containsSensitiveValue);
  }

  return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) => {
    if (sensitiveRequestKeys.has(key)) {
      return true;
    }

    return containsSensitiveValue(nestedValue);
  });
};

const isSecureOrigin = (url: URL) => url.protocol === 'https:' || isLocalOrigin(url);

const isLocalOrigin = (url: URL) =>
  url.hostname === 'localhost'
  || url.hostname === '127.0.0.1'
  || url.hostname === '::1';
