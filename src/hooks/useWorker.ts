import { useState, useCallback, useRef, useEffect } from 'react';

// Интерфейс сообщения от воркера
interface WorkerMessage<T> {
  type: 'progress' | 'complete';
  data: T;
  progress?: number;
}

// Хук для работы с веб-воркерами
export function useWorker<T, R>(onProgress?: (progress: number) => void) {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Инициализация воркера
  useEffect(() => {
    console.log('Initializing worker'); // Лог инициализации воркера
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/matchWorker.ts', import.meta.url)
      );
    }
    return () => {
      console.log('Terminating worker'); // Лог завершения работы воркера
      workerRef.current?.terminate();
    };
  }, []);

  // Функция для выполнения работы через воркер
  const execute = useCallback(
    (data: T): Promise<R> => {
      console.log('Executing worker with data:', data); // Лог данных, передаваемых воркеру
      if (!workerRef.current) {
        console.error('Worker not initialized'); // Лог ошибки инициализации
        throw new Error('Worker not initialized');
      }

      setLoading(true);
      setError(null);

      return new Promise((resolve, reject) => {
        if (!workerRef.current) return;

        // Обработка сообщения от воркера
        workerRef.current.onmessage = (e: MessageEvent<WorkerMessage<R>>) => {
          console.log('Message received from worker:', e.data); // Лог сообщения от воркера
          if (e.data.type === 'progress' && typeof e.data.progress === 'number') {
            console.log('Progress update from worker:', e.data.progress); // Лог прогресса
            onProgress?.(e.data.progress);
          } else if (e.data.type === 'complete') {
            console.log('Worker completed with data:', e.data.data); // Лог завершения работы воркера
            setLoading(false);
            resolve(e.data.data);
          }
        };

        // Обработка ошибки воркера
        workerRef.current.onerror = (e) => {
          console.error('Worker error:', e.message); // Лог ошибки воркера
          setLoading(false);
          const error = new Error(e.message);
          setError(error);
          reject(error);
        };

        // Отправка данных в воркер
        console.log('Posting message to worker:', data); // Лог отправляемых данных
        workerRef.current.postMessage(data);
      });
    },
    [onProgress]
  );

  // Возвращаемая структура
  return { execute, loading, error };
}
