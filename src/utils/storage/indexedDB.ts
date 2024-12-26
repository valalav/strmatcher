import { STRProfile } from '@/utils/constants';

const DB_NAME = 'str_matcher_db';
const DB_VERSION = 1;

export class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      console.log('Открываем базу данных...');
      const request = indexedDB.open(DB_NAME, DB_VERSION);
  
      request.onerror = () => {
        console.error('Ошибка открытия базы данных:', request.error);
        reject(request.error);
      };
  
      request.onsuccess = () => {
        console.log('База данных открыта успешно');
        this.db = request.result;
        resolve();
      };
  
      request.onupgradeneeded = (event) => {
        console.log('Обновление базы данных...');
        const db = (event.target as IDBOpenDBRequest).result;
  
        if (db.objectStoreNames.contains('profiles')) {
          console.log('Удаляем старое хранилище profiles');
          db.deleteObjectStore('profiles');
        }
  
        console.log('Создаем новое хранилище profiles');
        const store = db.createObjectStore('profiles', { 
          keyPath: 'kitNumber', // Убедитесь, что это поле существует
          autoIncrement: false
        });      
  
        console.log('Добавляем индексы...');
        store.createIndex('kit', 'kitNumber', { unique: true });
  
        console.log('Хранилище profiles создано');
      };
    });
  }
  

  async saveProfiles(profiles: STRProfile[]) {
    if (!this.db) throw new Error('Database not initialized');
    console.log(`Сохраняем ${profiles.length} профилей...`);
    const tx = this.db.transaction('profiles', 'readwrite');
    const store = tx.objectStore('profiles');
  
    return new Promise<void>((resolve, reject) => {
      try {
        profiles.forEach(profile => {
          if (!profile.kitNumber) {
            console.warn('Пропущен профиль без kitNumber:', profile);
            return;
          }
  
          console.log('Сохраняем профиль:', profile);
          store.put(profile);
        });
  
        tx.oncomplete = () => {
          console.log('Сохранение завершено');
          resolve();
        };
        tx.onerror = () => {
          console.error('Ошибка транзакции:', tx.error);
          reject(tx.error);
        };
      } catch (error) {
        console.error('Ошибка сохранения профилей:', error);
        reject(error);
      }
    });
  }
  

  async getProfiles(): Promise<STRProfile[]> {
    if (!this.db) throw new Error('Database not initialized');
  
    console.log('Читаем профили из IndexedDB...');
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const request = store.getAll();
  
      request.onsuccess = () => {
        console.log(`Получено ${request.result.length} профилей`);
        console.table(request.result); // Таблица профилей для наглядности
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Ошибка чтения профилей:', request.error);
        reject(request.error);
      };
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