import { useState, useCallback, useRef, useEffect } from 'react';

// Расширенный интерфейс сообщения от воркера
interface WorkerMessage<T> {
  type: 'progress' | 'complete' | 'error';
  data?: T;
  progress?: number;
  error?: string;
}

// Интерфейс параметров хука
interface UseWorkerOptions<T, R> {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  initialData?: T;
  transform?: (data: R) => R;
}

// Хук для работы с веб-воркерами
export function useWorker<T, R>(options?: UseWorkerOptions<T, R>) {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef({
    onProgress: options?.onProgress,
    onError: options?.onError
  });

  // Обновление колбэков при изменении
  useEffect(() => {
    callbacksRef.current = {
      onProgress: options?.onProgress,
      onError: options?.onError
    };
  }, [options?.onProgress, options?.onError]);

  // Инициализация воркера
  useEffect(() => {
    console.log('Initializing worker');
    if (typeof window !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/matchWorker.ts', import.meta.url)
        );
      } catch (initError) {
        console.error('Failed to initialize worker:', initError);
        const workerError = new Error('Worker initialization failed');
        setError(workerError);
        callbacksRef.current.onError?.(workerError);
      }
    }

    return () => {
      console.log('Terminating worker');
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Функция для выполнения работы через воркер
  const execute = useCallback(
    (data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        // Проверка инициализации воркера
        if (!workerRef.current) {
          const initError = new Error('Worker not initialized');
          console.error(initError);
          setError(initError);
          callbacksRef.current.onError?.(initError);
          return reject(initError);
        }

        // Сбрасываем предыдущее состояние
        setLoading(true);
        setError(null);

        // Обработка сообщений от воркера
        const messageHandler = (e: MessageEvent<WorkerMessage<R>>) => {
          console.log('Message received from worker:', e.data);

          switch (e.data.type) {
            case 'progress':
              if (typeof e.data.progress === 'number') {
                console.log('Progress update:', e.data.progress);
                callbacksRef.current.onProgress?.(e.data.progress);
              }
              break;

            case 'complete':
              workerRef.current?.removeEventListener('message', messageHandler);
              setLoading(false);
              
              if (e.data.data) {
                resolve(e.data.data);
              } else {
                const noDataError = new Error('Worker completed without data');
                console.warn(noDataError);
                setError(noDataError);
                reject(noDataError);
              }
              break;

            case 'error':
              workerRef.current?.removeEventListener('message', messageHandler);
              const workerError = new Error(e.data.error || 'Unknown worker error');
              console.error('Worker error:', workerError);
              setError(workerError);
              callbacksRef.current.onError?.(workerError);
              reject(workerError);
              break;
          }
        };

        // Обработка необработанных ошибок воркера
        const errorHandler = (e: ErrorEvent) => {
          console.error('Unhandled worker error:', e);
          const unhandledError = new Error(e.message || 'Unhandled worker error');
          setError(unhandledError);
          callbacksRef.current.onError?.(unhandledError);
          reject(unhandledError);
        };

        // Добавляем обработчики
        workerRef.current.addEventListener('message', messageHandler);
        workerRef.current.addEventListener('error', errorHandler);

        // Отправка данных в воркер
        console.log('Posting message to worker:', data);
        workerRef.current.postMessage(data);
      });
    },
    []
  );

  // Возвращаемая структура
  return { 
    execute, 
    loading, 
    error 
  };
}