/**
 * Orchestration du pomodoro : cycle de vie, alarmes, messages.
 * Seul écrivain de `pomodoroState` (data-model.md).
 */

import {
  POMODORO_ALARM_NAME,
  createPomodoroPhaseAlarm,
  clearPomodoroPhaseAlarm,
} from "../shared/chrome/alarms";
import { onMessage } from "../shared/chrome/runtime";
import { get, set } from "../shared/chrome/storage";
import {
  advanceAfterFocusEnd,
  initialPomodoroState,
  reconcilePomodoro,
  resumePomodoro,
  startNextFocus,
  suspendPomodoro,
  type PomodoroState,
} from "../shared/pomodoro/state";
import { readSettings, type Settings } from "../shared/settings/defaults";
import { openPopup } from "../shared/chrome/action";
import { drawRandomVerse } from "../shared/bible/draw";

/** Réglages actuels : stockage fusionné avec les défauts (FR-009/FR-012). */
async function currentSettings(): Promise<Settings> {
  return readSettings(await get<Partial<Settings>>("settings"));
}

/** Messages pomodoro (contrats/runtime-messages.md) */
export interface PomodoroGetStateRequest {
  type: "pomodoro-get-state";
}

export interface PomodoroPauseRequest {
  type: "pomodoro-pause";
}

export interface PomodoroResumeRequest {
  type: "pomodoro-resume";
}

export interface PomodoroNextRequest {
  type: "pomodoro-next";
}

export type PomodoroRequest =
  | PomodoroGetStateRequest
  | PomodoroPauseRequest
  | PomodoroResumeRequest
  | PomodoroNextRequest;

export type PomodoroResponse = PomodoroState;

/**
 * Initialise l'état pomodoro si absent : focus, répétition 1, lecture.
 * Crée l'alarme one-shot pour la fin du focus.
 */
async function initializePomodoroIfAbsent(now: number): Promise<PomodoroState> {
  const existing = await get<PomodoroState>("pomodoroState");
  if (existing) {
    return existing;
  }

  const settings = await currentSettings();
  const state = initialPomodoroState(settings, now);
  await set("pomodoroState", state);
  createPomodoroPhaseAlarm(state.phaseEndsAt!);
  return state;
}

/**
 * Réinitialise complètement le pomodoro : nouveau cycle (focus, rép 1, lecture).
 * Appelé au démarrage du navigateur (onStartup).
 */
async function resetPomodoro(now: number): Promise<PomodoroState> {
  const settings = await currentSettings();
  const state = initialPomodoroState(settings, now);
  await set("pomodoroState", state);
  createPomodoroPhaseAlarm(state.phaseEndsAt!);
  return state;
}

/**
 * Gère le message `pomodoro-get-state` :
 * - Initialise défensivement si état absent
 * - Réconcilie si focus échu (alarme manquée)
 * - Retourne l'état
 */
async function handleGetState(now: number): Promise<PomodoroState> {
  let state = await get<PomodoroState>("pomodoroState");
  if (!state) {
    const settings = await currentSettings();
    state = initialPomodoroState(settings, now);
    await set("pomodoroState", state);
    createPomodoroPhaseAlarm(state.phaseEndsAt!);
    return state;
  }

  // Réconciliation : si focus échu sans alarme, avancer
  const reconciled = reconcilePomodoro(state, await currentSettings(), now);
  if (reconciled !== state) {
    await set("pomodoroState", reconciled);
    if (reconciled.running && reconciled.phaseEndsAt) {
      createPomodoroPhaseAlarm(reconciled.phaseEndsAt);
    }
    return reconciled;
  }

  return state;
}

/**
 * Traite l'échéance de l'alarme pomodoro-phase.
 * - focus : ouvre popup, tire verset, avance vers pause/longBreak, recrée alarme
 * - break / longBreak : ouvre popup (repop), pas de transition auto
 * - suspendu : ignoré (défensif)
 */
async function handlePhaseAlarm(now: number): Promise<void> {
  const state = await get<PomodoroState>("pomodoroState");
  if (!state) {
    // État absent : initialiser et créer alarme pour focus
    await initializePomodoroIfAbsent(now);
    return;
  }

  if (!state.running || state.phaseEndsAt === null) {
    // État suspendu : aucune alarme ne devrait exister (défensif)
    return;
  }

  if (state.phaseEndsAt > now) {
    // Alarme tirée trop tôt (ne devrait pas arriver avec des one-shots)
    return;
  }

  const settings = await currentSettings();

  if (state.status === "focus") {
    // Fin de focus : ouvrir popup, tirer verset, avancer vers pause/longBreak
    await openPopup();

    try {
      const verse = await drawRandomVerse();
      await set("currentCycle", { verse, startedAt: Date.now() });
    } catch {
      // Dégradation gracieuse : ancien verset conservé
      console.warn("Tirage verset échoué à la fin du focus");
    }

    // Avancer vers pause ou longue pause
    const newState = advanceAfterFocusEnd(state, settings, now);
    await set("pomodoroState", newState);

    // Créer alarme pour la nouvelle phase (pause ou longBreak)
    if (newState.phaseEndsAt) {
      createPomodoroPhaseAlarm(newState.phaseEndsAt);
    }
  } else if (state.status === "break" || state.status === "longBreak") {
    // Fin de pause / longue pause : repop uniquement (ouvrir popup pour next)
    // Aucune transition automatique vers focus (FR-005)
    await openPopup();
    // Pas de nouvelle alarme : attente du bouton next
  }
  // Si suspendu : ignoré (défensif)
}

/**
 * Gère le message `pomodoro-next` : démarre le focus suivant depuis une pause
 * ou une longue pause (jamais depuis un focus — FR-005). Fonctionne aussi
 * pendant une pause suspendue (edge case spec). Recrée l'alarme.
 */
async function handleNext(now: number): Promise<PomodoroState> {
  const state = await get<PomodoroState>("pomodoroState");
  if (!state) {
    return initializePomodoroIfAbsent(now);
  }

  const next = startNextFocus(state, await currentSettings(), now);
  if (next === state) {
    // next ignoré en focus : état inchangé
    return state;
  }

  await set("pomodoroState", next);
  if (next.phaseEndsAt) {
    createPomodoroPhaseAlarm(next.phaseEndsAt);
  }
  return next;
}

/**
 * Gère le message `pomodoro-pause` : suspend le décompte dans toute phase
 * (FR-004) et supprime l'alarme (plus d'échéance tant que suspendu).
 */
async function handlePause(now: number): Promise<PomodoroState> {
  const state = await get<PomodoroState>("pomodoroState");
  if (!state) {
    return initializePomodoroIfAbsent(now);
  }

  const suspended = suspendPomodoro(state, now);
  if (suspended === state) {
    return state; // déjà suspendu
  }

  await set("pomodoroState", suspended);
  await clearPomodoroPhaseAlarm();
  return suspended;
}

/**
 * Gère le message `pomodoro-resume` : reprend le décompte depuis le temps
 * restant figé et recrée l'alarme. Une pause à décompte terminé reprise
 * n'arme aucune alarme (attente de next — FR-005).
 */
async function handleResume(now: number): Promise<PomodoroState> {
  const state = await get<PomodoroState>("pomodoroState");
  if (!state) {
    return initializePomodoroIfAbsent(now);
  }

  const resumed = resumePomodoro(state, now);
  if (resumed === state) {
    return state; // déjà en lecture
  }

  await set("pomodoroState", resumed);
  if (resumed.phaseEndsAt && resumed.phaseEndsAt > now) {
    createPomodoroPhaseAlarm(resumed.phaseEndsAt);
  }
  return resumed;
}

/**
 * Enregistre le cycle de vie pomodoro dans le service worker.
 * À appeler une seule fois au démarrage du service worker.
 */
export function registerPomodoro(): void {
  // Cycle de vie : onInstalled initialise si absent
  chrome.runtime.onInstalled.addListener(async () => {
    await initializePomodoroIfAbsent(Date.now());
  });

  // Cycle de vie : onStartup reset + alarme recréée
  chrome.runtime.onStartup.addListener(async () => {
    await resetPomodoro(Date.now());
  });

  // Message pomodoro-get-state
  onMessage<{ type: "pomodoro-get-state" }>(
    (message, _sender, sendResponse) => {
      if (message.type !== "pomodoro-get-state") {
        return;
      }
      void handleGetState(Date.now()).then(sendResponse);
      return true; // garde le canal ouvert pour la réponse asynchrone
    },
  );

  // Message pomodoro-next (bouton next du popup)
  onMessage<{ type: "pomodoro-next" }>((message, _sender, sendResponse) => {
    if (message.type !== "pomodoro-next") {
      return;
    }
    void handleNext(Date.now()).then(sendResponse);
    return true;
  });

  // Message pomodoro-pause (bouton play/pause)
  onMessage<{ type: "pomodoro-pause" }>((message, _sender, sendResponse) => {
    if (message.type !== "pomodoro-pause") {
      return;
    }
    void handlePause(Date.now()).then(sendResponse);
    return true;
  });

  // Message pomodoro-resume (bouton play/pause)
  onMessage<{ type: "pomodoro-resume" }>((message, _sender, sendResponse) => {
    if (message.type !== "pomodoro-resume") {
      return;
    }
    void handleResume(Date.now()).then(sendResponse);
    return true;
  });

  // Alarme pomodoro-phase
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== POMODORO_ALARM_NAME) {
      return;
    }
    void handlePhaseAlarm(Date.now());
  });
}
