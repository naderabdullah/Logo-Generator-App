// src/app/register/[...params]/page.tsx (FIXED for Next.js 15)
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

  // Mobile device check
  useEffect(() => {
    if (!isMobileDevice()) {
      // You can optionally show a message or handle non-mobile users differently
      console.log('Non-mobile device detected');
    }
  }, []);

  // Load subapp information
  useEffect(() => {
    // Always use fallback data for now to prevent API errors during development
    const fallbackInfo = {
      subappName: 'Premium',
      description: 'Premium subscription tier with advanced features'
    };
    setSubappInfo(fallbackInfo);
    
    console.log('Using fallback subapp info - API calls disabled during development');
    
    // TODO: Enable API calls once environment variables are properly configured
    // For now, we'll just use the fallback data to ensure the form works
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
    if (!APP_ID) {
      setStatus({
        loading: false,
        error: 'App configuration missing. Please check environment variables.',
        success: false
      });
      return;
    }
    
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
      // Check if API configuration is available before proceeding
      const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!apiEndpoint || !apiKey) {
        setStatus({
          loading: false,
          error: 'This is a demo registration form. To complete actual registration, your administrator needs to configure the App Manager API settings in your deployment environment variables.',
          success: false
        });
        return;
      }

      // Prepare registration data exactly as Lambda expects
      const registrationData = {
        email: formData.email,
        password: formData.password,
        token: token,
        appId: appId,
        linkType: linkType,
        ...(subappId && { subappId }),
        ...(linkType === 'generic' && { orderNumber: formData.orderNumber })
      };

      console.log('Sending registration data:', registrationData);
      
      const response = await appManagerApiService.verifyRegistration(registrationData);
      
      console.log('Registration successful:', response);
      
      setStatus({
        loading: false,
        error: '',
        success: true
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error codes from the API
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message?.includes('TOKEN_EXPIRED')) {
        errorMessage = 'This registration link has expired. Please request a new one.';
      } else if (error.message?.includes('EMAIL_EXISTS')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.message?.includes('INVALID_TOKEN')) {
        errorMessage = 'Invalid registration link. Please check your link and try again.';
      } else if (error.message?.includes('ORDER_ALREADY_USED')) {
        errorMessage = 'This order number has already been used for registration.';
      }
      
      setStatus({
        loading: false,
        error: errorMessage,
        success: false
      });
    }
  };

  // Success state
  if (status.success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your account has been created successfully. You will be redirected to the login page.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting in a few seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Create Your Account
        </h1>

        {/* Registration Info Display */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Registration Details</h3>
          <div className="text-sm text-blue-800">
            <div>App: {appId}</div>
            {subappInfo && (
              <>
                <div>Type: {subappInfo.subappName}</div>
                <div>Description: {subappInfo.description}</div>
              </>
            )}
            <div>Link Type: {linkType}</div>
          </div>
        </div>

        {/* Development Mode Notice 
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🧪 Development Mode</h3>
          <div className="text-sm text-blue-700">
            <div>✅ Registration form is working with test data</div>
            <div>✅ Order number field is enabled for generic registrations</div>
            <div>✅ Premium subscription tier configured</div>
            <div className="mt-2 text-blue-600 text-xs">
              💡 API calls are currently disabled to prevent errors during development.
              Add environment variables and enable API integration for full functionality.
            </div>
          </div>
        </div>
        */}

        {/* Error Display */}
        {status.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{status.error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={status.loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={status.loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={status.loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>

          {/* Order Number field for generic registrations */}
          {linkType === 'generic' && (
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                required
                disabled={status.loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your order number"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Already registered link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Already registered?{' '}
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}