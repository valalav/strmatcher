import { STRProfile } from '@/utils/constants';

const DB_NAME = 'str_matcher_db';
const DB_VERSION = 1;

export class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('str_matcher_db', 1);
  
      request.onerror = () => reject(request.error);
  
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
  
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains('profiles')) {
          db.deleteObjectStore('profiles');
        }
        const store = db.createObjectStore('profiles', { 
          keyPath: 'kitNumber',
          autoIncrement: false
        });      
        store.createIndex('kit', 'kitNumber', { unique: true });
      };
    });
  }

  async saveProfiles(profiles: STRProfile[]) {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('profiles', 'readwrite');
    const store = tx.objectStore('profiles');
  
    return new Promise<void>((resolve, reject) => {
      try {
        profiles.forEach(profile => {
          if (!profile.kitNumber) return;
          store.put(profile);
        });
  
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getProfiles(): Promise<STRProfile[]> {
    if (!this.db) throw new Error('Database not initialized');
  
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const request = store.getAll();
  
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearProfiles() {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('profiles', 'readwrite'); 
    const store = tx.objectStore('profiles');

    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export { DatabaseManager };