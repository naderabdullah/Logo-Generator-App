// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import UnifiedHeader from './components/UnifiedHeader';
import { AuthProvider } from './context/AuthContext';
import { GenerationProvider } from './context/GenerationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Logo Generator',
  description: 'Generate professional logos using AI with customizable style options',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover'
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#6366f1" />
        {/* Preload the favicon to prevent flash */}
        <link rel="preload" href="/tabicon.ico" as="image" type="image/x-icon" />
        {/* Favicon links with higher priority */}
        <link rel="icon" href="/tabicon.ico" type="image/x-icon" sizes="any" />
        <link rel="shortcut icon" href="/tabicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/tabicon.ico" />
      </head>
      <body className={`${inter.className} ios-safe`}>
        <AuthProvider>
          <GenerationProvider>
            <div className="app-container">
              <UnifiedHeader />
              <main className="main-content">
                {children}
              </main>
            </div>
          </GenerationProvider>
        </AuthProvider>
        
        <Script src="/sw-register.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}