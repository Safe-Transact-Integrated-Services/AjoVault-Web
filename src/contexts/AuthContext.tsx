import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_EXPIRED_EVENT } from '@/lib/api/authEvents';
import type { User } from '@/types';
import { clearAuthSession, getAuthSession, persistAuthSession } from '@/lib/api/session';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  requestOtp,
  updateCurrentUser,
  verifyOtp,
  type AuthContactInput,
  type OtpChallengeResponse,
  type OtpVerificationResponse,
  type SignupInput,
  type UpdateProfileInput,
} from '@/services/authApi';
import { loginAgent } from '@/services/agentApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (identifier: string, pin: string) => Promise<User>;
  loginAgent: (agentCode: string, pin: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<void>;
  requestOtp: (input: AuthContactInput) => Promise<OtpChallengeResponse>;
  verifyOtp: (input: AuthContactInput, otp: string) => Promise<OtpVerificationResponse>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

const mergeUser = (nextUser: User, currentUser: User | null): User => ({
  ...nextUser,
  creditScore: currentUser?.creditScore ?? nextUser.creditScore,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getCurrentUser();
      setUser(currentUser => mergeUser(profile, currentUser));
      return profile;
    } catch {
      clearAuthSession();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const session = getAuthSession();

      if (!session) {
        if (active) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const profile = await getCurrentUser();
        if (active) {
          setUser(profile);
        }
      } catch {
        try {
          const refreshedSession = await refreshUserSession(session.refreshToken);
          persistAuthSession(refreshedSession);
          const profile = await getCurrentUser();
          if (active) {
            setUser(profile);
          }
        } catch {
          clearAuthSession();
          if (active) {
            setUser(null);
          }
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleSessionExpired = () => {
      clearAuthSession();
      setUser(null);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (identifier: string, pin: string) => {
    const result = await loginUser(identifier, pin);
    persistAuthSession(result.session);
    setUser(currentUser => mergeUser(result.user, currentUser));
    return result.user;
  }, []);

  const handleAgentLogin = useCallback(async (agentCode: string, pin: string) => {
    const result = await loginAgent(agentCode, pin);
    persistAuthSession(result.session);
    setUser(currentUser => mergeUser(result.user, currentUser));
    return result.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    await registerUser(input);
  }, []);

  const handleRequestOtp = useCallback((input: AuthContactInput) => requestOtp(input), []);
  const handleVerifyOtp = useCallback((input: AuthContactInput, otp: string) => verifyOtp(input, otp), []);
  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const result = await updateCurrentUser(input);
    setUser(currentUser => mergeUser(result, currentUser));
    return result;
  }, []);

  const logout = useCallback(async () => {
    const session = getAuthSession();

    try {
      if (session?.refreshToken) {
        await logoutUser(session.refreshToken);
      }
    } catch {
      // Clear client auth state even if the server-side logout request fails.
    } finally {
      clearAuthSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isInitializing,
    login,
    loginAgent: handleAgentLogin,
    signup,
    requestOtp: handleRequestOtp,
    verifyOtp: handleVerifyOtp,
    updateProfile,
    logout,
    refreshProfile,
  }), [handleAgentLogin, handleRequestOtp, handleVerifyOtp, isInitializing, login, logout, refreshProfile, signup, updateProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
