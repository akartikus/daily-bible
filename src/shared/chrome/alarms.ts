/**
 * Wrapper mince autour de `chrome.alarms` pour les alarmes :
 * - « verse-interval » (data-model.md — Alarm) : alarme périodique pour
 *   l'affichage automatique (feature 001)
 * - « pomodoro-phase » (data-model.md — Alarm) : alarme one-shot pour
 *   déclencher la transition de phase du pomodoro (feature 002)
 * Isolé pour la testabilité (constitution IV) — les tests stubbent le global
 * `chrome`.
 */

export const ALARM_NAME = "verse-interval";
export const POMODORO_ALARM_NAME = "pomodoro-phase";

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

/**
 * Crée (ou recrée) l'alarme one-shot pomodoro-phase avec l'échéance
 * fournie en epoch ms. Utilisée pour déclencher la transition de phase
 * du pomodoro (focus → pause / longue pause).
 */
export function createPomodoroPhaseAlarm(phaseEndsAt: number): void {
  chrome.alarms.create(POMODORO_ALARM_NAME, { when: phaseEndsAt });
}

/*** Supprime l'alarme pomodoro-phase (suspension, reset, etc.). */
export async function clearPomodoroPhaseAlarm(): Promise<void> {
  await chrome.alarms.clear(POMODORO_ALARM_NAME);
}
