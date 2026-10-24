/**
 * Réglages par défaut — data-model.md (Settings) : affichage auto désactivé
 * (opt-in explicite — FR-003), intervalle 25 minutes (FR-004), traduction
 * `fra_lsg` constante en v1, non exposée dans l'UI. Appliqués quand la clé
 * `settings` est absente du stockage (expérience « zéro réglage » — SC-002).
 */

export interface Settings {
  autoDisplayEnabled: boolean;
  intervalMinutes: number;
  translationId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  autoDisplayEnabled: false,
  intervalMinutes: 25,
  translationId: "fra_lsg",
};
