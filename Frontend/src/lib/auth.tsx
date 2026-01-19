// Auth utilities and context

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'instructor' | 'trainee';
  organizationId?: string;
  departmentId?: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Define refreshUser BEFORE useEffect that uses it
  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        setLoading(false);
      } else {
        // Only clear tokens if the API explicitly says auth failed
        if (response.error?.includes('401') || response.error?.includes('Unauthorized')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to get user:', error);
      // Don't clear tokens on network errors - let the API client handle 401s
      // The API client will handle token refresh automatically
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount
    let mounted = true;

    const initAuth = async () => {
      if (typeof window === 'undefined') {
        if (mounted) setLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');

      if (token) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('[AuthProvider] Auth initialization error:', error);
          // Only clear tokens if the error indicates the token is invalid
          // Don't clear on network errors or temporary failures
          if (mounted) {
            // Check if it's a 401 (unauthorized) - token is invalid
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setUser(null);
            }
            setLoading(false);
          }
        }
      } else {
        if (mounted) setLoading(false);
      }
    };

    // Start immediately
    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      setUser(response.data.user);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Get current user role (for backward compatibility)
export function getCurrentRole(): string {
  if (typeof window === 'undefined') return 'trainee';
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return 'trainee';
    
    // Decode JWT to get role (simple base64 decode)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'trainee';
  } catch {
    return 'trainee';
  }
}
