// src/lib/superuser-config.ts
/**
 * Dynamic Superuser Configuration
 * Add/remove superuser emails here - they will automatically get elevated privileges across the app
 */

export const SUPERUSER_CONFIG = {
  // List of superuser emails - add new ones here as needed
  emails: [
    // Add your superuser emails here
    // 'admin@yourcompany.com',
    // 'owner@yourcompany.com',
    'tabdullah1215@live.com',
    'nader.abdullah@outlook.com'
  ],
  
  // Superuser privilege levels (for future expansion)
  privileges: {
    ADMIN: 'admin',          // Full system access
    MODERATOR: 'moderator',  // Limited admin access
    DEVELOPER: 'developer'   // Debug/development access
  }
};

/**
 * Check if an email has superuser privileges
 */
export function isSuperUser(email: string): boolean {
  if (!email) return false;
  return SUPERUSER_CONFIG.emails.includes(email.toLowerCase());
}

/**
 * Add a new superuser email
 */
export function addSuperUser(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  if (!SUPERUSER_CONFIG.emails.includes(normalizedEmail)) {
    SUPERUSER_CONFIG.emails.push(normalizedEmail);
    return true;
  }
  return false;
}

/**
 * Remove a superuser email
 */
export function removeSuperUser(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const index = SUPERUSER_CONFIG.emails.indexOf(normalizedEmail);
  if (index > -1) {
    SUPERUSER_CONFIG.emails.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Get all superuser emails
 */
export function getAllSuperUsers(): string[] {
  return [...SUPERUSER_CONFIG.emails];
}

/**
 * Get superuser status with privilege level
 */
export function getSuperUserStatus(email: string): {
  isSuperUser: boolean;
  privilege?: string;
} {
  const isSuper = isSuperUser(email);
  return {
    isSuperUser: isSuper,
    privilege: isSuper ? SUPERUSER_CONFIG.privileges.ADMIN : undefined
  };
}

/**
 * Environment-based superuser configuration
 * For production, you can also set superusers via environment variables
 */
export function loadSuperUsersFromEnv(): void {
  const envSuperUsers = process.env.SUPERUSER_EMAILS;
  if (envSuperUsers) {
    const emails = envSuperUsers.split(',').map(email => email.trim().toLowerCase());
    emails.forEach(email => {
      if (email && !SUPERUSER_CONFIG.emails.includes(email)) {
        SUPERUSER_CONFIG.emails.push(email);
      }
    });
  }
}

// Auto-load superusers from environment on module initialization
loadSuperUsersFromEnv();