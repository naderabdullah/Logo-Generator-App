export const API_ENDPOINT = process.env.API_ENDPOINT;
export const APP_ID = process.env.APP_ID || 'logo-generator';
export const API_KEY = process.env.API_KEY;
export const DEFAULT_SUBAPP_TYPE = 'premium';

export const APP_CONFIG = {
  name: 'AI Logo Generator',
  version: '1.0.0',
  requiresPWA: true,
  supportedSubApps: ['premium']
};

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  return process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
};