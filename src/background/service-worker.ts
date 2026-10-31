/**
 * Orchestration du pomodoro biblique (service worker MV3).
 *
 * - Au message « ensure-current-verse » : réaffiche le verset du cycle
 *   courant s'il existe (FR-002 : un clic manuel ne consomme pas de tirage),
 *   sinon tire un verset, l'écrit dans currentCycle et répond. Toute erreur
 *   est convertie en réponse { error } affichable (FR-011).
 * - Pomodoro automatique (FR-003/FR-005) : l'alarme « verse-interval » est
 *   garantie à chaque démarrage du service worker (onStartup/onInstalled)
 *   si l'affichage auto est activé, recréée/supprimée au changement de
 *   réglages, et à chaque échéance le popup s'ouvre sans condition puis un
 *   nouveau verset est tiré. En cas d'échec du tirage, l'ancien verset reste
 *   (dégradation gracieuse — contracts/ui-behavior.md).
 */

import { BibleApiError } from "../shared/bible/api";
import { drawRandomVerse, translationForLocale } from "../shared/bible/draw";
import type { Verse } from "../shared/bible/extract";
import { getMessages, resolveUiLocale } from "../shared/i18n";
import { openPopup } from "../shared/chrome/action";
import {
  ALARM_NAME,
  clearVerseIntervalAlarm,
  createVerseIntervalAlarm,
  ensureVerseIntervalAlarm,
} from "../shared/chrome/alarms";
import { registerPomodoro } from "./pomodoro";
import { onMessage } from "../shared/chrome/runtime";
import { get, onChanged, set } from "../shared/chrome/storage";
import { readSettings, type Settings } from "../shared/settings/defaults";

export interface EnsureCurrentVerseRequest {
  type: "ensure-current-verse";
}

export type EnsureCurrentVerseResponse = { verse: Verse } | { error: string };

interface CurrentCycle {
  verse: Verse | null;
  startedAt: number;
}

onMessage<EnsureCurrentVerseRequest>((message, _sender, sendResponse) => {
  if (message.type !== "ensure-current-verse") {
    return;
  }
  void ensureCurrentVerse().then(sendResponse);
  return true; // garde le canal ouvert pour la réponse asynchrone
});

// Garantir l'alarme à chaque démarrage du service worker (recommandation
// officielle chrome.alarms — data-model.md Alarm) si l'affichage auto est
// activé ; ensure ne recrée pas une alarme déjà présente (rythme fixe).
chrome.runtime.onStartup.addListener(() => {
  void ensureAlarmFromSettings();
});
chrome.runtime.onInstalled.addListener(() => {
  void ensureAlarmFromSettings();
});

// Enregistrer l'orchestration pomodoro (feature 002)
registerPomodoro();

// Recréer ou supprimer l'alarme à chaque écriture des réglages :
// activation, désactivation, changement d'intervalle (storage-schema.md).
onChanged((changes) => {
  if (!changes.settings) {
    return;
  }
  const settings = readSettings(
    changes.settings.newValue as Partial<Settings> | undefined,
  );
  if (settings.autoDisplayEnabled) {
    createVerseIntervalAlarm(settings.intervalMinutes);
  } else {
    void clearVerseIntervalAlarm();
  }
});

// À l'échéance : ouvrir le popup sans condition, puis tirer un nouveau
// verset (contracts/ui-behavior.md — ouverture automatique).
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) {
    return;
  }
  void onVerseInterval();
});

async function ensureAlarmFromSettings(): Promise<void> {
  const stored = await get<Partial<Settings>>("settings");
  const settings = readSettings(stored);
  if (settings.autoDisplayEnabled) {
    await ensureVerseIntervalAlarm(settings.intervalMinutes);
  }
}

async function onVerseInterval(): Promise<void> {
  await openPopup();
  try {
    const verse = await drawRandomVerse(
      translationForLocale(resolveUiLocale(chrome.i18n.getUILanguage())),
    );
    await set("currentCycle", { verse, startedAt: Date.now() });
  } catch (error) {
    // Dégradation gracieuse (FR-011) : l'ancien verset reste affiché ; sans
    // verset en cours, le popup affichera ErrorView via ensure-current-verse.
    console.warn("Tirage à l'échéance de l'alarme échoué :", error);
  }
}

async function ensureCurrentVerse(): Promise<EnsureCurrentVerseResponse> {
  try {
    const currentCycle = await get<CurrentCycle>("currentCycle");
    if (currentCycle?.verse) {
      return { verse: currentCycle.verse };
    }
    const verse = await drawRandomVerse(
      translationForLocale(resolveUiLocale(chrome.i18n.getUILanguage())),
    );
    await set("currentCycle", { verse, startedAt: Date.now() });
    return { verse };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

function toUserMessage(error: unknown): string {
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));
  return error instanceof BibleApiError
    ? messages.errors.bibleUnavailable
    : messages.errors.unexpected;
}
