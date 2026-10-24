/**
 * Store des réglages du popup (contracts/storage-schema.md) : chargement
 * avec application des défauts si absent (expérience « zéro réglage » —
 * SC-002), écriture au changement, synchronisation via onChanged. Le service
 * worker recrée ou supprime l'alarme en réaction à chaque écriture.
 */

import { get, onChanged, set } from "../../shared/chrome/storage";
import {
  DEFAULT_SETTINGS,
  type Settings,
} from "../../shared/settings/defaults";

export class SettingsStore {
  settings = $state<Settings>({ ...DEFAULT_SETTINGS });

  /** Lecture des réglages ; défauts appliqués si absents. */
  async load(): Promise<void> {
    const stored = await get<Settings>("settings");
    this.settings = stored ?? { ...DEFAULT_SETTINGS };
  }

  /** Écrit les réglages dans storage.local et met l'état à jour. */
  async update(settings: Settings): Promise<void> {
    await set("settings", settings);
    this.settings = settings;
  }

  /** Observe les écritures externes pendant l'ouverture du popup. */
  observe(): void {
    onChanged((changes) => {
      const settings = changes.settings?.newValue as Settings | undefined;
      if (settings) {
        this.settings = settings;
      }
    });
  }
}
