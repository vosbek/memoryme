import { useState, useCallback } from 'react';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export const useAsyncOperation = <T, P extends unknown[]>(
  asyncFunction: (...args: P) => Promise<T>,
  options: UseAsyncOperationOptions = {}
) => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { onSuccess, onError, retryCount = 0, retryDelay = 1000 } = options;

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const executeWithRetry = async (attempt: number): Promise<T | null> => {
        try {
          const result = await asyncFunction(...args);
          setState({ data: result, loading: false, error: null });
          onSuccess?.();
          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error');
          
          if (attempt < retryCount) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            return executeWithRetry(attempt + 1);
          } else {
            setState({ data: null, loading: false, error: err });
            onError?.(err);
            return null;
          }
        }
      };

      return executeWithRetry(0);
    },
    [asyncFunction, onSuccess, onError, retryCount, retryDelay]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};