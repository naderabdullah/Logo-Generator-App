// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import AuthHeader from './components/AuthHeader';
import AppHeader from './components/AppHeader';
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider

const inter = Inter({ subsets: ['latin'] });

// Metadata and viewport configuration
export const metadata: Metadata = {
  title: 'AI Logo Generator',
  description: 'Generate professional logos using AI with customizable style options',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/smartyapps.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/smartyapps.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/smartyapps.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Important for iOS devices with notches
  themeColor: '#6366f1'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Logo Gen" />
        <link rel="apple-touch-icon" href="/icons/smartyapps.png" />
        <link rel="shortcut icon" href="/icons/smartyapps.png" type="image/png" />
        <link rel="icon" href="/icons/smartyapps.png" type="image/png" />
      </head>
      <body className={inter.className}>
        {/* Wrap the entire app with the AuthProvider */}
        <AuthProvider>
          <AuthHeader />
          <AppHeader />
          <main className="pt-28 sm:pt-32">
            {children}
          </main>
        </AuthProvider>
        
        {/* Register service worker */}
        <Script src="/sw-register.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}