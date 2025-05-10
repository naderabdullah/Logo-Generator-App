// src/app/utils/indexedDBUtils.ts
import { v4 as uuidv4 } from 'uuid';

// Define the logo interface
export interface StoredLogo {
  id: string;
  imageDataUri: string;
  createdAt: number;
  parameters: LogoParameters;
}

// Interface for logo generation parameters
export interface LogoParameters {
  companyName: string;
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
}

// Database configuration
const DB_NAME = 'logoGeneratorDB';
const DB_VERSION = 1;
const LOGOS_STORE = 'logos';

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(LOGOS_STORE)) {
        const store = db.createObjectStore(LOGOS_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
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

// Save a logo to IndexedDB
export const saveLogo = async (
  imageDataUri: string, 
  parameters: LogoParameters
): Promise<string> => {
  try {
    const db = await initDB();
    const id = generateLogoId();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readwrite');
      const store = transaction.objectStore(LOGOS_STORE);
      
      const logo: StoredLogo = {
        id,
        imageDataUri,
        createdAt: Date.now(),
        parameters
      };
      
      const request = store.add(logo);
      
      request.onsuccess = () => {
        resolve(id);
      };
      
      request.onerror = (event) => {
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

// Get all logos (with optional limit)
export const getAllLogos = async (limit?: number): Promise<StoredLogo[]> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOGOS_STORE], 'readonly');
      const store = transaction.objectStore(LOGOS_STORE);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // Get in reverse chronological order
      
      const logos: StoredLogo[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && (!limit || logos.length < limit)) {
          logos.push(cursor.value);
          cursor.continue();
        } else {
          resolve(logos);
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
    console.error('Error getting logos from IndexedDB:', error);
    throw error;
  }
};

// Delete a logo by ID
export const deleteLogo = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    
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
    console.error('Error deleting logo from IndexedDB:', error);
    throw error;
  }
};