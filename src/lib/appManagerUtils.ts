// src/lib/appManagerUtils.ts
import { APP_ID } from './appManagerConfig';

/**
 * Generate the App Manager registration URL
 * For production, you would get the token from your admin or API
 */
// export const getAppManagerRegistrationUrl = (token?: string): string => {
//   const registrationToken = token || process.env.APP_MANAGER_REGISTRATION_TOKEN;
//
//   if (!registrationToken) {
//     throw new Error('Registration token is missing. Make sure APP_MANAGER_REGISTRATION_TOKEN is set.');
//   }
//
//   const appId = APP_ID || 'logo-generator';
//   const subappId = 'premium';
//   const linkType = 'generic';
//
//   return `/register/${appId}/${subappId}/${linkType}/${registrationToken}`;
// };


/**
 * Check if the current URL is an App Manager registration URL
 */
// export const isAppManagerRegistrationUrl = (pathname: string): boolean => {
//   return pathname.startsWith('/register/') && pathname.split('/').length >= 5;
// };

/**
 * Extract registration parameters from URL
 */
// export const parseRegistrationUrl = (pathname: string) => {
//   const parts = pathname.split('/');
//
//   if (parts.length >= 5 && parts[1] === 'register') {
//     return {
//       appId: parts[2],
//       subappId: parts[3],
//       linkType: parts[4],
//       token: parts[5]
//     };
//   }
//
//   return null;
// };

/**
 * Redirect to App Manager registration (for use in components)
 */
// export const redirectToAppManagerRegistration = (router: any, token?: string) => {
//   const registrationUrl = getAppManagerRegistrationUrl(token || process.env.APP_MANAGER_REGISTRATION_TOKEN);
//   console.log("Redirecting to App Manager registration:", registrationUrl);
//   router.push(registrationUrl);
// };