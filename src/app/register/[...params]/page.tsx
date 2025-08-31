// src/app/register/[...params]/page.tsx (FIXED - Original styling preserved)
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { appManagerApiService } from '../../../lib/apiService';
import { APP_ID, isMobileDevice } from '../../../lib/appManagerConfig';

interface RegistrationPageProps {
  params: Promise<{
    params: string[];
  }>;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  orderNumber: string;
}

interface Status {
  loading: boolean;
  error: string;
  success: boolean;
}

interface SubappInfo {
  subappName?: string;
  description?: string;
}

export default function AppManagerRegistration({ params }: RegistrationPageProps) {
  const router = useRouter();
  
  // Unwrap params using React.use() for Next.js 15 compatibility
  const resolvedParams = use(params);
  
  // Extract URL parameters
  const [appId, subappId, linkType, token] = resolvedParams.params || [];
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    orderNumber: ''
  });

  // UI state
  const [status, setStatus] = useState<Status>({
    loading: false,
    error: '',
    success: false
  });

  const [subappInfo, setSubappInfo] = useState<SubappInfo | null>(null);

  // Load subapp information
  useEffect(() => {
    const loadSubappInfo = async () => {
      if (subappId) {
        try {
          const info = await appManagerApiService.getSubappInfo(appId, subappId);
          setSubappInfo(info);
        } catch (error) {
          console.error('Failed to load subapp info:', error);
          // Non-critical error - continue with registration
        }
      }
    };
    loadSubappInfo();
  }, [appId, subappId]);

  // Validate URL parameters
  useEffect(() => {
    console.log('Registration URL Parameters:', {
      appId, subappId, linkType, token
    });

    // Validate required parameters
    if (!appId || !linkType || !token) {
      setStatus({
        loading: false,
        error: 'Invalid registration link - missing required parameters',
        success: false
      });
      return;
    }

    // Verify this is for our app
    if (appId !== APP_ID) {
      setStatus({
        loading: false,
        error: 'This registration link is not valid for this application',
        success: false
      });
      return;
    }

    // Validate link type
    if (!['generic', 'specific'].includes(linkType)) {
      setStatus({
        loading: false,
        error: 'Invalid registration link type',
        success: false
      });
      return;
    }
  }, [appId, subappId, linkType, token]);

  // Add this new useEffect for scroll locking
  useEffect(() => {
    // Set page attribute and lock scrolling
    document.body.setAttribute('data-page', 'register');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup function to restore scrolling when leaving the page
    return () => {
      document.body.removeAttribute('data-page');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: false });

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setStatus({
        loading: false,
        error: 'Passwords do not match',
        success: false
      });
      return;
    }

    if (linkType === 'generic' && !formData.orderNumber.trim()) {
      setStatus({
        loading: false,
        error: 'Order number is required for this registration type',
        success: false
      });
      return;
    }

    try {
      // REMOVED: Client-side environment variable check - now handled by server
      
      // Prepare registration data exactly as Lambda expects
      const registrationData = {
        email: formData.email,
        password: formData.password,
        token,
        appId,
        linkType,
        subappId: subappId || undefined,
        orderNumber: linkType === 'generic' ? formData.orderNumber : undefined
      };

      console.log('Submitting registration:', registrationData);
      
      const result = await appManagerApiService.verifyRegistration(registrationData);
      
      console.log('Registration successful:', result);
      
      setStatus({
        loading: false,
        error: '',
        success: true
      });

      // Redirect to login after successful registration
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('🔍 Frontend registration error:', error);
      console.log('🔍 Frontend error type:', typeof error);

      if (error instanceof Error) {
        console.log('🔍 Frontend Error.message:', error.message);
      }

      // Extract clean error message from various error formats
      const extractCleanError = (error: any): string => {
        console.log('🔧 Extracting error from:', error);

        // Check if it's a direct string
        if (typeof error === 'string') {
          console.log('✅ Using direct string');
          return error;
        }

        // Check if it's an Error object
        if (error instanceof Error) {
          console.log('✅ Using Error.message:', error.message);
          return error.message;
        }

        // Check various nested properties
        if (error.message) {
          console.log('✅ Using error.message:', error.message);
          return error.message;
        }

        if (error.error) {
          console.log('✅ Using error.error:', error.error);
          return error.error;
        }

        // Check fetch response errors
        if (error.response?.data?.error) {
          console.log('✅ Using response.data.error:', error.response.data.error);
          return error.response.data.error;
        }

        if (error.response?.data?.message) {
          console.log('✅ Using response.data.message:', error.response.data.message);
          return error.response.data.message;
        }

        console.log('❌ Using fallback message');
        return 'Registration failed. Please try again.';
      };

      const cleanError = extractCleanError(error);
      console.log('🎯 Final frontend error message:', cleanError);

      setStatus({
        loading: false,
        error: cleanError,
        success: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status.loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Processing registration...</p>
            </div>
          ) : status.success ? (
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Successful!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your account has been created successfully. You will be redirected to the login page shortly.
              </p>
              <Link 
                href="/login"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">{status.error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={status.loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={status.loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={status.loading}
                  />
                </div>
              </div>

              {linkType === 'generic' && (
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">
                    Order number
                  </label>
                  <div className="mt-1">
                    <input
                      id="orderNumber"
                      name="orderNumber"
                      type="text"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your order number"
                      value={formData.orderNumber}
                      onChange={handleInputChange}
                      disabled={status.loading}
                    />
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={status.loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status.loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="text-indigo-600 hover:text-indigo-500 text-sm"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}