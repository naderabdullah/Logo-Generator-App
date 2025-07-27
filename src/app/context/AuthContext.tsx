// src/app/context/AuthContext.tsx - FIXED
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
  login: (email: string, password: string) => Promise<void>; // Added login
  updateUser: (updates: Partial<User>) => void; // Added updateUser
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshAuth: async () => {},
  logout: async () => {},
  login: async () => {}, // Added default
  updateUser: () => {} // Added default
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
      
      // Try different API endpoints to see which one works
      let response = null;
      const endpointsToTry = ['/api/user'];
      let foundEndpoint = '';
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`AuthContext trying user endpoint: ${endpoint}`);
          const tempResponse = await fetch(endpoint);
          
          // If we get a non-404 response, use it
          if (tempResponse.status !== 404) {
            response = tempResponse;
            foundEndpoint = endpoint;
            break;
          }
        } catch (err) {
          console.error(`Error with user endpoint ${endpoint}:`, err);
        }
      }
      
      console.log(`AuthContext using endpoint: ${foundEndpoint} with status: ${response?.status}`);
      
      if (!response || response.status === 401) {
        console.log("AuthContext: User not authenticated");
        setUser(null);
        return;
      }
      
      if (response.ok) {
        console.log("AuthContext: User authenticated");
        const userData = await response.json();
        setUser(userData);
      } else {
        console.log("AuthContext: User response not OK:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
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
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const userData = await response.json();
      setUser(userData.user);
      console.log("AuthContext: Login successful");
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  // Function to handle logout
  const logout = useCallback(async () => {
    console.log("AuthContext: Logout called");
    
    try {
      // Try to call logout endpoint
      const endpointsToTry = ['/api/auth/logout'];
      let logoutSuccessful = false;
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Trying logout endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'POST',
          });
          
          if (response.ok) {
            logoutSuccessful = true;
            break;
          }
        } catch (err) {
          console.error(`Error with logout endpoint ${endpoint}:`, err);
        }
      }
      
      console.log(`Logout API success: ${logoutSuccessful}`);
      
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // ALWAYS clear user state regardless of API response
      console.log("Clearing user state...");
      setUser(null);
      setLoading(false);
      
      // Clear any cached data
      try {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      } catch (err) {
        console.error('Error clearing storage:', err);
      }
    }
  }, []);

  // Function to update user data (for credit updates)
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
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