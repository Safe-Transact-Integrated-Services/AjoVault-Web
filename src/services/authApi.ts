import type { User } from '@/types';
import { apiRequest } from '@/lib/api/http';
import type { AuthSession } from '@/lib/api/session';

interface IdentityUserProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
}

interface RegisterUserResponse {
  userId: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: string;
  createdAtUtc: string;
  message: string;
}

interface LoginUserResponse {
  user: IdentityUserProfileResponse;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  password: string;
}

export interface AuthResult {
  user: User;
  session: AuthSession;
}

const normalizeIdentifierPayload = (identifier: string) => {
  const value = identifier.trim();

  if (value.includes('@')) {
    return { email: value };
  }

  return { phoneNumber: value };
};

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
};

export const mapIdentityProfileToUser = (profile: IdentityUserProfileResponse): User => {
  const { firstName, lastName } = splitFullName(profile.fullName);

  return {
    id: profile.userId,
    firstName,
    lastName,
    phone: profile.phoneNumber ?? '',
    email: profile.email || undefined,
    kycTier: 'none',
    creditScore: 0,
    role: profile.role,
    isActive: profile.isActive,
    createdAt: profile.createdAtUtc,
    lastLoginAt: profile.lastLoginAtUtc ?? null,
  };
};

const mapSession = (response: LoginUserResponse | RefreshTokenResponse): AuthSession => ({
  accessToken: response.accessToken,
  accessTokenExpiresAt: response.accessTokenExpiresAtUtc,
  refreshToken: response.refreshToken,
  refreshTokenExpiresAt: response.refreshTokenExpiresAtUtc,
});

export const loginUser = async (identifier: string, password: string): Promise<AuthResult> => {
  const response = await apiRequest<LoginUserResponse>('/api/identity/login', {
    method: 'POST',
    auth: false,
    json: {
      ...normalizeIdentifierPayload(identifier),
      password,
    },
  });

  return {
    user: mapIdentityProfileToUser(response.user),
    session: mapSession(response),
  };
};

export const registerUser = async (input: SignupInput) => {
  const response = await apiRequest<RegisterUserResponse>('/api/identity/register', {
    method: 'POST',
    auth: false,
    json: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() || undefined,
      phoneNumber: input.phoneNumber.trim(),
      password: input.password,
    },
  });

  return response;
};

export const refreshUserSession = async (refreshToken: string): Promise<AuthSession> => {
  const response = await apiRequest<RefreshTokenResponse>('/api/identity/refresh-token', {
    method: 'POST',
    auth: false,
    json: { refreshToken },
  });

  return mapSession(response);
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiRequest<IdentityUserProfileResponse>('/api/identity/me');
  return mapIdentityProfileToUser(response);
};

export const logoutUser = async (refreshToken: string) => {
  await apiRequest('/api/identity/logout', {
    method: 'POST',
    json: { refreshToken },
  });
};
