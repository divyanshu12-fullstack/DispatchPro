import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dispatchpro_token';
const USER_KEY = 'dispatchpro_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      return freshUser;
    } catch (err) {
      if (err?.status === 401) {
        logout();
      }
      return null;
    }
  }, [token, logout]);

  // Initial session hydration
  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      if (token) {
        try {
          const freshUser = await authApi.getMe();
          if (mounted) {
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          }
        } catch {
          if (mounted) {
            logout();
          }
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    }
    hydrate();

    return () => {
      mounted = false;
    };
  }, [token, logout]);

  // Handle global 401 unauthorized event from client.js
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('dispatchpro:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('dispatchpro:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and session methods.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
