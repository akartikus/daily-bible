import { cleanup, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";
import PomodoroStatusHeader from "../../src/popup/components/PomodoroStatusHeader.svelte";
import { pomodoroStore } from "../../src/popup/lib/pomodoro.svelte.ts";

// Le statut et les minutes restantes vivent dans l'en-tête au-dessus du
// verset (retour utilisateur 003) — chaque scénario aux deux locales.
const languages = ["fr", "en-US"] as const;

describe.each(languages)("PomodoroStatusHeader — locale %s", (language) => {
  const m = getMessages(resolveUiLocale(language));
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    mock.setUiLanguage(language);
    vi.stubGlobal("chrome", mock.chrome);
    // Réinitialiser le store
    pomodoroStore.state = null;
    pomodoroStore.error = null;
    pomodoroStore.destroy();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  describe("Statut", () => {
    it("affiche le statut Focus", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatusHeader);

      expect(screen.getByText(m.status.focus)).toBeTruthy();
    });

    it("affiche le statut Pause", () => {
      pomodoroStore.state = {
        status: "break",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 5 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatusHeader);

      expect(screen.getByText(m.status.break)).toBeTruthy();
    });

    it("affiche le statut Longue pause", () => {
      pomodoroStore.state = {
        status: "longBreak",
        repetition: 4,
        running: true,
        phaseEndsAt: Date.now() + 15 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatusHeader);

      expect(screen.getByText(m.status.longBreak)).toBeTruthy();
    });

    it("affiche « — » sans état", () => {
      render(PomodoroStatusHeader);

      expect(screen.getByText("—")).toBeTruthy();
    });
  });

  describe("Minutes restantes", () => {
    it("affiche les minutes quand la phase court (phaseEndsAt)", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatusHeader);

      expect(screen.getByText(m.remaining(25))).toBeTruthy();
    });

    it("affiche les minutes figées en pause (phaseRemainingMs)", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 10 * 60_000,
      };

      render(PomodoroStatusHeader);

      expect(screen.getByText(m.remaining(10))).toBeTruthy();
    });

    it("ne montre pas de minutes sans état", () => {
      render(PomodoroStatusHeader);

      expect(screen.queryByText(/min$/)).toBeNull();
    });
  });
});

describe("PomodoroStatusHeader — décompte en temps réel", () => {
  const m = getMessages(resolveUiLocale("fr"));
  let mock: ChromeMock;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000_000_000);
    mock = createChromeMock();
    mock.setUiLanguage("fr");
    vi.stubGlobal("chrome", mock.chrome);
    pomodoroStore.state = null;
    pomodoroStore.error = null;
    pomodoroStore.destroy();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    cleanup();
  });

  it("décrémente les minutes quand la seconde tourne (horloge locale)", async () => {
    pomodoroStore.state = {
      status: "focus",
      repetition: 1,
      running: true,
      phaseEndsAt: 1_000_000_000_000 + 25 * 60_000,
      phaseRemainingMs: null,
    };

    render(PomodoroStatusHeader);
    expect(screen.getByText(m.remaining(25))).toBeTruthy();

    await vi.advanceTimersByTimeAsync(61_000);
    expect(screen.getByText(m.remaining(24))).toBeTruthy();
  });
});
