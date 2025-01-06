import { useEffect, useState, Dispatch, SetStateAction } from "react";

export type Storage = "localStorage" | "sessionStorage";
export const StorageTypes = {
  Local: "localStorage" as Storage,
  Session: "sessionStorage" as Storage,
};

type Value<T> = T | null;
type SetValue<T> = Dispatch<SetStateAction<T>>;

export function useStorageState<T>(
  key: string,
  storageType: Storage,
  defaultValue?: () => T | T
): [Value<T>, SetValue<T>, () => void] {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = (): Value<T> => {
    // Prevent build error "window is undefined" but keep keep working
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const valueInStorage = window[storageType].getItem(key);

      if (valueInStorage) {
        return JSON.parse(valueInStorage) as T;
      }
      // if you have some complex logic necessary to create the default value then pass a function otherwise just the default value
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue ?? null;
    } catch (error) {
      console.warn(`Error reading ${storageType} key “${key}”:`, error);
      return null;
    }
  };

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(
    // lazy initialization
    // read value one time only the first time the component mounts and not on every rerender
    // reading from local or session storage is an expensive process and we shouldn't need to
    // constantly read on every rerender.
    readValue()
  );

  const removeValue = () => {
    // Prevent build error "window is undefined" but keeps working
    if (typeof window === "undefined") {
      console.warn(
        `Tried removing ${storageType} key “${key}” even though environment is not a client`
      );
    }

    try {
      // remove from local/session storage
      window[storageType].removeItem(key);
      setStoredValue(null);

      // We dispatch a custom event so every useStorage hook are notified
      window.dispatchEvent(
        new Event(
          storageType === StorageTypes.Local
            ? StorageTypes.Local
            : StorageTypes.Session
        )
      );
    } catch (error) {
      console.warn(`Error removing ${storageType} key “${key}”:`, error);
    }
  };

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage/sessionStorage.
  const setValue: SetValue<T> = (value) => {
    // Prevent build error "window is undefined" but keeps working
    if (typeof window === "undefined") {
      console.warn(
        `Tried setting ${storageType} key “${key}” even though environment is not a client`
      );
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const newValue =
        value instanceof Function ? value(storedValue as T) : value;

      // Save to local/session storage
      window[storageType].setItem(key, JSON.stringify(newValue));

      // Save state
      setStoredValue(newValue);

      // We dispatch a custom event so every useStorage hook are notified
      window.dispatchEvent(
        new Event(
          storageType === StorageTypes.Local
            ? StorageTypes.Local
            : StorageTypes.Session
        )
      );
    } catch (error) {
      console.warn(`Error setting ${storageType} key “${key}”:`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    // this only works for other documents, not the current one
    window.addEventListener("storage", handleStorageChange);

    // this is a custom event, triggered in writeValueToLocalStorage
    window.addEventListener(
      storageType === StorageTypes.Local
        ? StorageTypes.Local
        : StorageTypes.Session,
      handleStorageChange
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        storageType === StorageTypes.Local
          ? StorageTypes.Local
          : StorageTypes.Session,
        handleStorageChange
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [storedValue, setValue, removeValue];
}
