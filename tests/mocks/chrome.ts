import { vi } from "vitest";

/**
 * Mock des APIs Chrome consommées par l'extension : storage, alarms, action,
 * runtime. Installation dans une suite de tests :
 *
 * ```ts
 * const mock = createChromeMock();
 * vi.stubGlobal("chrome", mock.chrome);
 * ```
 *
 * Les helpers `fireAlarm` et `fireStorageChange` simulent les événements
 * externes (déclenchement d'une alarme, écriture dans une autre zone).
 */

export interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

type StorageListener = (
  changes: Record<string, StorageChange>,
  areaName: string,
) => void;

type Alarm = { name: string; periodInMinutes?: number; when?: number };

type AlarmListener = (alarm: Alarm) => void;

type MessageListener = (
  message: unknown,
  sender: { id: string },
  sendResponse: (response: unknown) => void,
) => boolean | undefined | void;

type StartupListener = () => void;

type InstalledListener = (details: { reason: "install" | "update" }) => void;

export interface ChromeMock {
  /** Objet à installer comme global `chrome` (vi.stubGlobal). */
  chrome: typeof chrome;
  /** Simule le déclenchement de `chrome.alarms.onAlarm`. */
  fireAlarm(name: string): void;
  /** Simule le démarrage du navigateur (`chrome.runtime.onStartup`). */
  fireStartup(): void;
  /** Simule l'installation/mise à jour (`chrome.runtime.onInstalled`). */
  fireInstalled(): void;
  /** Simule un changement de stockage, typiquement hors zone `local`. */
  fireStorageChange(
    changes: Record<string, StorageChange>,
    areaName: string,
  ): void;
}

export function createChromeMock(): ChromeMock {
  const storageArea = new Map<string, unknown>();
  const storageListeners = new Set<StorageListener>();
  const alarmListeners = new Set<AlarmListener>();
  const messageListeners = new Set<MessageListener>();
  const startupListeners = new Set<StartupListener>();
  const installedListeners = new Set<InstalledListener>();
  const alarms = new Map<string, Alarm>();

  function fireStorageChange(
    changes: Record<string, StorageChange>,
    areaName: string,
  ): void {
    for (const listener of storageListeners) {
      listener(changes, areaName);
    }
  }

  const chromeMock = {
    storage: {
      local: {
        get: vi.fn(
          async (
            keys: string | string[] | null | undefined,
          ): Promise<Record<string, unknown>> => {
            if (keys === null || keys === undefined) {
              return Object.fromEntries(storageArea);
            }
            const wanted = Array.isArray(keys) ? keys : [keys];
            const found = wanted.filter((key) => storageArea.has(key));
            return Object.fromEntries(
              found.map((key) => [key, storageArea.get(key)]),
            );
          },
        ),
        set: vi.fn(async (items: Record<string, unknown>): Promise<void> => {
          const changes: Record<string, StorageChange> = {};
          for (const [key, newValue] of Object.entries(items)) {
            changes[key] = {
              oldValue: storageArea.has(key) ? storageArea.get(key) : undefined,
              newValue,
            };
            storageArea.set(key, newValue);
          }
          fireStorageChange(changes, "local");
        }),
      },
      onChanged: {
        addListener: vi.fn((listener: StorageListener) =>
          storageListeners.add(listener),
        ),
        removeListener: vi.fn((listener: StorageListener) =>
          storageListeners.delete(listener),
        ),
      },
    },
    alarms: {
      create: vi.fn(
        (
          name: string,
          alarmInfo: { periodInMinutes?: number; when?: number },
        ): void => {
          alarms.set(name, {
            name,
            ...(alarmInfo.periodInMinutes === undefined
              ? {}
              : { periodInMinutes: alarmInfo.periodInMinutes }),
            ...(alarmInfo.when === undefined ? {} : { when: alarmInfo.when }),
          });
        },
      ),
      clear: vi.fn(async (name?: string): Promise<boolean> => {
        if (name === undefined) {
          alarms.clear();
          return true;
        }
        return alarms.delete(name);
      }),
      get: vi.fn(async (name?: string): Promise<Alarm | undefined> =>
        name === undefined ? [...alarms.values()][0] : alarms.get(name),
      ),
      getAll: vi.fn(async (): Promise<Alarm[]> => [...alarms.values()]),
      onAlarm: {
        addListener: vi.fn((listener: AlarmListener) =>
          alarmListeners.add(listener),
        ),
        removeListener: vi.fn((listener: AlarmListener) =>
          alarmListeners.delete(listener),
        ),
      },
    },
    action: {
      openPopup: vi.fn(async (): Promise<void> => {}),
    },
    runtime: {
      sendMessage: vi.fn(
        (message: unknown): Promise<unknown> =>
          new Promise((resolve) => {
            let responded = false;
            let asynchronous = false;
            const sendResponse = (response: unknown): void => {
              if (!responded) {
                responded = true;
                resolve(response);
              }
            };
            for (const listener of [...messageListeners]) {
              const keepChannelOpen = listener(
                message,
                { id: "mock" },
                sendResponse,
              );
              if (keepChannelOpen === true) {
                asynchronous = true;
              }
            }
            if (!responded && !asynchronous) {
              resolve(undefined);
            }
          }),
      ),
      onMessage: {
        addListener: vi.fn((listener: MessageListener) =>
          messageListeners.add(listener),
        ),
        removeListener: vi.fn((listener: MessageListener) =>
          messageListeners.delete(listener),
        ),
      },
      onStartup: {
        addListener: vi.fn((listener: StartupListener) =>
          startupListeners.add(listener),
        ),
        removeListener: vi.fn((listener: StartupListener) =>
          startupListeners.delete(listener),
        ),
      },
      onInstalled: {
        addListener: vi.fn((listener: InstalledListener) =>
          installedListeners.add(listener),
        ),
        removeListener: vi.fn((listener: InstalledListener) =>
          installedListeners.delete(listener),
        ),
      },
    },
  };

  return {
    chrome: chromeMock as unknown as typeof chrome,
    fireAlarm(name: string): void {
      const alarm = alarms.get(name) ?? {
        name,
        periodInMinutes: undefined,
        when: undefined,
      };
      for (const listener of alarmListeners) {
        listener(alarm);
      }
    },
    fireStartup(): void {
      for (const listener of startupListeners) {
        listener();
      }
    },
    fireInstalled(): void {
      for (const listener of installedListeners) {
        listener({ reason: "install" });
      }
    },
    fireStorageChange,
  };
}
