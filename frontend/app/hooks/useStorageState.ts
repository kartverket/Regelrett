import { useEffect, useState } from "react";

export const useLocalstorageState = <T>(key: string, initialValue: T) => {
  return useStorageState(localStorage, key, initialValue);
};

export const useSessionStorageState = <T>(key: string, initialValue: T) => {
  return useStorageState(sessionStorage, key, initialValue);
};

const useStorageState = <T>(storage: Storage, key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const storedValue = storage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    storage.setItem(key, JSON.stringify(value));
  }, [key, value, setValue, storage]);

  return [value, setValue] as const;
};
