import { useState, useCallback, useRef, useEffect } from 'react';

interface WorkerMessage {
  type: 'progress' | 'complete';
  data: any;
  progress?: number;
}

export function useWorker<T, R>(onProgress?: (progress: number) => void) {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../workers/matchWorker.ts', import.meta.url));
    }
    return () => workerRef.current?.terminate();
  }, []);

  const execute = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      setLoading(true);
      setError(null);

      workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'progress' && typeof e.data.progress === 'number') {
          onProgress?.(e.data.progress);
        } else if (e.data.type === 'complete') {
          setLoading(false);
          resolve(e.data.data);
        }
      };

      workerRef.current.onerror = (e) => {
        setLoading(false);
        const error = new Error(e.message);
        setError(error);
        reject(error);
      };

      workerRef.current.postMessage(data);
    });
  }, [onProgress]);

  return { execute, loading, error };
}