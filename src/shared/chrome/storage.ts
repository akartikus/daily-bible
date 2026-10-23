/**
 * Wrapper mince autour de `chrome.storage.local`. Clés et formes des valeurs :
 * contracts/storage-schema.md (settings, currentCycle, bookIndex). Isolé pour
 * la testabilité (constitution IV) — les tests stubbent le global `chrome`.
 */

export type StorageKey = "settings" | "currentCycle" | "bookIndex";

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

/** Observe les changements de la zone `local` pour les clés du schéma. */
export function onChanged(listener: (changes: StorageChanges) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      listener(changes as StorageChanges);
    }
  });
}
