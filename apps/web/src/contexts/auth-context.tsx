'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api';
import { isTelegramWebApp, getTelegramInitData } from '@/lib/telegram';

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
  dayEndHour: number;
  currency: string;
  weekStartDay: string;
  unitSystem: string;
  onboardingCompleted: boolean;
  monthlySavingsGoal: number | null;
  emailReminders: boolean;
  reminderHour: number;
  emailVerified: boolean;
  timezone: string;
  telegramLinked: boolean;
  createdAt: string;
  showStreak: boolean;
  showStats: boolean;
  showAchievements: boolean;
  showActiveChallenges: boolean;
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
const REFRESH_TOKEN_KEY = 'stayontrack_refresh_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshingRef = useRef(false);

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Set marker cookie for middleware route protection
    document.cookie = 'stayontrack_authenticated=1; path=/; max-age=2592000; SameSite=Lax';
    setToken(accessToken);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Remove marker cookie
    document.cookie = 'stayontrack_authenticated=; path=/; max-age=0';
    setToken(null);
    setUser(null);
  };

  /**
   * Try to refresh the access token using the stored refresh token.
   * Returns the new access token, or null if refresh failed.
   */
  const tryRefreshTokens = useCallback(async (): Promise<string | null> => {
    if (refreshingRef.current) return null;
    refreshingRef.current = true;

    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefresh) {
      refreshingRef.current = false;
      return null;
    }

    try {
      const result = await api.auth.refresh(storedRefresh);
      saveTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      refreshingRef.current = false;
      return result.accessToken;
    } catch {
      clearAuth();
      refreshingRef.current = false;
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = token || localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      // Try refresh token if no access token
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (storedRefresh) {
        await tryRefreshTokens();
      }
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.auth.me(stored);
      setUser(userData);
      setToken(stored);
      syncTimezone(stored, userData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Access token expired — try refresh
        const newToken = await tryRefreshTokens();
        if (!newToken) {
          clearAuth();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, tryRefreshTokens]);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      refreshUser();
      return;
    }

    // Auto-auth via Telegram Mini App if no stored token
    if (isTelegramWebApp()) {
      const initData = getTelegramInitData();
      if (initData) {
        api.auth.telegramAuth(initData)
          .then((data) => {
            saveTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
        return;
      }
    }

    refreshUser();
  }, []);

  // Auto-refresh: set a timer to refresh before access token expires (~14 min)
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(async () => {
      await tryRefreshTokens();
    }, 14 * 60 * 1000); // 14 minutes
    return () => clearInterval(timer);
  }, [token, tryRefreshTokens]);

  /** Sync browser timezone to backend if it differs from stored value */
  const syncTimezone = async (accessToken: string, currentUser: User | null) => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTz && currentUser && currentUser.timezone !== browserTz) {
        await api.users.updateProfile(accessToken, { timezone: browserTz }).catch(() => {});
      }
    } catch { /* ignore */ }
  };

  const login = async (email: string, password: string) => {
    const result = await api.auth.login({ email, password });
    saveTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    syncTimezone(result.accessToken, result.user);
  };

  const register = async (email: string, password: string, username: string) => {
    const result = await api.auth.register({ email, password, username });
    saveTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    syncTimezone(result.accessToken, result.user);
  };

  const logout = () => {
    // Revoke refresh token on server (best effort)
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      api.auth.logout(stored).catch(() => {});
    }
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
