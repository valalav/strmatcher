import { STRProfile } from '@/utils/constants';

const DB_NAME = 'str_matcher_db';
const DB_VERSION = 1;

export class DatabaseManager {
  private db: IDBDatabase | null = null;

  // Инициализация базы данных
  async init(): Promise<void> {
    const DB_NAME = "STRDatabase";
    const DB_VERSION = 1;
  
    return new Promise((resolve, reject) => {
      console.log("Открываем базу данных...");
      const request = indexedDB.open(DB_NAME, DB_VERSION);
  
      request.onerror = () => {
        console.error("Ошибка открытия базы данных:", request.error);
        reject(request.error);
      };
  
      request.onsuccess = () => {
        console.log("База данных открыта успешно.");
        this.db = request.result;
        resolve();
      };
  
      request.onupgradeneeded = (event) => {
        console.log("Обновление базы данных...");
        const db = (event.target as IDBOpenDBRequest).result;
      
        if (!db.objectStoreNames.contains("profiles")) {
          console.log("Создаём новое хранилище profiles...");
          db.createObjectStore("profiles", { keyPath: "kitNumber" });
        }
      };      
    });
  }
  // Сохранение профилей в базу данных
  async saveProfiles(profiles: STRProfile[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    console.log(`Сохраняем ${profiles.length} профилей...`);
    const transaction = this.db.transaction("profiles", "readwrite");
    const store = transaction.objectStore("profiles");

    return new Promise((resolve, reject) => {
      profiles.forEach((profile) => {
        if (!profile.kitNumber) {
          console.warn("Пропущен профиль без kitNumber:", profile);
          return;
        }
        store.put(profile);
      });

      transaction.oncomplete = () => {
        console.log("Сохранение завершено.");
        resolve();
      };

      transaction.onerror = () => {
        console.error("Ошибка транзакции при сохранении профилей:", transaction.error);
        reject(transaction.error);
      };
    });
  }

  // Получение всех профилей из базы данных
  async getProfiles(): Promise<STRProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
  
    console.log("Читаем профили из базы данных...");
    const transaction = this.db.transaction("profiles", "readonly");
    const store = transaction.objectStore("profiles");
  
    return new Promise((resolve, reject) => {
      const request = store.getAll();
  
      request.onsuccess = () => {
        console.log(`Получено ${request.result.length} профилей.`);
        console.table(request.result);
        resolve(request.result as STRProfile[]);
      };
  
      request.onerror = () => {
        console.error("Ошибка при чтении профилей:", request.error);
        reject(request.error);
      };
    });
  }
   

  // Очистка всех профилей из базы данных
  async clearProfiles(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    console.log("Очищаем хранилище profiles...");
    const transaction = this.db.transaction("profiles", "readwrite");
    const store = transaction.objectStore("profiles");

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log("Хранилище profiles очищено.");
        resolve();
      };

      request.onerror = () => {
        console.error("Ошибка при очистке хранилища profiles:", request.error);
        reject(request.error);
      };
    });
  }

  // Инициализация тестовых данных
  async initializeTestData(): Promise<void> {
    const testProfiles: STRProfile[] = [
      { kitNumber: "1001", name: "John Doe", haplogroup: "R-M269", markers: {}, country: "USA" },
      { kitNumber: "1002", name: "Jane Smith", haplogroup: "I-M253", markers: {}, country: "Canada" },
    ];
  
    console.log("Добавляем тестовые данные...");
    await this.saveProfiles(testProfiles);
    console.log("Тестовые данные добавлены.");
  }
}