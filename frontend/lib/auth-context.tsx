'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getToken, setToken } from './api';
import type { AuthResult, User } from './types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Signs the user out.
   *
   * The token is invalidated server-side first — a copied JWT must stop
   * working even though it still exists in the user's browser history or a
   * proxy log. The local session is then cleared and the user redirected.
   *
   * The signature deliberately accepts no arguments so that it can be passed
   * straight to `onClick` without the React synthetic event being mistaken for
   * a parameter.
   */
  const logout = useCallback(async () => {
    // Send the invalidation request while the token is still in storage,
    // so the API layer can attach the Authorization header.
    if (getToken()) {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore — the local session is cleared regardless.
      }
    }

    // Clear the local session.
    setToken(null);
    setTokenState(null);
    setUser(null);
    setLoading(false);

    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await apiRequest<User>('/auth/profile');
      setUser(profile);
      setTokenState(storedToken);
    } catch {
      setToken(null);
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<AuthResult>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });

    setToken(result.accessToken);
    setTokenState(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const result = await apiRequest<AuthResult>('/auth/register', {
        method: 'POST',
        body: { name, email, password, ...(phone ? { phone } : {}) },
        auth: false,
      });

      setToken(result.accessToken);
      setTokenState(result.accessToken);
      setUser(result.user);
      return result.user;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
