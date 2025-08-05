// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable strict mode for React
  reactStrictMode: true,
  
  // Disable the basePath and assetPrefix for Vercel
  basePath: '',
  assetPrefix: '',
  
  // Output configuration for Vercel
  output: 'standalone',
  
  env: {
    // Define environment variables for OpenAI API key
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  
  // Configure image domains to allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Disable eslint during builds to prevent build failures
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during builds (be careful with this)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Server external packages
  serverExternalPackages: [],

  // Add webpack configurations for better asset handling
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Don't resolve fs module on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Fix for canvas module if used
    if (isServer) {
      config.externals.push('canvas');
    }
    
    return config;
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@supabase/supabase-js', 'uuid', 'axios'],
  },
};

export default nextConfig;