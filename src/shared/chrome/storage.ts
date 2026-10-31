/**
 * Thin wrapper around `chrome.storage.local` for the keys and value shapes in
 * contracts/storage-schema.md. Tests stub the global `chrome` object.
 */

export type StorageKey =
  "settings" | "currentCycle" | "pomodoroState" | `bookIndex:${string}`;

export interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

export type StorageChanges = Partial<Record<StorageKey, StorageChange>>;

/** Lit la valeur d'une clé ; `undefined` si absente (jamais null). */
export async function get<T>(key: StorageKey): Promise<T | undefined> {
  const entries =
    await chrome.storage.local.get<Record<StorageKey, T | undefined>>(key);
  return entries[key];
}

/** Écrit la valeur d'une clé et notifie les listeners onChanged. */
export async function set<T>(key: StorageKey, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Observe les changements de la zone `local` pour les clés du schéma.
 * Rend une fonction qui arrête l'observation.
 */
export function onChanged(
  listener: (changes: StorageChanges) => void,
): () => void {
  const wrapped = (changes: unknown, areaName: string): void => {
    if (areaName === "local") {
      listener(changes as StorageChanges);
    }
  };
  chrome.storage.onChanged.addListener(wrapped);
  return () => chrome.storage.onChanged.removeListener(wrapped);
}
