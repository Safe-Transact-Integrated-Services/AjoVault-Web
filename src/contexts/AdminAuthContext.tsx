import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AUTH_SESSION_EXPIRED_EVENT } from '@/lib/api/authEvents';
import type { User } from '@/types';
import { clearAuthSession, getAuthSession, persistAuthSession } from '@/lib/api/session';
import { getCurrentUser, loginUser, logoutUser, refreshUserSession } from '@/services/authApi';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isAdminInitializing: boolean;
  adminUser: User | null;
  adminLogin: (identifier: string, password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  failedAttempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

export const useAdminAuth = () => useContext(AdminAuthContext);

const ADMIN_LOCKOUT_KEY = 'ajovault_admin_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAdminInitializing, setIsAdminInitializing] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  useEffect(() => {
    const lockout = localStorage.getItem(ADMIN_LOCKOUT_KEY);
    if (!lockout) {
      return;
    }

    try {
      const parsed = JSON.parse(lockout) as { until: number; attempts: number };
      if (parsed.until > Date.now()) {
        setIsLocked(true);
        setLockoutEndTime(parsed.until);
        setFailedAttempts(parsed.attempts);
      } else {
        localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      }
    } catch {
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!lockoutEndTime) {
      return undefined;
    }

    const remaining = lockoutEndTime - Date.now();
    if (remaining <= 0) {
      setIsLocked(false);
      setLockoutEndTime(null);
      setFailedAttempts(0);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsLocked(false);
      setLockoutEndTime(null);
      setFailedAttempts(0);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [lockoutEndTime]);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const session = getAuthSession();
      if (!session) {
        if (active) {
          setAdminUser(null);
          setIsAdminInitializing(false);
        }
        return;
      }

      try {
        const profile = await getCurrentUser();
        if (!active) {
          return;
        }

        if (profile.role === 'super-admin') {
          setAdminUser(profile);
        } else {
          setAdminUser(null);
        }
      } catch {
        try {
          const refreshedSession = await refreshUserSession(session.refreshToken);
          persistAuthSession(refreshedSession);
          const profile = await getCurrentUser();
          if (!active) {
            return;
          }

          if (profile.role === 'super-admin') {
            setAdminUser(profile);
          } else {
            setAdminUser(null);
          }
        } catch {
          if (active) {
            setAdminUser(null);
          }
        }
      } finally {
        if (active) {
          setIsAdminInitializing(false);
        }
      }
    };

    void restore();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleSessionExpired = () => {
      setAdminUser(null);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const adminLogin = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    if (isLocked) {
      return false;
    }

    try {
      const result = await loginUser(identifier, password);
      if (result.user.role !== 'super-admin') {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS;
          setIsLocked(true);
          setLockoutEndTime(until);
          localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify({ until, attempts: nextAttempts }));
        }
        return false;
      }

      persistAuthSession(result.session);
      setAdminUser(result.user);
      setFailedAttempts(0);
      setIsLocked(false);
      setLockoutEndTime(null);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      return true;
    } catch {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setIsLocked(true);
        setLockoutEndTime(until);
        localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify({ until, attempts: nextAttempts }));
      }
      return false;
    }
  }, [failedAttempts, isLocked]);

  const adminLogout = useCallback(async () => {
    const session = getAuthSession();

    try {
      if (session?.refreshToken) {
        await logoutUser(session.refreshToken);
      }
    } catch {
      // Clear client auth state even if server logout fails.
    } finally {
      clearAuthSession();
      setAdminUser(null);
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{
      isAdminAuthenticated: !!adminUser,
      isAdminInitializing,
      adminUser,
      adminLogin,
      adminLogout,
      failedAttempts,
      isLocked,
      lockoutEndTime,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
