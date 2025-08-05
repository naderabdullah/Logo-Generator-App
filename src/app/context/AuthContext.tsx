// src/app/context/AuthContext.tsx - UPDATED for user-specific IndexedDB
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
      
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });
      
      if (response.status === 401) {
        setUser(null);
        // Clear current user ID from IndexedDB utils
        const { setCurrentUserId } = await import('../utils/indexedDBUtils');
        setCurrentUserId(null);
        return;
      }
      
      if (response.ok) {
        const userData = await response.json();
        
        // Ensure we have all required fields with defaults
        const normalizedUser: User = {
          email: userData.email,
          logosCreated: userData.logosCreated || 0,
          logosLimit: userData.logosLimit || 5,
          remainingLogos: Math.max(0, (userData.logosLimit || 5) - (userData.logosCreated || 0))
        };
        
        setUser(normalizedUser);
        
        // Set current user ID in IndexedDB utils for user-specific operations
        const { setCurrentUserId, initializeUserUsage } = await import('../utils/indexedDBUtils');
        setCurrentUserId(normalizedUser.email); // Using email as user ID
        
        // Initialize user-specific usage data
        try {
          await initializeUserUsage(normalizedUser.email);
        } catch (error) {
          console.error('Error initializing user usage:', error);
        }
      } else {
        console.log("AuthContext: User response not OK:", response.status);
        setUser(null);
        // Clear current user ID from IndexedDB utils
        const { setCurrentUserId } = await import('../utils/indexedDBUtils');
        setCurrentUserId(null);
      }
    } catch (error) {
      console.error('AuthContext: Error checking auth status:', error);
      setUser(null);
      // Clear current user ID from IndexedDB utils
      const { setCurrentUserId } = await import('../utils/indexedDBUtils');
      setCurrentUserId(null);
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
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const loginData = await response.json();
      
      // The API returns user data in loginData.user
      if (loginData.user) {
        const normalizedUser: User = {
          email: loginData.user.email,
          logosCreated: loginData.user.logosCreated || 0,
          logosLimit: loginData.user.logosLimit || 5,
          remainingLogos: loginData.user.remainingLogos || Math.max(0, (loginData.user.logosLimit || 5) - (loginData.user.logosCreated || 0))
        };
        
        setUser(normalizedUser);
        
        // Set current user ID in IndexedDB utils for user-specific operations
        const { setCurrentUserId, initializeUserUsage } = await import('../utils/indexedDBUtils');
        setCurrentUserId(normalizedUser.email); // Using email as user ID
        
        // Initialize user-specific usage data
        try {
          await initializeUserUsage(normalizedUser.email);
        } catch (error) {
          console.error('Error initializing user usage during login:', error);
        }
      } else {
        // Fallback to refreshAuth to get user data
        await refreshAuth();
      }
    } catch (error) {
      throw error;
    }
  }, [refreshAuth]);

  // Function to handle logout
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side session/cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
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
          
          // Clear user-specific IndexedDB data instead of resetting entire database
          const { setCurrentUserId, clearUserData } = await import('../utils/indexedDBUtils');
          
          // Get current user ID before clearing it
          const currentUserId = user?.email;
          
          // Clear current user ID
          setCurrentUserId(null);
          
          // Optional: Clear only current user's data instead of entire database
          // This allows other users' data to persist on the same computer
          // if (currentUserId) {
          //   await clearUserData(currentUserId);
          //   console.log('AuthContext: User-specific IndexedDB data cleared on logout');
          // }
          
          // Alternatively, if you want to clear everything (original behavior):
          const { resetDatabase } = await import('../utils/indexedDBUtils');
          await resetDatabase();
          console.log('AuthContext: IndexedDB cleared on logout');
        }
      } catch (err) {
        console.error('AuthContext: Error clearing storage:', err);
        // Don't block logout if clearing fails
      }
    }
  }, [user?.email]);

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