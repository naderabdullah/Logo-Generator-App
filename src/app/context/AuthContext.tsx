// src/app/context/AuthContext.tsx - FIXED infinite loop with useRef
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Define the shape of our user object
interface User {
  email: string;
  logosCreated: number;
  logosLimit: number;
  remainingLogos?: number;
  isSuperUser?: boolean;
  superUserPrivilege?: string;
}

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshAuth: async () => {},
  logout: async () => {},
  login: async () => {},
  updateUser: () => {}
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const hasCheckedAuth = useRef(false); // FIXED: Track if we've checked auth

  const publicRoutes = ['/login', '/signup', '/auth', '/register', '/verify'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Function to check authentication status - FIXED: Stable function
  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.status === 401) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (response.ok) {
        const userData = await response.json();
        
        const normalizedUser: User = {
          email: userData.email,
          logosCreated: userData.logosCreated || 0,
          logosLimit: userData.logosLimit || 5,
          remainingLogos: Math.max(0, (userData.logosLimit || 5) - (userData.logosCreated || 0)),
          isSuperUser: userData.isSuperUser || false,
          superUserPrivilege: userData.superUserPrivilege
        };
        
        setUser(normalizedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to handle login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/dynamo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      await refreshAuth();
    } catch (error) {
      throw error;
    }
  }, [refreshAuth]);

  // Function to handle logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('AuthContext: Logout API error:', error);
    } finally {
      setUser(null);
      hasCheckedAuth.current = false; // Reset auth check flag
    }
  }, []);

  // Function to update user data
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      const updatedUser = { ...prevUser, ...updates };
      
      if ('logosCreated' in updates || 'logosLimit' in updates) {
        updatedUser.remainingLogos = Math.max(0, updatedUser.logosLimit - updatedUser.logosCreated);
      }
      
      return updatedUser;
    });
  }, []);

  // FIXED: Check auth status only once on mount for non-public routes
  useEffect(() => {
    if (!isPublicRoute && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      refreshAuth();
    } else if (isPublicRoute) {
      setLoading(false);
    }
  }, [isPublicRoute, refreshAuth]);

  const value = {
    user,
    loading,
    refreshAuth,
    logout,
    login,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};