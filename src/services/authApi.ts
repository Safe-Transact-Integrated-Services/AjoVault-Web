import type { User } from '@/types';
import { apiRequest } from '@/lib/api/http';
import type { AuthSession } from '@/lib/api/session';

interface IdentityUserProfileResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  kycTier: User['kycTier'];
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

interface UpdateMyProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface SubmitKycNinInput {
  nin: string;
}

export interface SubmitKycBvnInput {
  bvn: string;
  accountNumber: string;
  bankCode: string;
}

export interface KycVerificationResponse {
  status: 'pending' | 'verified';
  kycTier: User['kycTier'];
  provider: string;
  message: string;
  bvnLast4?: string | null;
  ninLast4?: string | null;
  submittedAtUtc: string;
}

export interface OtpChallengeResponse {
  message: string;
  defaultOtp: string;
  expiresAtUtc: string;
}

export interface OtpVerificationResponse {
  verified: boolean;
  message: string;
}

export interface AuthContactInput {
  email?: string;
  phoneNumber?: string;
}

export interface SignupInput {
  email?: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  password: string;
  pin: string;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface AuthResult {
  user: User;
  session: AuthSession;
}

export interface LoginIdentifierLookupResult {
  exists: boolean;
  message: string;
}

const normalizeIdentityEmail = (email?: string | null) => {
  const value = email?.trim();
  if (!value || value.endsWith('@phone.ajovault.local')) {
    return undefined;
  }

  return value;
};

const normalizeIdentifierPayload = (identifier: string) => {
  const value = identifier.trim();

  if (value.includes('@')) {
    return { email: value };
  }

  return { phoneNumber: value };
};

const normalizeContactPayload = (input: AuthContactInput) => {
  const email = input.email?.trim() || undefined;
  const phoneNumber = input.phoneNumber?.trim() || undefined;

  return {
    email,
    phoneNumber,
  };
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
    email: normalizeIdentityEmail(profile.email),
    kycTier: profile.kycTier,
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

export const requestOtp = (input: AuthContactInput) =>
  apiRequest<OtpChallengeResponse>('/api/identity/request-otp', {
    method: 'POST',
    auth: false,
    json: normalizeContactPayload(input),
  });

export const verifyOtp = (input: AuthContactInput, otp: string) =>
  apiRequest<OtpVerificationResponse>('/api/identity/verify-otp', {
    method: 'POST',
    auth: false,
    json: {
      ...normalizeContactPayload(input),
      otp,
    },
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

export const checkLoginIdentifier = (identifier: string) =>
  apiRequest<LoginIdentifierLookupResult>('/api/identity/login/check-identifier', {
    method: 'POST',
    auth: false,
    json: normalizeIdentifierPayload(identifier),
  });

export const registerUser = async (input: SignupInput) => {
  const response = await apiRequest<RegisterUserResponse>('/api/identity/register', {
    method: 'POST',
    auth: false,
    json: {
      ...normalizeContactPayload(input),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      password: input.password,
      pin: input.pin,
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

export const updateCurrentUser = async (input: UpdateProfileInput): Promise<User> => {
  const payload: UpdateMyProfileRequest = {
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    phoneNumber: input.phone.trim() || null,
    email: input.email?.trim() || null,
  };

  const response = await apiRequest<IdentityUserProfileResponse>('/api/identity/me', {
    method: 'PUT',
    json: payload,
  });

  return mapIdentityProfileToUser(response);
};

export const submitKycNinVerification = (input: SubmitKycNinInput) =>
  apiRequest<KycVerificationResponse>('/api/identity/me/kyc/nin', {
    method: 'POST',
    json: {
      nin: input.nin.trim(),
    },
  });

export const submitKycBvnVerification = (input: SubmitKycBvnInput) =>
  apiRequest<KycVerificationResponse>('/api/identity/me/kyc/bvn', {
    method: 'POST',
    json: {
      bvn: input.bvn.trim(),
      accountNumber: input.accountNumber.trim(),
      bankCode: input.bankCode,
    },
  });

export const logoutUser = async (refreshToken: string) => {
  await apiRequest('/api/identity/logout', {
    method: 'POST',
    json: { refreshToken },
  });
};
