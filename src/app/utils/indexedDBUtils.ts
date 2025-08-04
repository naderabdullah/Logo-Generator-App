// src/app/utils/indexedDBUtils.ts
import { v4 as uuidv4 } from 'uuid';

// Define the logo interface with revision tracking and name field
export interface StoredLogo {
  id: string;
  name: string; // New field for logo name
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
  typographyStyle?: string;
  lineStyle?: string;
  composition?: string;
  shapeEmphasis?: string;
  texture?: string;
  complexityLevel?: string;
  applicationContext?: string;
  specialInstructions?: string;
}

// Interface for usage tracking
export interface UserUsage {
  id: string; // "usage" as the ID for the single record
  logosCreated: number;
  logosLimit: number;
}

// Database configuration
const DB_NAME = 'logoGeneratorDB';
const DB_VERSION = 3; // Increased version for schema update to add name field
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
        }
      }
      
      // Create usage store
      if (!db.objectStoreNames.contains(USAGE_STORE)) {
        db.createObjectStore(USAGE_STORE, { keyPath: 'id' });
      }
      
      // Migrate existing logos to add name field if upgrading from version 2
      if (oldVersion < 3 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const store = transaction.objectStore(LOGOS_STORE);
          
          // Get all existing logos and add name field
          store.openCursor().onsuccess = (cursorEvent) => {
            const cursor = (cursorEvent.target as IDBRequest).result;
            if (cursor) {
              const logo = cursor.value;
              if (!logo.name) {
                logo.name = "Untitled";
                cursor.update(logo);
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

// Initialize user usage
export const initializeUserUsage = async (): Promise<void> => {
  try {
    const db = await initDB();
    const usage = await getUserUsage();
    
    if (!usage) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([USAGE_STORE], 'readwrite');
        const store = transaction.objectStore(USAGE_STORE);
        
        const initialUsage: UserUsage = {
          id: 'usage', // Single record
          logosCreated: 0,
          logosLimit: 0 // Changed from 10 to 0
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

// Get user usage
export const getUserUsage = async (): Promise<UserUsage | null> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USAGE_STORE], 'readonly');
      const store = transaction.objectStore(USAGE_STORE);
      const request = store.get('usage');
      
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
    throw error;
  }
};

// Update user usage
export const updateUserUsage = async (update: Partial<UserUsage>): Promise<void> => {
  try {
    const db = await initDB();
    const currentUsage = await getUserUsage();
    
    if (!currentUsage) {
      await initializeUserUsage();
      return updateUserUsage(update);
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USAGE_STORE], 'readwrite');
      const store = transaction.objectStore(USAGE_STORE);
      
      const updatedUsage: UserUsage = {
        ...currentUsage,
        ...update
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
    console.error('Error updating user usage:', error);
    throw error;
  }
};

// Increment logos created count
export const incrementLogosCreated = async (): Promise<void> => {
  try {
    const usage = await getUserUsage();
    
    if (!usage) {
      await initializeUserUsage();
      return incrementLogosCreated();
    }
    
    await updateUserUsage({
      logosCreated: usage.logosCreated + 1
    });
  } catch (error) {
    console.error('Error incrementing logos created:', error);
    throw error;
  }
};

// Check if user can create more original logos
export const canCreateOriginalLogo = async (): Promise<boolean> => {
  try {
    // First try to get the latest values from DynamoDB
    try {
      const response = await fetch('/user');
      if (response.ok) {
        const userData = await response.json();
        
        // Sync with IndexedDB but use the values directly for the check
        await syncUserUsageWithDynamoDB({
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
    const usage = await getUserUsage();
    
    if (!usage) {
      await initializeUserUsage();
      return canCreateOriginalLogo();
    }
    
    return usage.logosCreated < usage.logosLimit;
  } catch (error) {
    console.error('Error checking if user can create original logo:', error);
    throw error;
  }
};

// Count revisions for a specific original logo
export const countRevisionsForLogo = async (originalLogoId: string): Promise<number> => {
  try {
    const revisions = await getRevisionsForLogo(originalLogoId);
    return revisions.length;
  } catch (error) {
    console.error('Error counting revisions for logo:', error);
    throw error;
  }
};

// Check if user can create more revisions for a specific logo
export const canCreateRevision = async (originalLogoId: string): Promise<boolean> => {
  try {
    const revisionsCount = await countRevisionsForLogo(originalLogoId);
    return revisionsCount < 3; // Maximum 3 revisions per logo
  } catch (error) {
    console.error('Error checking if user can create revision:', error);
    throw error;
  }
};

// Save a logo to IndexedDB
export const saveLogo = async (
  imageDataUri: string, 
  parameters: LogoParameters,
  originalLogoId?: string,
  name?: string // New optional name parameter
): Promise<string> => {
  try {
    const db = await initDB();
    const id = generateLogoId();
    
    // Determine if this is a revision or an original logo
    const isRevision = !!originalLogoId;
    
    // For revisions, determine the revision number and set proper name
    let revisionNumber: number | undefined = undefined;
    let finalName = name || "Untitled";
    console.log("Initial finalName:", finalName);
    
    if (isRevision && originalLogoId) {
      try {
        // Get revisions and original logo
        const revisions = await getRevisionsForLogo(originalLogoId);
        revisionNumber = revisions.length + 1;
        
        // Get the original logo to base the revision name on it
        const originalLogo = await getLogo(originalLogoId);
        
        if (originalLogo) {
          // Set the revision name based on the original logo name
          const baseName = originalLogo.name || "Untitled";
          finalName = `${baseName} - Revision ${revisionNumber}`;
          console.log("Setting revision name to:", finalName);
        }
        
        // Validate revision limits
        if (revisionNumber > 3) {
          throw new Error('Maximum revisions reached for this logo');
        }
      } catch (err) {
        console.error("Error processing revision:", err);
        // Fallback to a default name if something went wrong with original logo retrieval
        finalName = `Logo Revision ${Date.now()}`;
      }
    } else {
      // Validate logo creation limits for original logos
      const canCreate = await canCreateOriginalLogo();
      if (!canCreate) {
        throw new Error('Maximum logo limit reached');
      }
      
      // Increment the logos created count
      await incrementLogosCreated();
    }
    
    console.log("Final name before saving:", finalName);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readwrite');
      const store = transaction.objectStore(LOGOS_STORE);
      
      const logo: StoredLogo = {
        id,
        name: finalName, // Use the determined name with revision suffix if applicable
        imageDataUri,
        createdAt: Date.now(),
        parameters,
        isRevision,
        originalLogoId,
        revisionNumber
      };
      
      console.log("Logo object being saved:", {
        id: logo.id,
        name: logo.name,
        isRevision: logo.isRevision,
        originalLogoId: logo.originalLogoId,
        revisionNumber: logo.revisionNumber
      });
      
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

// New function to rename a logo
export const renameLogo = async (id: string, newName: string): Promise<void> => {
  try {
    const db = await initDB();
    const logo = await getLogo(id);
    
    if (!logo) {
      throw new Error('Logo not found');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readwrite');
      const store = transaction.objectStore(LOGOS_STORE);
      
      // Update only the name field, keeping all other properties the same
      const updatedLogo = {
        ...logo,
        name: newName.trim() || "Untitled" // Use "Untitled" if empty string
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

// Get a logo by ID
export const getLogo = async (id: string): Promise<StoredLogo | null> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      const request = store.get(id);
      
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
    console.error('Error getting logo from IndexedDB:', error);
    throw error;
  }
};

// Get all original logos (non-revisions)
export const getOriginalLogos = async (): Promise<StoredLogo[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      
      // Get all logos first, then filter them in JavaScript
      // This avoids issues with boolean values in IDBKeyRange
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const allLogos = (event.target as IDBRequest).result as StoredLogo[];
        // Filter for non-revisions (where isRevision is false)
        const originalLogos = allLogos.filter(logo => logo.isRevision === false);
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

// Get all revisions for a specific original logo
export const getRevisionsForLogo = async (originalLogoId: string): Promise<StoredLogo[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      
      // Get all logos first, then filter them in JavaScript
      // This is more reliable across browsers than using IDBKeyRange with complex types
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const allLogos = (event.target as IDBRequest).result as StoredLogo[];
        // Filter for revisions of the specified original logo
        const revisions = allLogos.filter(
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

// Get all logos (originals and their revisions grouped)
export const getAllLogosWithRevisions = async (): Promise<{
  original: StoredLogo;
  revisions: StoredLogo[];
}[]> => {
  try {
    // Get all original logos
    const originals = await getOriginalLogos();
    
    // For each original, get its revisions
    const logosWithRevisions = await Promise.all(
      originals.map(async (original) => {
        const revisions = await getRevisionsForLogo(original.id);
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

// Update user usage with values from DynamoDB
export const syncUserUsageWithDynamoDB = async (dbUsage: {
  logosCreated: number;
  logosLimit: number;
}): Promise<void> => {
  try {
    const db = await initDB();
    const currentUsage = await getUserUsage();
    
    if (!currentUsage) {
      await initializeUserUsage();
      return syncUserUsageWithDynamoDB(dbUsage);
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

// Delete a logo by ID (including its revisions if it's an original)
export const deleteLogo = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    const logo = await getLogo(id);
    
    if (!logo) {
      throw new Error('Logo not found');
    }
    
    // If this is an original logo, delete all its revisions first
    if (!logo.isRevision) {
      const revisions = await getRevisionsForLogo(id);
      
      for (const revision of revisions) {
        await deleteLogoInternal(db, revision.id);
      }
    } else {
      // If this is a revision, just delete it
      await deleteLogoInternal(db, id);
      return;
    }
    
    // Delete the original logo
    await deleteLogoInternal(db, id);
    
  } catch (error) {
    console.error('Error deleting logo from IndexedDB:', error);
    throw error;
  }
};

// Internal helper function for deleting a logo
const deleteLogoInternal = async (db: IDBDatabase, id: string): Promise<void> => {
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
      // Don't close the database here, as it might be used for other operations
    };
  });
};

// Add this function to indexedDBUtils.ts
export const resetDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // This will delete the entire database
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      console.log('Database deleted successfully');
      // Reinitialize with new settings
      initializeUserUsage()
        .then(() => {
          console.log('Database reinitialized with new settings');
          resolve();
        })
        .catch(reject);
    };
    
    request.onerror = (event) => {
      console.error('Error deleting database:', event);
      reject(new Error('Failed to delete database'));
    };
  });
};

// Run this in your console or call it from a component
// resetDatabase().then(() => location.reload());