import { useEffect, useState } from "react";

// Persist any piece of state to the browser's local storage.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

export const todayStr = () => new Date().toISOString().slice(0, 10);
export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
