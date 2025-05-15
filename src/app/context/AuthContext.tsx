// src/app/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  logout: () => Promise<void>; // Added logout method
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshAuth: async () => {},
  logout: async () => {} // Added default implementation
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to check authentication status
  const refreshAuth = async () => {
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
  };

  // Function to handle logout
  const logout = async () => {
    console.log("AuthContext: Logout called");
    
    try {
      // Try different API endpoints for logout
      const endpointsToTry = ['/api/auth/logout'];
      let logoutSuccessful = false;
      let foundEndpoint = '';
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Trying logout endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'POST',
          });
          
          // If we get a successful response, mark logout as successful
          if (response.ok) {
            logoutSuccessful = true;
            foundEndpoint = endpoint;
            break;
          }
        } catch (err) {
          console.error(`Error with logout endpoint ${endpoint}:`, err);
        }
      }
      
      console.log(`Using logout endpoint: ${foundEndpoint}, success: ${logoutSuccessful}`);
      
      // Clear user state regardless of API response
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if error
      setUser(null);
    }
  };

  // Check auth status when the component mounts
  useEffect(() => {
    refreshAuth();
  }, []);

  // The context value that will be provided
  const value = {
    user,
    loading,
    refreshAuth,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};