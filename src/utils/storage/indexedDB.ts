import { STRProfile } from '@/utils/constants';

const DB_NAME = 'str_matcher_db';
const DB_VERSION = 1;

class DatabaseManager {
  private db: IDBDatabase | null = null;

  // Инициализация базы данных
  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

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
          autoIncrement: false,
        });
        store.createIndex('kit', 'kitNumber', { unique: true });
      };
    });
  }

  // Сохранение профилей в базе данных
  async saveProfiles(profiles: STRProfile[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('profiles', 'readwrite');
    const store = tx.objectStore('profiles');

    return new Promise<void>((resolve, reject) => {
      try {
        profiles.forEach((profile) => {
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

  // Получение всех профилей из базы данных
  async getProfiles(): Promise<STRProfile[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<STRProfile[]>((resolve, reject) => {
      const tx = this.db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as STRProfile[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Очистка всех профилей из базы данных
  async clearProfiles(): Promise<void> {
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

// Экспорт класса
export { DatabaseManager };
export default DatabaseManager;
