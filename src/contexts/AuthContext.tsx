import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@/types';
import { clearAuthSession, getAuthSession, persistAuthSession } from '@/lib/api/session';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  requestOtp,
  verifyOtp,
  type OtpChallengeResponse,
  type OtpVerificationResponse,
  type SignupInput,
} from '@/services/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (identifier: string, pin: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  requestOtp: (identifier: string) => Promise<OtpChallengeResponse>;
  verifyOtp: (identifier: string, otp: string) => Promise<OtpVerificationResponse>;
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
  kycTier: currentUser?.kycTier ?? nextUser.kycTier,
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

  const login = useCallback(async (identifier: string, pin: string) => {
    const result = await loginUser(identifier, pin);
    persistAuthSession(result.session);
    setUser(currentUser => mergeUser(result.user, currentUser));
    return result.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    await registerUser(input);
    return login(input.identifier, input.pin);
  }, [login]);

  const handleRequestOtp = useCallback((identifier: string) => requestOtp(identifier), []);
  const handleVerifyOtp = useCallback((identifier: string, otp: string) => verifyOtp(identifier, otp), []);

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
    signup,
    requestOtp: handleRequestOtp,
    verifyOtp: handleVerifyOtp,
    logout,
    refreshProfile,
  }), [handleRequestOtp, handleVerifyOtp, isInitializing, login, logout, refreshProfile, signup, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
