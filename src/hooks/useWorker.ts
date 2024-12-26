import { useState, useCallback, useRef, useEffect } from 'react';

export interface WorkerResponse {
  type: 'complete' | 'progress' | 'error';
  data?: any;
  progress?: number;
  error?: string;
}

interface UseWorkerOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export function useWorker<TInput = any, TOutput = any>(options?: UseWorkerOptions) {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const callbacksRef = useRef({
    onProgress: options?.onProgress,
    onError: options?.onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onProgress: options?.onProgress,
      onError: options?.onError,
    };
  }, [options?.onProgress, options?.onError]);

  useEffect(() => {
    console.log('Initializing worker');
    if (typeof window !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/matchWorker.ts', import.meta.url)
        );
      } catch (error) {
        console.error('Failed to initialize worker:', error);
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

  const execute = useCallback(
    (data: TInput): Promise<TOutput> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          const error = new Error('Worker not initialized');
          console.error(error);
          setError(error);
          return reject(error);
        }

        setLoading(true);
        setError(null);

        const messageHandler = (e: MessageEvent<WorkerResponse>) => {
          console.log('Received worker message:', e.data);
          switch (e.data.type) {
            case 'progress':
              if (typeof e.data.progress === 'number') {
                console.log('Progress update:', e.data.progress);
                callbacksRef.current.onProgress?.(e.data.progress);
              }
              break;

            case 'complete':
              console.log('Worker completed with data:', e.data.data);
              workerRef.current?.removeEventListener('message', messageHandler);
              setLoading(false);
              resolve(e.data.data as TOutput);
              break;

            case 'error':
              console.error('Worker error:', e.data.error);
              workerRef.current?.removeEventListener('message', messageHandler);
              const error = new Error(e.data.error || 'Unknown worker error');
              setError(error);
              setLoading(false);
              reject(error);
              break;
          }
        };

        workerRef.current.addEventListener('message', messageHandler);
        console.log('Posting message to worker:', data);
        workerRef.current.postMessage(data);
      });
    },
    []
  );

  return { execute, loading, error };
}
