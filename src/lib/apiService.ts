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
  if (!API_ENDPOINT || !API_KEY) {
    throw new Error('App Manager API configuration missing. Please check your environment variables.');
  }

  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
  }

  const fullUrl = `${API_ENDPOINT}?${searchParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
      'Accept': 'application/json',
      // Add CORS headers if needed
      'Origin': typeof window !== 'undefined' ? window.location.origin : '',
    },
    body: JSON.stringify(data),
    signal: controller.signal,
    // Add mode if CORS issues
    mode: 'cors',
    credentials: 'omit'
  });

  clearTimeout(timeoutId);

  // Log response for debugging
  console.log('API Response Status:', response.status);
  console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const appManagerApiService = {
  // Registration API - matches Lambda verifyAppPurchase action
  async verifyRegistration(registrationData: RegistrationData): Promise<ApiResponse> {
    try {
      console.log('Sending registration request:', registrationData);
      console.log('API Endpoint:', API_ENDPOINT);
      console.log('API Key configured:', !!API_KEY);
      
      const response = await createApiCall('/app-manager', registrationData, {
        action: 'verifyAppPurchase'
      });

      console.log('Registration response:', response);
      return response;
    } catch (error) {
      console.error('Registration API Error:', error);
      throw this.handleApiError(error);
    }
  },

  // Get subapp info - matches Lambda getPublicSubappInfo action
  async getSubappInfo(appId: string, subappId: string): Promise<any> {
    try {
      const response = await createApiCall('/app-manager', {
        appId,
        subappId
      }, {
        action: 'getPublicSubappInfo'
      });

      return response;
    } catch (error) {
      console.error('Subapp info API Error:', error);
      throw this.handleApiError(error);
    }
  },

  // Login API - for app manager authentication
  async login(appId: string, email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await createApiCall('/app-manager', {
        appId,
        email,
        password
      }, {
        action: 'appLogin'
      });

      return response;
    } catch (error) {
      console.error('Login API Error:', error);
      throw this.handleApiError(error);
    }
  },

  // Error handler matching Lambda error responses
  handleApiError(error: any): Error {
    if (error instanceof Response) {
      // Handle fetch Response errors
      return new Error(`Server error: ${error.status} ${error.statusText}`);
    }
    
    if (error.response) {
      const { status, data } = error.response;
      // Handle specific error codes from Lambda
      switch (data?.code) {
        case 'INVALID_TOKEN':
          return new Error('Registration link is invalid or expired');
        case 'EMAIL_EXISTS':
          return new Error('This email is already registered');
        case 'TOKEN_EXPIRED':
          return new Error('Registration link has expired');
        case 'MISSING_REQUIRED_FIELDS':
          return new Error('Missing required information');
        case 'ORDER_ALREADY_USED':
          return new Error('Order number has already been used');
        case 'INVALID_SUBAPP_ID':
          return new Error('Invalid app configuration');
        case 'APP_NOT_AVAILABLE':
          return new Error('App is not currently available');
        default:
          return new Error(data?.message || `Server error: ${status}`);
      }
    } else if (error.message && error.message.includes('fetch')) {
      return new Error('Network error - please check your connection');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
};