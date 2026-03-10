export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const ACCESS_TOKEN_KEY = 'ajovault_access_token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'ajovault_access_token_expires_at';
const REFRESH_TOKEN_KEY = 'ajovault_refresh_token';
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'ajovault_refresh_token_expires_at';

const isBrowser = () => typeof window !== 'undefined';

export const getAuthSession = (): AuthSession | null => {
  if (!isBrowser()) {
    return null;
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const accessTokenExpiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const refreshTokenExpiresAt = localStorage.getItem(REFRESH_TOKEN_EXPIRES_AT_KEY);

  if (!accessToken || !accessTokenExpiresAt || !refreshToken || !refreshTokenExpiresAt) {
    return null;
  }

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
};

export const persistAuthSession = (session: AuthSession) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, session.accessTokenExpiresAt);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(REFRESH_TOKEN_EXPIRES_AT_KEY, session.refreshTokenExpiresAt);
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_EXPIRES_AT_KEY);
};

export const getAccessToken = () => getAuthSession()?.accessToken ?? null;
