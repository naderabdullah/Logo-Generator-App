// src/lib/apiService.ts
import { API_ENDPOINT, API_KEY } from './appManagerConfig';

interface RegistrationData {
  email: string;
  password: string;
  token: string;
  appId: string;
  linkType: string;
  subappId?: string;
  orderNumber?: string;
}

interface ApiResponse {
  message?: string;
  status?: string;
  subAppId?: string;
  token?: string;
}

// Create axios-like client using fetch
const createApiCall = async (url: string, data: any, params?: Record<string, string>) => {
  // Use proxy in development to avoid CORS
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = '/api/app-manager' //isDevelopment 
    // ? '/api/app-manager'  // Use local proxy
    // : process.env.API_ENDPOINT;  // Use direct API in production
  
  if (!isDevelopment && (!process.env.API_ENDPOINT || !process.env.API_KEY)) {
    throw new Error('App Manager API configuration missing.');
  }

  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
  }

  const fullUrl = `${baseUrl}?${searchParams.toString()}`;
  console.log('Making API call to:', fullUrl);
  console.log('Using proxy:', isDevelopment);

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  // Only add X-Api-Key header when not using proxy
  // if (!isDevelopment) {
    headers['X-Api-Key'] = process.env.API_KEY!;
  // }

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Response Error:', response.status, errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const appManagerApiService = {
  // Registration API - calls the full registration endpoint
  async verifyRegistration(registrationData: RegistrationData): Promise<ApiResponse> {
    try {
      console.log('Sending registration request:', registrationData);
      
      const response = await fetch('/api/auth/app-manager-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Registration API Error:', error);
      throw this.handleApiError(error);
    }
  },

  // Get subapp info - matches Lambda getPublicSubappInfo action
  async getSubappInfo(appId: string, subappId: string): Promise<any> {
    try {
      const response = await createApiCall(
        '',
        { appId, subappId }, 
        { action: 'getPublicSubappInfo' }
      );

      return response;
    } catch (error) {
      console.error('Subapp info API Error:', error);
      throw this.handleApiError(error);
    }
  },

  // Login API - for app manager authentication
  async login(appId: string, email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await createApiCall(
        '',
        { appId, email, password }, 
        { action: 'appLogin' }
      );

      return response;
    } catch (error) {
      console.error('Login API Error:', error);
      throw this.handleApiError(error);
    }
  },

  // Error handler matching Lambda error responses
  handleApiError(error: any): Error {
    if (error instanceof Response) {
      return new Error(`Server error: ${error.status} ${error.statusText}`);
    }
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Failed to fetch')) {
        return new Error('Network error - please check your connection');
      }
      return error;
    }
    
    return new Error('An unexpected error occurred');
  }
};