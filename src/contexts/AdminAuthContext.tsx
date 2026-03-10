import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  failedAttempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
}

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

export const useAdminAuth = () => useContext(AdminAuthContext);

const ADMIN_SESSION_KEY = 'ajovault_admin_session';
const ADMIN_LOCKOUT_KEY = 'ajovault_admin_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Mock admin credentials (in production, this would be server-side)
const VALID_ADMINS = [
  { email: 'admin@ajovault.com', passwordHash: 'AjoVault@2024!' },
  { email: 'superadmin@ajovault.com', passwordHash: 'SuperAdmin@2024!' },
];

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  // Check existing session on mount
  useEffect(() => {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.expiresAt > Date.now()) {
          setIsAdminAuthenticated(true);
        } else {
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }

    // Check lockout
    const lockout = localStorage.getItem(ADMIN_LOCKOUT_KEY);
    if (lockout) {
      const lockoutData = JSON.parse(lockout);
      if (lockoutData.until > Date.now()) {
        setIsLocked(true);
        setLockoutEndTime(lockoutData.until);
        setFailedAttempts(lockoutData.attempts);
      } else {
        localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      }
    }
  }, []);

  // Auto-unlock after lockout expires
  useEffect(() => {
    if (!lockoutEndTime) return;
    const remaining = lockoutEndTime - Date.now();
    if (remaining <= 0) {
      setIsLocked(false);
      setLockoutEndTime(null);
      setFailedAttempts(0);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      return;
    }
    const timer = setTimeout(() => {
      setIsLocked(false);
      setLockoutEndTime(null);
      setFailedAttempts(0);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
    }, remaining);
    return () => clearTimeout(timer);
  }, [lockoutEndTime]);

  // Auto-expire session
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!session) return;
    const parsed = JSON.parse(session);
    const remaining = parsed.expiresAt - Date.now();
    const timer = setTimeout(() => {
      setIsAdminAuthenticated(false);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }, Math.max(remaining, 0));
    return () => clearTimeout(timer);
  }, [isAdminAuthenticated]);

  const adminLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (isLocked) return false;

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));

    const valid = VALID_ADMINS.some(
      a => a.email.toLowerCase() === email.toLowerCase().trim() && a.passwordHash === password
    );

    if (valid) {
      const session = {
        email: email.toLowerCase().trim(),
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setIsAdminAuthenticated(true);
      setFailedAttempts(0);
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      return true;
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setIsLocked(true);
        setLockoutEndTime(until);
        localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify({ until, attempts: newAttempts }));
      }
      return false;
    }
  }, [isLocked, failedAttempts]);

  const adminLogout = useCallback(() => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }, []);

  return (
    <AdminAuthContext.Provider value={{
      isAdminAuthenticated,
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
