import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { get, set } from "../../src/shared/chrome/storage";
import {
  initialPomodoroState,
  type PomodoroState,
} from "../../src/shared/pomodoro/state";
import {
  DEFAULT_SETTINGS,
  type Settings,
} from "../../src/shared/settings/defaults";
import type { Verse } from "../../src/shared/bible/extract";

const NOW = 1_000_000;

function settings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

/** Attend que la condition soit remplie (polling). */
async function waitFor<T>(fn: () => Promise<T>, timeout = 1000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await fn();
      if (result) return result;
    } catch {
      // ignore errors, retry
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timeout waiting for condition");
}

describe("orchestrateur pomodoro (service worker)", () => {
  let mock: ChromeMock;

  /** Alarme du mock : `when` n'existe pas sur le type chrome.alarms.Alarm. */
  async function getMockAlarm(
    name: string,
  ): Promise<{ name: string; when?: number } | undefined> {
    return (await mock.chrome.alarms.get(name)) as
      { name: string; when?: number } | undefined;
  }

  beforeEach(async () => {
    vi.resetModules();
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
    await import("../../src/background/service-worker");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("onInstalled", () => {
    it("initialise pomodoroState si absent (focus, répétition 1, lecture, alarme créée)", async () => {
      mock.fireInstalled();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = await get<PomodoroState>("pomodoroState");
      expect(state).toBeDefined();
      expect(state!.status).toBe("focus");
      expect(state!.repetition).toBe(1);
      expect(state!.running).toBe(true);
      expect(state!.phaseEndsAt).toBeDefined();
      expect(state!.phaseEndsAt).toBeGreaterThan(NOW);
      expect(state!.phaseRemainingMs).toBeNull();

      const alarm = await getMockAlarm("pomodoro-phase");
      expect(alarm).toBeDefined();
      expect(alarm!.name).toBe("pomodoro-phase");
      expect(alarm!.when).toBeDefined();
      expect(alarm!.when).toBeGreaterThan(NOW);
    });

    it("ne réinitialise pas l'état s'il existe déjà (mise à jour)", async () => {
      const existingState = {
        status: "break",
        repetition: 3,
        running: true,
        phaseEndsAt: NOW + 5 * 60_000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", existingState);

      mock.fireInstalled();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = await get<PomodoroState>("pomodoroState");
      expect(state).toEqual(existingState);
    });
  });

  describe("onStartup", () => {
    it("remet un nouveau cycle (focus, répétition 1, lecture) et recrée l'alarme", async () => {
      const existingState = {
        status: "break",
        repetition: 2,
        running: true,
        phaseEndsAt: NOW + 5 * 60_000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", existingState);

      mock.fireStartup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = await get<PomodoroState>("pomodoroState");
      expect(state).toBeDefined();
      expect(state!.status).toBe("focus");
      expect(state!.repetition).toBe(1);
      expect(state!.running).toBe(true);
      expect(state!.phaseEndsAt).toBeGreaterThan(NOW);
      expect(state!.phaseRemainingMs).toBeNull();

      const alarm = await getMockAlarm("pomodoro-phase");
      expect(alarm).toBeDefined();
      expect(alarm!.when).toBeGreaterThan(NOW);
    });
  });

  describe("pomodoro-get-state", () => {
    it("répond avec l'état et initialise défensivement si absent", async () => {
      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-get-state",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("focus");
      expect(response!.repetition).toBe(1);
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeGreaterThan(NOW);
      expect(response!.phaseRemainingMs).toBeNull();
    });

    it("réconcilie un focus échu sans que l'alarme n'ait tiré (SC-001)", async () => {
      const expiredState = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: NOW - 1000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", expiredState);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-get-state",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("break");
      expect(response!.repetition).toBe(1);
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeGreaterThan(NOW);

      const storedState = await get<PomodoroState>("pomodoroState");
      expect(storedState!.status).toBe("break");
    });

    it("laisse une pause échue dans l'attente de next", async () => {
      const expiredBreakState = {
        status: "break",
        repetition: 2,
        running: true,
        phaseEndsAt: NOW - 1000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", expiredBreakState);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-get-state",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("break");
      expect(response!.repetition).toBe(2);
      expect(response!.running).toBe(true);
    });

    it("retourne un état suspendu inchangé (scénario 5 : suspendre, fermer/rouvrir)", async () => {
      const suspendedState = {
        status: "focus",
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 60_000,
      };
      await set("pomodoroState", suspendedState);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-get-state",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("focus");
      expect(response!.repetition).toBe(1);
      expect(response!.running).toBe(false);
      expect(response!.phaseEndsAt).toBeNull();
      expect(response!.phaseRemainingMs).toBe(60_000);

      // La réconciliation ne doit pas modifier un état suspendu
      const storedState = await get<PomodoroState>("pomodoroState");
      expect(storedState).toEqual(suspendedState);
    });
  });

  describe("fireAlarm (alarme pomodoro-phase)", () => {
    it("déclenche la transition focus → pause et crée la prochaine alarme", async () => {
      await set("pomodoroState", initialPomodoroState(settings(), NOW));

      mock.fireAlarm("pomodoro-phase");

      // Attendre que l'état change vers break
      await waitFor(async () => {
        const state = await get<PomodoroState>("pomodoroState");
        if (state && state.status === "break") return state;
      });

      const state = await get<PomodoroState>("pomodoroState");
      expect(state).toBeDefined();
      expect(state!.status).toBe("break");
      expect(state!.repetition).toBe(1);
      expect(state!.running).toBe(true);
      expect(state!.phaseEndsAt).toBeGreaterThan(NOW);

      const alarm = await getMockAlarm("pomodoro-phase");
      expect(alarm).toBeDefined();
      expect(alarm!.when).toBeGreaterThan(NOW);
    });

    it("déclenche la transition focus X → longue pause", async () => {
      const state = initialPomodoroState(settings(), NOW);
      state.repetition = 4;
      await set("pomodoroState", state);

      mock.fireAlarm("pomodoro-phase");

      await waitFor(async () => {
        const state = await get<PomodoroState>("pomodoroState");
        if (state && state.status === "longBreak") return state;
      });

      const newState = await get<PomodoroState>("pomodoroState");
      expect(newState).toBeDefined();
      expect(newState!.status).toBe("longBreak");
      expect(newState!.repetition).toBe(4);
      expect(newState!.running).toBe(true);
    });

    it("ignore l'alarme si l'état est suspendu", async () => {
      const state = {
        status: "focus",
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 10000,
      };
      await set("pomodoroState", state);

      mock.fireAlarm("pomodoro-phase");
      await new Promise((resolve) => setTimeout(resolve, 0));

      const newState = await get<PomodoroState>("pomodoroState");
      expect(newState).toEqual(state);
    });

    it("déclenche openPopup, tire un verset, avance vers pause et recrée l'alarme", async () => {
      const state = initialPomodoroState(settings(), NOW);
      await set("pomodoroState", state);

      mock.fireAlarm("pomodoro-phase");

      await waitFor(async () => {
        const state = await get<PomodoroState>("pomodoroState");
        if (state && state.status === "break") return state;
      });

      const stateAfter = await get<PomodoroState>("pomodoroState");
      expect(stateAfter).toBeDefined();
      expect(stateAfter!.status).toBe("break");
      expect(stateAfter!.repetition).toBe(1);
      expect(stateAfter!.running).toBe(true);
      expect(stateAfter!.phaseEndsAt).toBeGreaterThan(Date.now());

      // Vérifier que openPopup a été appelé (via le mock chrome.action)
      expect(mock.chrome.action.openPopup).toHaveBeenCalled();

      // Vérifier qu'un nouveau verset a été écrit dans currentCycle
      const { get: getCycle } = await import("../../src/shared/chrome/storage");
      const cycle = await getCycle<{ verse: Verse; startedAt: number }>(
        "currentCycle",
      );
      expect(cycle).toBeDefined();
      expect(cycle!.verse).toBeDefined();

      // Une nouvelle alarme doit avoir été créée pour la pause
      const alarm = await getMockAlarm("pomodoro-phase");
      expect(alarm).toBeDefined();
      expect(alarm!.when).toBeGreaterThan(Date.now());
    });

    it("échec du tirage → transition quand même, ancien verset conservé (FR-014)", async () => {
      // Configurer un état de focus
      const state = initialPomodoroState(settings(), NOW);
      await set("pomodoroState", state);

      // Placer un verset existant dans currentCycle
      const existingVerse = {
        bookId: "PSA",
        bookName: "Psaumes",
        chapterNumber: 23,
        verseNumber: 1,
        text: "L'Éternel est mon berger.",
        translationId: "fra_lsg",
        translationName: "Louis Segond 1910",
        fetchedAt: Date.now(),
      };
      await set("currentCycle", {
        verse: existingVerse,
        startedAt: Date.now() - 1000,
      });

      // Faire échouer drawRandomVerse
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      mock.fireAlarm("pomodoro-phase");
      await waitFor(async () => {
        const state = await get<PomodoroState>("pomodoroState");
        if (state && state.status === "break") return state;
      });

      // La transition doit avoir eu lieu quand même
      const stateAfter = await get<PomodoroState>("pomodoroState");
      expect(stateAfter).toBeDefined();
      expect(stateAfter!.status).toBe("break");
      expect(stateAfter!.running).toBe(true);

      // L'ancien verset doit être conservé dans currentCycle
      const { get: getCycle } = await import("../../src/shared/chrome/storage");
      const cycle = await getCycle<{ verse: Verse; startedAt: number }>(
        "currentCycle",
      );
      expect(cycle).toBeDefined();
      expect(cycle!.verse).toEqual(existingVerse);

      vi.unstubAllGlobals();
    });

    it("alarme verse-interval ignorée par le dispatch pomodoro", async () => {
      const state = initialPomodoroState(settings(), NOW);
      await set("pomodoroState", state);

      // Simuler l'alarme verse-interval (feature 001)
      mock.fireAlarm("verse-interval");
      await new Promise((resolve) => setTimeout(resolve, 0));

      // L'état ne doit pas avoir changé
      const stateAfter = await get<PomodoroState>("pomodoroState");
      expect(stateAfter).toEqual(
        expect.objectContaining({
          status: "focus",
          repetition: 1,
          running: true,
        }),
      );
    });
  });

  describe("fireAlarm en break/longBreak (repop FR-007)", () => {
    it("break échu → openPopup seul, statut inchangé, aucune nouvelle alarme", async () => {
      const state = {
        status: "break" as const,
        repetition: 1,
        running: true,
        phaseEndsAt: NOW - 1000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", state);

      mock.fireAlarm("pomodoro-phase");
      await new Promise((resolve) => setTimeout(resolve, 0));

      // openPopup appelé (repop)
      expect(mock.chrome.action.openPopup).toHaveBeenCalled();

      // Statut inchangé : attente du bouton next (FR-005)
      const stateAfter = await get<PomodoroState>("pomodoroState");
      expect(stateAfter).toEqual(state);

      // Aucune nouvelle alarme créée
      const alarm = await mock.chrome.alarms.get("pomodoro-phase");
      expect(alarm).toBeUndefined();
    });

    it("longBreak échu → openPopup seul, statut inchangé, aucune nouvelle alarme", async () => {
      const state = {
        status: "longBreak" as const,
        repetition: 4,
        running: true,
        phaseEndsAt: NOW - 1000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", state);

      mock.fireAlarm("pomodoro-phase");
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mock.chrome.action.openPopup).toHaveBeenCalled();

      const stateAfter = await get<PomodoroState>("pomodoroState");
      expect(stateAfter).toEqual(state);

      const alarm = await mock.chrome.alarms.get("pomodoro-phase");
      expect(alarm).toBeUndefined();
    });
  });

  describe("message pomodoro-next", () => {
    it("next en break → focus, répétition + 1, lecture, alarme recréée", async () => {
      const state = {
        status: "break" as const,
        repetition: 2,
        running: true,
        phaseEndsAt: NOW - 1000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", state);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-next",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("focus");
      expect(response!.repetition).toBe(3);
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeGreaterThan(NOW);
      expect(response!.phaseRemainingMs).toBeNull();

      // État persisté
      const stored = await get<PomodoroState>("pomodoroState");
      expect(stored).toEqual(response);

      // Alarme recréée pour le focus
      const alarm = await getMockAlarm("pomodoro-phase");
      expect(alarm).toBeDefined();
      expect(alarm!.when).toBe(response!.phaseEndsAt);
    });

    it("next en longBreak → nouveau cycle, répétition 1, lecture, alarme recréée", async () => {
      const state = {
        status: "longBreak" as const,
        repetition: 4,
        running: true,
        phaseEndsAt: NOW - 1000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", state);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-next",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("focus");
      expect(response!.repetition).toBe(1);
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeGreaterThan(NOW);

      const alarm = await mock.chrome.alarms.get("pomodoro-phase");
      expect(alarm).toBeDefined();
    });

    it("next ignoré en focus (état inchangé)", async () => {
      const state = initialPomodoroState(settings(), NOW);
      await set("pomodoroState", state);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-next",
      });

      // L'état est retourné inchangé
      expect(response).toEqual(state);

      const stored = await get<PomodoroState>("pomodoroState");
      expect(stored).toEqual(state);
    });

    it("next pendant une pause suspendue → focus en lecture (edge case spec)", async () => {
      const state = {
        status: "break" as const,
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 60_000,
      };
      await set("pomodoroState", state);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-next",
      });

      expect(response).toBeDefined();
      expect(response!.status).toBe("focus");
      expect(response!.repetition).toBe(2);
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeGreaterThan(NOW);
      expect(response!.phaseRemainingMs).toBeNull();

      const alarm = await mock.chrome.alarms.get("pomodoro-phase");
      expect(alarm).toBeDefined();
    });
  });

  describe("messages pomodoro-pause / pomodoro-resume (US4)", () => {
    it("pause en focus → suspendPomodoro, alarme supprimée, invariants respectés", async () => {
      // Base temporelle réelle : le service worker compare à Date.now(),
      // un NOW figé dans le passé donnerait un reste à 0.
      const state = initialPomodoroState(settings(), Date.now());
      await set("pomodoroState", state);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-pause",
      });

      expect(response).toBeDefined();
      expect(response!.running).toBe(false);
      expect(response!.phaseEndsAt).toBeNull();
      expect(response!.phaseRemainingMs).toBeGreaterThan(0);
      expect(response!.status).toBe("focus");
      expect(response!.repetition).toBe(1);

      // État persisté
      const stored = await get<PomodoroState>("pomodoroState");
      expect(stored).toEqual(response);

      // Alarme supprimée
      const alarm = await mock.chrome.alarms.get("pomodoro-phase");
      expect(alarm).toBeUndefined();
    });

    it("resume → resumePomodoro, alarme recréée { when: now + phaseRemainingMs }", async () => {
      const suspended = {
        status: "focus" as const,
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 60_000,
      };
      await set("pomodoroState", suspended);

      const before = Date.now();
      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-resume",
      });
      const after = Date.now();

      expect(response).toBeDefined();
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeGreaterThanOrEqual(before + 60_000);
      expect(response!.phaseEndsAt).toBeLessThanOrEqual(after + 60_000);
      expect(response!.phaseRemainingMs).toBeNull();

      // Alarme recréée
      const alarm = await getMockAlarm("pomodoro-phase");
      expect(alarm).toBeDefined();
      expect(alarm!.when).toBe(response!.phaseEndsAt);
    });

    it("reprise d'une pause à décompte terminé → aucune alarme (attente de next)", async () => {
      const expiredBreak = {
        status: "break" as const,
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 0,
      };
      await set("pomodoroState", expiredBreak);

      const response = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-resume",
      });

      expect(response).toBeDefined();
      expect(response!.running).toBe(true);
      expect(response!.phaseEndsAt).toBeLessThanOrEqual(Date.now());

      // Aucune alarme future : attente de next
      const alarm = await mock.chrome.alarms.get("pomodoro-phase");
      expect(alarm).toBeUndefined();
    });

    it("pause/resume valables en break (FR-004 : toute phase)", async () => {
      const breakState = {
        status: "break" as const,
        repetition: 2,
        running: true,
        phaseEndsAt: Date.now() + 5 * 60_000,
        phaseRemainingMs: null,
      };
      await set("pomodoroState", breakState);

      const paused = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-pause",
      });
      expect(paused!.running).toBe(false);
      expect(paused!.status).toBe("break");

      const resumed = await mock.chrome.runtime.sendMessage({
        type: "pomodoro-resume",
      });
      expect(resumed!.running).toBe(true);
      expect(resumed!.status).toBe("break");
      expect(resumed!.phaseEndsAt).toBeGreaterThan(Date.now());
    });
  });

  describe("FR-012 : changement de réglages en cours de phase", () => {
    it("ne recrée pas l'alarme courante ; la nouvelle durée s'applique à la phase suivante", async () => {
      // Focus en cours, alarme créée à l'installation
      mock.fireInstalled();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mock.chrome.alarms.create).toHaveBeenCalledTimes(1);

      // Réglages changés au milieu du focus
      await set("settings", settings({ breakMinutes: 30 }));

      // L'alarme courante est inchangée : la phase en cours garde sa durée
      expect(mock.chrome.alarms.create).toHaveBeenCalledTimes(1);

      // Le focus arrive à échéance : les nouvelles valeurs s'appliquent
      await set("pomodoroState", initialPomodoroState(settings(), NOW));
      mock.fireAlarm("pomodoro-phase");
      await waitFor(async () => {
        const state = await get<PomodoroState>("pomodoroState");
        if (state && state.status === "break") return state;
      });
      const after = await get<PomodoroState>("pomodoroState");
      expect(after!.status).toBe("break");
      expect(after!.phaseEndsAt).toBeGreaterThan(Date.now() + 29 * 60_000);
    });
  });
});
