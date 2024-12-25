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
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/matchWorker.ts', import.meta.url)
      );
    }
    return () => {
      // Завершение работы воркера при размонтировании
      workerRef.current?.terminate();
    };
  }, []);

  // Функция для выполнения работы через воркер
  const execute = useCallback(
    (data: T): Promise<R> => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      setLoading(true);
      setError(null);

      return new Promise((resolve, reject) => {
        if (!workerRef.current) return;

        // Обработка сообщения от воркера
        workerRef.current.onmessage = (e: MessageEvent<WorkerMessage<R>>) => {
          if (e.data.type === 'progress' && typeof e.data.progress === 'number') {
            onProgress?.(e.data.progress);
          } else if (e.data.type === 'complete') {
            setLoading(false);
            resolve(e.data.data);
          }
        };

        // Обработка ошибки воркера
        workerRef.current.onerror = (e) => {
          setLoading(false);
          const error = new Error(e.message);
          setError(error);
          reject(error);
        };

        // Отправка данных в воркер
        workerRef.current.postMessage(data);
      });
    },
    [onProgress]
  );

  // Возвращаемая структура
  return { execute, loading, error };
}