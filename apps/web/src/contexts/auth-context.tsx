'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  weightKg: number | null;
  heightCm: number | null;
  goal: string | null;
  visibility: string;
  locale: string;
  streakShieldsRemaining: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'stayontrack_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const stored = token || localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.auth.me(stored);
      setUser(userData);
      setToken(stored);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    }
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.auth.login({ email, password });
    saveToken(result.accessToken);
    setUser(result.user);
  };

  const register = async (email: string, password: string, username: string) => {
    const result = await api.auth.register({ email, password, username });
    saveToken(result.accessToken);
    setUser(result.user);
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
