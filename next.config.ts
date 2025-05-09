/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for React
  reactStrictMode: true,
  env: {
    // Define environment variables for OpenAI API key and base URL
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

  // Disable the @next/eslint-plugin-next from running in production builds
  eslint: {
    // Only run lint on builds if it's for production
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },

  // Server external packages
  serverExternalPackages: [],
};

module.exports = nextConfig;