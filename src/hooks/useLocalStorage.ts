import { useState, useEffect, useCallback } from 'react';

export class LocalStorageHookError extends Error {
  public readonly cause?: Error;
  
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'LocalStorageHookError';
    this.cause = cause;
  }
}

/**
 * Generic hook for managing localStorage values with React state synchronization
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
): [T, (value: T | ((prevValue: T) => T)) => void, () => void, Error | null] {
  // Default JSON serializer
  const defaultSerializer = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  };
  
  const ser = serializer || defaultSerializer;
  
  // State for the stored value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? ser.deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  
  // State for tracking errors
  const [error, setError] = useState<Error | null>(null);
  
  // Function to set the value
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      setError(null);
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update state
      setStoredValue(valueToStore);
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, ser.serialize(valueToStore));
      }
    } catch (error) {
      const localStorageError = new LocalStorageHookError(
        `Error setting localStorage key "${key}"`,
        error as Error
      );
      setError(localStorageError);
      console.error(localStorageError);
    }
  }, [key, storedValue, ser]);
  
  // Function to remove the value
  const removeValue = useCallback(() => {
    try {
      setError(null);
      setStoredValue(defaultValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      const localStorageError = new LocalStorageHookError(
        `Error removing localStorage key "${key}"`,
        error as Error
      );
      setError(localStorageError);
      console.error(localStorageError);
    }
  }, [key, defaultValue]);
  
  // Listen for storage events (changes from other tabs/windows)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setError(null);
          const newValue = ser.deserialize(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          const localStorageError = new LocalStorageHookError(
            `Error syncing localStorage key "${key}" from storage event`,
            error as Error
          );
          setError(localStorageError);
          console.error(localStorageError);
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed
        setStoredValue(defaultValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, ser]);
  
  return [storedValue, setValue, removeValue, error];
}