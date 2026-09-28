import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Lire la valeur dans localStorage au démarrage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sauvegarder la valeur dans localStorage
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error("Erreur localStorage");
    }
  };

  return [storedValue, setValue] as const;
}
