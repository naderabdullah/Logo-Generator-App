// src/app/context/AuthContext.tsx - UPDATED for DynamoDB + Supabase
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the shape of our user object
interface User {
  email: string;
  logosCreated: number;
  logosLimit: number;
  remainingLogos?: number;
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

  // Function to check authentication status
  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      console.log("AuthContext: Refreshing auth state");
      
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });
      
      console.log(`AuthContext: /api/user response status: ${response.status}`);
      
      if (response.status === 401) {
        console.log("AuthContext: User not authenticated");
        setUser(null);
        return;
      }
      
      if (response.ok) {
        const userData = await response.json();
        console.log("AuthContext: User authenticated:", userData);
        
        // Ensure we have all required fields with defaults
        const normalizedUser: User = {
          email: userData.email,
          logosCreated: userData.logosCreated || 0,
          logosLimit: userData.logosLimit || 5,
          remainingLogos: Math.max(0, (userData.logosLimit || 5) - (userData.logosCreated || 0))
        };
        
        setUser(normalizedUser);
      } else {
        console.log("AuthContext: User response not OK:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to handle login
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("AuthContext: Login attempt for:", email);
      
      const response = await fetch('/api/auth/dynamo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const loginData = await response.json();
      console.log("AuthContext: Login response:", loginData);
      
      // The API returns user data in loginData.user
      if (loginData.user) {
        const normalizedUser: User = {
          email: loginData.user.email,
          logosCreated: loginData.user.logosCreated || 0,
          logosLimit: loginData.user.logosLimit || 5,
          remainingLogos: loginData.user.remainingLogos || Math.max(0, (loginData.user.logosLimit || 5) - (loginData.user.logosCreated || 0))
        };
        
        setUser(normalizedUser);
        console.log("AuthContext: Login successful, user set:", normalizedUser);
      } else {
        console.warn("AuthContext: Login response missing user data");
        // Fallback to refreshAuth to get user data
        await refreshAuth();
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  }, [refreshAuth]);

  // Function to handle logout
  const logout = useCallback(async () => {
    console.log("AuthContext: Logout called");
    
    try {
      // Call logout endpoint to clear server-side session/cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log("AuthContext: Logout API successful");
      } else {
        console.log("AuthContext: Logout API failed, but continuing with local cleanup");
      }
    } catch (error) {
      console.error('AuthContext: Logout API error:', error);
    } finally {
      // ALWAYS clear user state regardless of API response
      console.log("AuthContext: Clearing user state...");
      setUser(null);
      
      // Clear any cached data
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
        }
      } catch (err) {
        console.error('AuthContext: Error clearing storage:', err);
      }
    }
  }, []);

  // Function to update user data (for credit updates)
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      const updatedUser = { ...prevUser, ...updates };
      
      // Recalculate remainingLogos if logosCreated or logosLimit changed
      if ('logosCreated' in updates || 'logosLimit' in updates) {
        updatedUser.remainingLogos = Math.max(0, updatedUser.logosLimit - updatedUser.logosCreated);
      }
      
      console.log('AuthContext: User updated:', updatedUser);
      return updatedUser;
    });
  }, []);

  // Check auth status when the component mounts
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // The context value that will be provided
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