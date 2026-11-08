'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CreditOfficer, IdentityCardType } from '../types/credit.types';
import {
  apiRequest,
  getStoredToken,
  setStoredToken,
} from '../utils/api-client';

interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issueDate: string;
}

interface AuthContextValue {
  officer: CreditOfficer | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PATHS = new Set(['/login', '/register']);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [officer, setOfficer] = useState<CreditOfficer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setOfficer(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await apiRequest<CreditOfficer>('/auth/me');
      setOfficer(profile);
    } catch {
      setStoredToken(null);
      setOfficer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.has(pathname);
    if (!officer && !isPublic) {
      router.replace('/login');
    } else if (officer && isPublic) {
      router.replace('/');
    }
  }, [loading, officer, pathname, router]);

  const login = async (username: string, password: string) => {
    const res = await apiRequest<{
      accessToken: string;
      officer: CreditOfficer;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.accessToken);
    setOfficer(res.officer);
    router.push('/');
  };

  const register = async (payload: RegisterPayload) => {
    const res = await apiRequest<{
      accessToken: string;
      officer: CreditOfficer;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.accessToken);
    setOfficer(res.officer);
    router.push('/');
  };

  const logout = () => {
    setStoredToken(null);
    setOfficer(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{ officer, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
