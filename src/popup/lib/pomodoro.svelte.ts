/**
 * Store du pomodoro pour le popup : chargement de l'état, observation des
 * changements, actions utilisateur (pause, reprise, next).
 */

import { sendMessage } from "../../shared/chrome/runtime";
import { onChanged } from "../../shared/chrome/storage";
import { getMessages, resolveUiLocale } from "../../shared/i18n";
import type { PomodoroState } from "../../shared/pomodoro/state";

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
 * Store du pomodoro pour le popup.
 * - Charge l'état initial via `pomodoro-get-state`
 * - Observe les changements de `pomodoroState` dans le storage
 * - Fournit les actions pause, reprise, next
 * - Gère les erreurs minimales (jamais d'écran vide)
 */
export class PomodoroStore {
  state = $state<PomodoroState | null>(null);
  error = $state<string | null>(null);
  private unsubscribe: (() => void) | null = null;

  /** Charge l'état initial depuis le service worker. */
  async load(): Promise<void> {
    try {
      this.error = null;
      const response = await sendMessage<PomodoroState>({
        type: "pomodoro-get-state",
      });
      this.state = response;
    } catch (e) {
      this.error = getMessages(
        resolveUiLocale(chrome.i18n.getUILanguage()),
      ).store.loadError;
      console.error("Erreur chargement pomodoro:", e);
    }
  }

  /** Démarre l'observation des changements de stockage. */
  observe(): void {
    if (this.unsubscribe) {
      return; // déjà en observation
    }

    this.unsubscribe = onChanged((changes) => {
      if (changes.pomodoroState) {
        const newState = changes.pomodoroState.newValue as
          PomodoroState | undefined;
        if (newState) {
          this.state = newState;
        }
      }
    });
  }

  /** Arrête l'observation. */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /** Demande la suspension du décompte. */
  async pause(): Promise<void> {
    try {
      this.error = null;
      const response = await sendMessage<PomodoroState>({
        type: "pomodoro-pause",
      });
      this.state = response;
    } catch (e) {
      this.error = getMessages(
        resolveUiLocale(chrome.i18n.getUILanguage()),
      ).store.pauseError;
      console.error("Erreur pause:", e);
    }
  }

  /** Demande la reprise du décompte. */
  async resume(): Promise<void> {
    try {
      this.error = null;
      const response = await sendMessage<PomodoroState>({
        type: "pomodoro-resume",
      });
      this.state = response;
    } catch (e) {
      this.error = getMessages(
        resolveUiLocale(chrome.i18n.getUILanguage()),
      ).store.resumeError;
      console.error("Erreur reprise:", e);
    }
  }

  /** Bascule entre pause et reprise selon l'état courant. */
  async toggle(): Promise<void> {
    if (this.state?.running) {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  /** Demande le focus suivant (bouton next). */
  async next(): Promise<void> {
    try {
      this.error = null;
      const response = await sendMessage<PomodoroState>({
        type: "pomodoro-next",
      });
      this.state = response;
    } catch (e) {
      this.error = getMessages(
        resolveUiLocale(chrome.i18n.getUILanguage()),
      ).store.nextError;
      console.error("Erreur next:", e);
    }
  }

  /** Indique si le bouton next doit être affiché (pause ou longBreak). */
  get showNext(): boolean {
    return this.state?.status === "break" || this.state?.status === "longBreak";
  }

  /** Libellé du statut pour l'affichage (clé du catalogue — FR-003). */
  get statusLabel(): string {
    if (!this.state) return "—";
    return getMessages(resolveUiLocale(chrome.i18n.getUILanguage())).status[
      this.state.status
    ];
  }

  /** Nombre total de répétitions (X). */
  get repetitions(): number {
    // Note: X vient des réglages, mais on peut le déduire de l'état si nécessaire
    // Pour l'instant on retourne 0, le composant lira X depuis le store des réglages
    return 0;
  }

  /** Répétition courante. */
  get currentRepetition(): number {
    return this.state?.repetition ?? 0;
  }
}

/**
 * Instance unique du store (singleton pour le popup).
 * Le cycle de vie : instancié au montage de App.svelte, détruit au démontage.
 */
export const pomodoroStore = new PomodoroStore();
