// src/app/utils/indexedDBUtils.ts
import { v4 as uuidv4 } from 'uuid';

// Define the logo interface with revision tracking, name field, and user association
export interface StoredLogo {
  id: string;
  userId: string; // NEW: Associate logo with user
  name: string;
  imageDataUri: string;
  createdAt: number;
  parameters: LogoParameters;
  // Properties for revision tracking
  isRevision: boolean;
  originalLogoId?: string;
  revisionNumber?: number;
}

// Interface for logo generation parameters
export interface LogoParameters {
  companyName: string;
  slogan?: string;
  overallStyle: string;
  colorScheme: string;
  symbolFocus: string;
  brandPersonality: string;
  industry: string;
  size: string;
  typographyStyle?: string;
  lineStyle?: string;
  composition?: string;
  shapeEmphasis?: string;
  texture?: string;
  complexityLevel?: string;
  applicationContext?: string;
  specialInstructions?: string;
}

// Interface for usage tracking (now user-specific)
export interface UserUsage {
  id: string; // Now uses userId instead of "usage"
  userId: string; // NEW: User identifier
  logosCreated: number;
  logosLimit: number;
}

// Database configuration
const DB_NAME = 'logoGeneratorDB';
const DB_VERSION = 4; // Increased version for schema update to add userId field
const LOGOS_STORE = 'logos';
const USAGE_STORE = 'usage';

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      // Create logo store if it doesn't exist
      if (!db.objectStoreNames.contains(LOGOS_STORE)) {
        const store = db.createObjectStore(LOGOS_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('originalLogoId', 'originalLogoId', { unique: false });
        store.createIndex('isRevision', 'isRevision', { unique: false });
        store.createIndex('userId', 'userId', { unique: false }); // NEW: Index by user
      } else {
        // If the store exists but needs to be updated with new indices
        const openRequest = event.target as IDBOpenDBRequest;
        if (openRequest.transaction) {
          const store = openRequest.transaction.objectStore(LOGOS_STORE);
          
          // Add new indices if they don't exist
          if (!store.indexNames.contains('originalLogoId')) {
            store.createIndex('originalLogoId', 'originalLogoId', { unique: false });
          }
          if (!store.indexNames.contains('isRevision')) {
            store.createIndex('isRevision', 'isRevision', { unique: false });
          }
          if (!store.indexNames.contains('userId')) {
            store.createIndex('userId', 'userId', { unique: false }); // NEW: Index by user
          }
        }
      }
      
      // Create usage store
      if (!db.objectStoreNames.contains(USAGE_STORE)) {
        const store = db.createObjectStore(USAGE_STORE, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false }); // NEW: Index by user
      } else {
        // Add userId index to existing usage store
        const openRequest = event.target as IDBOpenDBRequest;
        if (openRequest.transaction) {
          const store = openRequest.transaction.objectStore(USAGE_STORE);
          if (!store.indexNames.contains('userId')) {
            store.createIndex('userId', 'userId', { unique: false });
          }
        }
      }
      
      // Migrate existing data to add userId field if upgrading from version 3
      if (oldVersion < 4 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          // Migration for logos - we'll need to handle this when user context is available
          // For now, we'll mark existing logos with a special userId that can be migrated later
          const logoStore = transaction.objectStore(LOGOS_STORE);
          logoStore.openCursor().onsuccess = (cursorEvent) => {
            const cursor = (cursorEvent.target as IDBRequest).result;
            if (cursor) {
              const logo = cursor.value;
              if (!logo.userId) {
                logo.userId = 'legacy_user'; // Mark for migration
                cursor.update(logo);
              }
              cursor.continue();
            }
          };

          // Migration for usage data
          const usageStore = transaction.objectStore(USAGE_STORE);
          usageStore.openCursor().onsuccess = (cursorEvent) => {
            const cursor = (cursorEvent.target as IDBRequest).result;
            if (cursor) {
              const usage = cursor.value;
              if (!usage.userId) {
                usage.userId = 'legacy_user'; // Mark for migration
                cursor.update(usage);
              }
              cursor.continue();
            }
          };
        }
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Generate a unique logo ID
export const generateLogoId = (): string => {
  return uuidv4();
};

// NEW: Helper function to get current user ID (should be called with user context)
let currentUserId: string | null = null;

export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const getCurrentUserId = (): string | null => {
  return currentUserId;
};

// Initialize user usage (now user-specific)
export const initializeUserUsage = async (userId: string): Promise<void> => {
  try {
    const db = await initDB();
    const usage = await getUserUsage(userId);
    
    if (!usage) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([USAGE_STORE], 'readwrite');
        const store = transaction.objectStore(USAGE_STORE);
        
        const initialUsage: UserUsage = {
          id: `usage_${userId}`, // Make ID user-specific
          userId: userId,
          logosCreated: 0,
          logosLimit: 0
        };
        
        const request = store.add(initialUsage);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    }
  } catch (error) {
    console.error('Error initializing user usage:', error);
    throw error;
  }
};

// Get user usage (now user-specific)
export const getUserUsage = async (userId: string): Promise<UserUsage | null> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USAGE_STORE], 'readonly');
      const store = transaction.objectStore(USAGE_STORE);
      const request = store.get(`usage_${userId}`);
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result || null);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting user usage:', error);
    throw error;
  }
};

// Check if user can create more original logos (now user-specific)
export const canCreateOriginalLogo = async (userId: string): Promise<boolean> => {
  try {
    // First try to get the latest values from DynamoDB
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        
        // Sync with IndexedDB but use the values directly for the check
        await syncUserUsageWithDynamoDB(userId, {
          logosCreated: userData.logosCreated,
          logosLimit: userData.logosLimit
        });
        
        return userData.logosCreated < userData.logosLimit;
      }
    } catch (err) {
      console.error('Error fetching user data from API:', err);
      // Fall back to IndexedDB if API call fails
    }
    
    // Fall back to IndexedDB values if API call fails
    const usage = await getUserUsage(userId);
    
    if (!usage) {
      await initializeUserUsage(userId);
      return canCreateOriginalLogo(userId);
    }
    
    return usage.logosCreated < usage.logosLimit;
  } catch (error) {
    console.error('Error checking if user can create original logo:', error);
    throw error;
  }
};

// Count revisions for a specific original logo (now user-specific)
export const countRevisionsForLogo = async (originalLogoId: string, userId: string): Promise<number> => {
  try {
    const revisions = await getRevisionsForLogo(originalLogoId, userId);
    return revisions.length;
  } catch (error) {
    console.error('Error counting revisions for logo:', error);
    throw error;
  }
};

// Check if user can create more revisions for a specific logo (now user-specific)
export const canCreateRevision = async (originalLogoId: string, userId: string): Promise<boolean> => {
  try {
    const revisionsCount = await countRevisionsForLogo(originalLogoId, userId);
    return revisionsCount < 3; // Maximum 3 revisions per logo
  } catch (error) {
    console.error('Error checking if user can create revision:', error);
    throw error;
  }
};

// Save a logo to IndexedDB (now user-specific)
export const saveLogo = async (
  userId: string,
  imageDataUri: string, 
  parameters: LogoParameters,
  originalLogoId?: string,
  name?: string
): Promise<string> => {
  try {
    const db = await initDB();
    const id = generateLogoId();
    
    // Determine if this is a revision or an original logo
    const isRevision = !!originalLogoId;
    let revisionNumber: number | undefined;
    
    if (isRevision && originalLogoId) {
      // Get existing revisions to determine the next revision number
      const existingRevisions = await getRevisionsForLogo(originalLogoId, userId);
      revisionNumber = existingRevisions.length + 1;
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readwrite');
      const store = transaction.objectStore(LOGOS_STORE);
      
      const logo: StoredLogo = {
        id,
        userId, // NEW: Store user association
        name: name?.trim() || "Untitled",
        imageDataUri,
        createdAt: Date.now(),
        parameters,
        isRevision,
        originalLogoId,
        revisionNumber
      };
      
      const request = store.add(logo);
      
      request.onsuccess = () => {
        console.log("Logo saved successfully with ID:", id);
        resolve(id);
      };
      
      request.onerror = (event) => {
        console.error("Error saving logo:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error saving logo to IndexedDB:', error);
    throw error;
  }
};

// Get a logo by ID (with user verification)
export const getLogo = async (id: string, userId?: string): Promise<StoredLogo | null> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const logo = (event.target as IDBRequest).result as StoredLogo | null;
        
        // If userId is provided, verify the logo belongs to the user
        if (logo && userId && logo.userId !== userId) {
          resolve(null); // Don't return logos that don't belong to the user
        } else {
          resolve(logo);
        }
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting logo from IndexedDB:', error);
    throw error;
  }
};

// Get all original logos for a specific user
export const getOriginalLogos = async (userId: string): Promise<StoredLogo[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      const userIndex = store.index('userId');
      
      const request = userIndex.getAll(userId);
      
      request.onsuccess = (event) => {
        const userLogos = (event.target as IDBRequest).result as StoredLogo[];
        // Filter for non-revisions (where isRevision is false)
        const originalLogos = userLogos.filter(logo => logo.isRevision === false);
        // Sort by creation date (newest first)
        originalLogos.sort((a, b) => b.createdAt - a.createdAt);
        resolve(originalLogos);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting original logos from IndexedDB:', error);
    throw error;
  }
};

// Get all revisions for a specific original logo (user-specific)
export const getRevisionsForLogo = async (originalLogoId: string, userId: string): Promise<StoredLogo[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      const userIndex = store.index('userId');
      
      const request = userIndex.getAll(userId);
      
      request.onsuccess = (event) => {
        const userLogos = (event.target as IDBRequest).result as StoredLogo[];
        // Filter for revisions of the specified original logo
        const revisions = userLogos.filter(
          logo => logo.isRevision === true && logo.originalLogoId === originalLogoId
        );
        // Sort by revision number
        revisions.sort((a, b) => (a.revisionNumber || 0) - (b.revisionNumber || 0));
        resolve(revisions);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting revisions from IndexedDB:', error);
    throw error;
  }
};

// Get all logos (originals and their revisions grouped) for a specific user
export const getAllLogosWithRevisions = async (userId: string): Promise<{
  original: StoredLogo;
  revisions: StoredLogo[];
}[]> => {
  try {
    // Get all original logos for the user
    const originals = await getOriginalLogos(userId);
    
    // For each original, get its revisions
    const logosWithRevisions = await Promise.all(
      originals.map(async (original) => {
        const revisions = await getRevisionsForLogo(original.id, userId);
        return {
          original,
          revisions
        };
      })
    );
    
    return logosWithRevisions;
  } catch (error) {
    console.error('Error getting all logos with revisions:', error);
    throw error;
  }
};

// Update user usage with values from DynamoDB (now user-specific)
export const syncUserUsageWithDynamoDB = async (userId: string, dbUsage: {
  logosCreated: number;
  logosLimit: number;
}): Promise<void> => {
  try {
    const db = await initDB();
    const currentUsage = await getUserUsage(userId);
    
    if (!currentUsage) {
      await initializeUserUsage(userId);
      return syncUserUsageWithDynamoDB(userId, dbUsage);
    }
    
    // Always use DynamoDB values as they take precedence
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USAGE_STORE], 'readwrite');
      const store = transaction.objectStore(USAGE_STORE);
      
      const updatedUsage: UserUsage = {
        ...currentUsage,
        logosCreated: dbUsage.logosCreated,
        logosLimit: dbUsage.logosLimit
      };
      
      const request = store.put(updatedUsage);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error syncing user usage with DynamoDB:', error);
    throw error;
  }
};

// Delete a logo (with user verification)
export const deleteLogo = async (id: string, userId: string): Promise<void> => {
  try {
    const db = await initDB();
    
    // First verify the logo belongs to the user
    const logo = await getLogo(id, userId);
    if (!logo) {
      throw new Error('Logo not found or access denied');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readwrite');
      const store = transaction.objectStore(LOGOS_STORE);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
};

// Rename a logo (with user verification)
export const renameLogo = async (id: string, newName: string, userId: string): Promise<void> => {
  try {
    const db = await initDB();
    const logo = await getLogo(id, userId);
    
    if (!logo) {
      throw new Error('Logo not found or access denied');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readwrite');
      const store = transaction.objectStore(LOGOS_STORE);
      
      // Update only the name field, keeping all other properties the same
      const updatedLogo = {
        ...logo,
        name: newName.trim() || "Untitled"
      };
      
      const request = store.put(updatedLogo);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error renaming logo:', error);
    throw error;
  }
};

// Reset database (clear all data)
export const resetDatabase = async (): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE, USAGE_STORE], 'readwrite');
      
      const logoStore = transaction.objectStore(LOGOS_STORE);
      const usageStore = transaction.objectStore(USAGE_STORE);
      
      const clearLogos = logoStore.clear();
      const clearUsage = usageStore.clear();
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };
      
      clearLogos.onsuccess = checkComplete;
      clearUsage.onsuccess = checkComplete;
      
      clearLogos.onerror = (event) => reject((event.target as IDBRequest).error);
      clearUsage.onerror = (event) => reject((event.target as IDBRequest).error);
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

// NEW: Clear data for a specific user only
export const clearUserData = async (userId: string): Promise<void> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE, USAGE_STORE], 'readwrite');
      
      const logoStore = transaction.objectStore(LOGOS_STORE);
      const usageStore = transaction.objectStore(USAGE_STORE);
      
      // Clear user's logos
      const userIndex = logoStore.index('userId');
      const logoRequest = userIndex.openCursor(IDBKeyRange.only(userId));
      
      logoRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      // Clear user's usage data
      const usageDeleteRequest = usageStore.delete(`usage_${userId}`);
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };
      
      logoRequest.onerror = (event) => reject((event.target as IDBRequest).error);
      usageDeleteRequest.onsuccess = checkComplete;
      usageDeleteRequest.onerror = (event) => reject((event.target as IDBRequest).error);
      
      // Count when logo clearing is done
      logoRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (!cursor) {
          checkComplete(); // No more logos to delete
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};