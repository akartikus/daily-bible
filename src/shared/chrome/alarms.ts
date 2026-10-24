/**
 * Wrapper mince autour de `chrome.alarms` pour l'alarme périodique
 * « verse-interval » (data-model.md — Alarm) : créée/recréée à l'activation
 * de l'affichage automatique et à chaque changement d'intervalle, supprimée
 * à la désactivation, recréée si absente à chaque démarrage du service
 * worker (recommandation officielle chrome.alarms). Isolé pour la
 * testabilité (constitution IV) — les tests stubbent le global `chrome`.
 */

export const ALARM_NAME = "verse-interval";

/** Crée (ou recrée) l'alarme périodique avec periodInMinutes = intervalMinutes. */
export function createVerseIntervalAlarm(intervalMinutes: number): void {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: intervalMinutes });
}

/** Supprime l'alarme (désactivation de l'affichage automatique). */
export async function clearVerseIntervalAlarm(): Promise<void> {
  await chrome.alarms.clear(ALARM_NAME);
}

/**
 * Garantit la présence de l'alarme au démarrage du service worker : la
 * recrée seulement si absente — recréer une alarme existante remettrait
 * son échéance à zéro (rythme fixe conservé).
 */
export async function ensureVerseIntervalAlarm(
  intervalMinutes: number,
): Promise<void> {
  const alarm = await chrome.alarms.get(ALARM_NAME);
  if (!alarm) {
    createVerseIntervalAlarm(intervalMinutes);
  }
}
