// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import UnifiedHeader from './components/UnifiedHeader';
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

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
        <link rel="apple-touch-icon" href="/icons/smartyapps.png" />
        <link rel="shortcut icon" href="/icons/smartyapps.png" type="image/png" />
        <link rel="icon" href="/icons/smartyapps.png" type="image/png" />
      </head>
      <body className={`${inter.className} ios-safe`}>
        <AuthProvider>
          <div className="app-container">
            <UnifiedHeader />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
        
        <Script src="/sw-register.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}