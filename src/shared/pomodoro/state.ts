/**
 * Pure pomodoro timer transitions — data-model.md §PomodoroState.
 * This module performs no I/O: the service worker owns persistence and alarms.
 */

import type { Settings } from "../settings/defaults";

export type PomodoroStatus = "focus" | "break" | "longBreak";

export interface PomodoroState {
  status: PomodoroStatus;
  repetition: number;
  running: boolean;
  phaseEndsAt: number | null;
  phaseRemainingMs: number | null;
}

const MILLISECONDS_PER_MINUTE = 60_000;

function phaseEnd(now: number, minutes: number): number {
  return now + minutes * MILLISECONDS_PER_MINUTE;
}

/** Starts the first focus in running mode. */
export function initialPomodoroState(
  settings: Settings,
  now: number,
): PomodoroState {
  return {
    status: "focus",
    repetition: 1,
    running: true,
    phaseEndsAt: phaseEnd(now, settings.focusMinutes),
    phaseRemainingMs: null,
  };
}

/** Moves a finished focus to its break phase. */
export function advanceAfterFocusEnd(
  state: PomodoroState,
  settings: Settings,
  now: number,
): PomodoroState {
  const status =
    state.repetition >= settings.repetitionsBeforeLongBreak
      ? "longBreak"
      : "break";
  const duration =
    status === "longBreak" ? settings.longBreakMinutes : settings.breakMinutes;

  return {
    ...state,
    status,
    running: true,
    phaseEndsAt: phaseEnd(now, duration),
    phaseRemainingMs: null,
  };
}

/** Starts the next focus after an explicit next action. */
export function startNextFocus(
  state: PomodoroState,
  settings: Settings,
  now: number,
): PomodoroState {
  if (state.status === "focus") {
    return state;
  }

  const repetition = state.status === "longBreak" ? 1 : state.repetition + 1;
  return {
    ...state,
    status: "focus",
    repetition,
    running: true,
    phaseEndsAt: phaseEnd(now, settings.focusMinutes),
    phaseRemainingMs: null,
  };
}

/** Suspends the current phase and freezes its remaining time. */
export function suspendPomodoro(
  state: PomodoroState,
  now: number,
): PomodoroState {
  if (!state.running) {
    return state;
  }

  const remaining = Math.max(0, (state.phaseEndsAt ?? now) - now);
  return {
    ...state,
    running: false,
    phaseEndsAt: null,
    phaseRemainingMs: remaining,
  };
}

/** Resumes the current phase from its frozen remaining time. */
export function resumePomodoro(
  state: PomodoroState,
  now: number,
): PomodoroState {
  if (state.running) {
    return state;
  }

  return {
    ...state,
    running: true,
    phaseEndsAt: now + (state.phaseRemainingMs ?? 0),
    phaseRemainingMs: null,
  };
}

/**
 * Reconciles state read after a missed alarm. Only an expired focus changes
 * phase; an expired break waits for an explicit next action.
 */
export function reconcilePomodoro(
  state: PomodoroState,
  settings: Settings,
  now: number,
): PomodoroState {
  if (!state.running || state.phaseEndsAt === null) {
    return state;
  }
  if (state.phaseEndsAt > now) {
    return state;
  }
  if (state.status !== "focus") {
    return state;
  }
  return advanceAfterFocusEnd(state, settings, now);
}
