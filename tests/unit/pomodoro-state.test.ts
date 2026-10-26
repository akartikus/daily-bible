import { describe, expect, it } from "vitest";
import {
  advanceAfterFocusEnd,
  initialPomodoroState,
  reconcilePomodoro,
  resumePomodoro,
  startNextFocus,
  suspendPomodoro,
} from "../../src/shared/pomodoro/state.ts";
import {
  DEFAULT_SETTINGS,
  type Settings,
} from "../../src/shared/settings/defaults";

const MINUTE_MS = 60_000;
const NOW = 1_000_000;

function settings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe("transitions pures du pomodoro", () => {
  it("initialise un focus en lecture à la répétition 1", () => {
    expect(initialPomodoroState(settings(), NOW)).toEqual({
      status: "focus",
      repetition: 1,
      running: true,
      phaseEndsAt: NOW + 25 * MINUTE_MS,
      phaseRemainingMs: null,
    });
  });

  it("termine un focus inférieur à X par une pause courte", () => {
    const state = initialPomodoroState(settings(), NOW);

    expect(advanceAfterFocusEnd(state, settings(), NOW)).toEqual({
      status: "break",
      repetition: 1,
      running: true,
      phaseEndsAt: NOW + 5 * MINUTE_MS,
      phaseRemainingMs: null,
    });
  });

  it("termine le focus X par une longue pause", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      repetition: 4,
    };

    expect(advanceAfterFocusEnd(state, settings(), NOW)).toEqual({
      status: "longBreak",
      repetition: 4,
      running: true,
      phaseEndsAt: NOW + 15 * MINUTE_MS,
      phaseRemainingMs: null,
    });
  });

  it("démarre le focus suivant depuis une pause", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      status: "break" as const,
      phaseEndsAt: NOW + 5 * MINUTE_MS,
    };

    expect(startNextFocus(state, settings(), NOW)).toEqual({
      status: "focus",
      repetition: 2,
      running: true,
      phaseEndsAt: NOW + 25 * MINUTE_MS,
      phaseRemainingMs: null,
    });
  });

  it("démarre un nouveau cycle depuis la longue pause", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      status: "longBreak" as const,
      repetition: 4,
      phaseEndsAt: NOW + 15 * MINUTE_MS,
    };

    expect(startNextFocus(state, settings(), NOW)).toEqual({
      status: "focus",
      repetition: 1,
      running: true,
      phaseEndsAt: NOW + 25 * MINUTE_MS,
      phaseRemainingMs: null,
    });
  });

  it("fige le temps restant lors de la suspension", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      phaseEndsAt: NOW + 10_000,
    };

    expect(suspendPomodoro(state, NOW + 4_000)).toEqual({
      ...state,
      running: false,
      phaseEndsAt: null,
      phaseRemainingMs: 6_000,
    });
  });

  it("ne suspend pas une phase déjà échue avec un reste négatif", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      phaseEndsAt: NOW - 1,
    };

    expect(suspendPomodoro(state, NOW).phaseRemainingMs).toBe(0);
  });

  it("reprend exactement au temps restant figé", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      running: false,
      phaseEndsAt: null,
      phaseRemainingMs: 6_000,
    };

    expect(resumePomodoro(state, NOW)).toEqual({
      ...state,
      running: true,
      phaseEndsAt: NOW + 6_000,
      phaseRemainingMs: null,
    });
  });

  it("décale la fin du focus d'autant (reprise différée — scénario 5)", () => {
    // Suspension avec 6 000 ms restants, puis reprise 60 000 ms plus tard :
    // la fin du focus est décalée d'autant (phaseEndsAt = reprise + reste figé).
    const state = {
      ...initialPomodoroState(settings(), NOW),
      running: false,
      phaseEndsAt: null,
      phaseRemainingMs: 6_000,
    };
    const resumeAt = NOW + 60_000;

    expect(resumePomodoro(state, resumeAt)).toEqual({
      ...state,
      running: true,
      phaseEndsAt: resumeAt + 6_000,
      phaseRemainingMs: null,
    });
  });

  it("réconcilie un focus échu vers la pause", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      phaseEndsAt: NOW - 1,
    };

    expect(reconcilePomodoro(state, settings(), NOW)).toEqual(
      advanceAfterFocusEnd(state, settings(), NOW),
    );
  });

  it("laisse une pause échue dans l'attente du bouton next", () => {
    const state = {
      ...initialPomodoroState(settings(), NOW),
      status: "break" as const,
      phaseEndsAt: NOW - 1,
    };

    expect(reconcilePomodoro(state, settings(), NOW)).toEqual(state);
  });

  it("termine directement par une longue pause quand X vaut 1", () => {
    const state = initialPomodoroState(
      settings({ repetitionsBeforeLongBreak: 1 }),
      NOW,
    );

    expect(
      advanceAfterFocusEnd(
        state,
        settings({ repetitionsBeforeLongBreak: 1 }),
        NOW,
      ).status,
    ).toBe("longBreak");
  });
});
