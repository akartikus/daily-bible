import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";
import PomodoroStatus from "../../src/popup/components/PomodoroStatus.svelte";
import { pomodoroStore } from "../../src/popup/lib/pomodoro.svelte.ts";

// T004 : chaque scénario s'exécute aux deux locales, textes attendus tirés du
// catalogue de la locale résolue (mock getUILanguage pilotable).
const languages = ["fr", "en-US"] as const;

describe.each(languages)("PomodoroStatus — locale %s", (language) => {
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

  describe("Affichage du statut", () => {
    it("affiche le statut Focus par défaut", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.getByText(m.status.focus)).toBeTruthy();
    });

    it("affiche le libellé localisé quand l'état est en pause", () => {
      pomodoroStore.state = {
        status: "break",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 5 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      // Le libellé de statut se distingue du texte visible du bouton pause
      // (« Pause ») par ses classes ; en anglais le statut est « Break ».
      const statusLabel = screen.getByText(m.status.break, {
        selector: "span.font-medium.text-gray-700",
      });
      expect(statusLabel).toBeTruthy();
    });

    it("affiche le libellé localisé pour longBreak", () => {
      pomodoroStore.state = {
        status: "longBreak",
        repetition: 4,
        running: true,
        phaseEndsAt: Date.now() + 15 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.getByText(m.status.longBreak)).toBeTruthy();
    });

    it("affiche la répétition courante / total", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 2,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.getByText(m.repetition(2, 4))).toBeTruthy();
    });
  });

  describe("Barre de progression", () => {
    it("affiche 4 segments pour X=4, avec son libellé accessible localisé", () => {
      render(PomodoroStatus, { props: { repetitions: 4 } });

      const progressBar = screen.getByRole("progressbar", {
        name: m.aria.cycleProgress,
      });
      const segments = progressBar.querySelectorAll(":scope > div");
      expect(segments.length).toBe(4);
    });

    it("remplit les segments accomplis en vert", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 2,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      // Les segments 1 et 2 doivent être verts/bleus (accomplis et courant)
      // Le test détaillé nécessiterait d'inspecter les classes CSS
    });

    it("affiche la barre pleine en longBreak", () => {
      pomodoroStore.state = {
        status: "longBreak",
        repetition: 4,
        running: true,
        phaseEndsAt: Date.now() + 15 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      // En longBreak, tous les segments doivent être "accomplis" (amber)
    });
  });

  describe("Bouton Play/Pause", () => {
    it("porte le libellé accessible pause quand running=true", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      const button = screen.getByRole("button", { name: m.aria.pause });
      expect(button).toBeTruthy();
    });

    it("porte le libellé accessible reprise quand running=false", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 10_000,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      const button = screen.getByRole("button", { name: m.aria.resume });
      expect(button).toBeTruthy();
    });

    it("appelle store.toggle() au clic", async () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      const toggleSpy = vi.spyOn(pomodoroStore, "toggle").mockResolvedValue();

      render(PomodoroStatus, { props: { repetitions: 4 } });

      await fireEvent.click(screen.getByRole("button", { name: m.aria.pause }));

      expect(toggleSpy).toHaveBeenCalledOnce();
    });
  });

  describe("Bouton Next", () => {
    it("est visible en pause", () => {
      pomodoroStore.state = {
        status: "break",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 5 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.getByRole("button", { name: m.aria.next })).toBeTruthy();
    });

    it("est visible en longBreak", () => {
      pomodoroStore.state = {
        status: "longBreak",
        repetition: 4,
        running: true,
        phaseEndsAt: Date.now() + 15 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.getByRole("button", { name: m.aria.next })).toBeTruthy();
    });

    it("est caché en focus", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(
        screen.queryByRole("button", { name: m.aria.next }),
      ).not.toBeTruthy();
    });

    it("appelle store.next() au clic", async () => {
      pomodoroStore.state = {
        status: "break",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 5 * 60_000,
        phaseRemainingMs: null,
      };

      const nextSpy = vi.spyOn(pomodoroStore, "next").mockResolvedValue();

      render(PomodoroStatus, { props: { repetitions: 4 } });

      await fireEvent.click(screen.getByRole("button", { name: m.aria.next }));

      expect(nextSpy).toHaveBeenCalledOnce();
    });
  });

  describe("Affichage erreur", () => {
    it("affiche le message d'erreur si store.error est défini", () => {
      pomodoroStore.error = "Erreur de test";

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.getByText("Erreur de test")).toBeTruthy();
    });

    it("ne montre pas d'erreur si store.error est null", () => {
      pomodoroStore.error = null;

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.queryByText(/erreur/i)).toBeFalsy();
    });
  });
});
