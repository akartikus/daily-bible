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

  describe("Compte à rebours de la phase", () => {
    // Horloge simulée : le compte à rebours est déterministe au test.
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000_000_000);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("affiche mm:ss décroissant pendant la lecture", async () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: 1_000_000_000_000 + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });
      expect(screen.getByText("25:00")).toBeTruthy();

      await vi.advanceTimersByTimeAsync(61_000);
      expect(screen.getByText("23:59")).toBeTruthy();
    });

    it("affiche le temps restant figé en pause (phaseRemainingMs)", async () => {
      pomodoroStore.state = {
        status: "break",
        repetition: 1,
        running: false,
        phaseEndsAt: null,
        phaseRemainingMs: 10 * 60_000 + 5_000,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });
      expect(screen.getByText("10:05")).toBeTruthy();

      // Suspendu : le temps est figé, aucune seconde ne passe.
      await vi.advanceTimersByTimeAsync(61_000);
      expect(screen.getByText("10:05")).toBeTruthy();
    });

    it("ne montre rien sans état", () => {
      pomodoroStore.state = null;

      render(PomodoroStatus, { props: { repetitions: 4 } });

      expect(screen.queryByText(/^\d{2}:\d{2}$/)).toBeNull();
    });
  });

  describe("Anneau de progression (bordure du play/pause)", () => {
    it("porte le rôle progressbar localisé et entoure le bouton play/pause", () => {
      render(PomodoroStatus, { props: { repetitions: 4 } });

      const ring = screen.getByRole("progressbar", {
        name: m.aria.cycleProgress,
      });
      const button = screen.getByRole("button", { name: m.aria.resume });
      // Le donut est la bordure du bouton : même wrapper de 64 px.
      expect(ring.parentElement).toBe(button.parentElement);
      expect(ring.parentElement?.classList.contains("size-16")).toBe(true);
      expect(button.classList.contains("size-13")).toBe(true);
      // Le bouton suit l'anneau dans le DOM (et `relative`) : son fond opaque
      // peint au-dessus — donut, pas camembert, l'icône reste visible.
      expect(
        ring.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(button.classList.contains("relative")).toBe(true);
    });

    it("porte X segments coniques, accomplis en sage, le courant en miel", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 2,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      const style =
        screen
          .getByRole("progressbar", { name: m.aria.cycleProgress })
          .getAttribute("style") ?? "";
      expect(style).toContain("conic-gradient");
      expect(style.match(/var\(--/g)?.length).toBe(4);
      expect(style).toContain("var(--sage) 0.00% 25.00%");
      expect(style).toContain("var(--honey) 25.00% 50.00%");
    });

    it("affiche l'anneau pleine en rose en longBreak", () => {
      pomodoroStore.state = {
        status: "longBreak",
        repetition: 4,
        running: true,
        phaseEndsAt: Date.now() + 15 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      const style =
        screen
          .getByRole("progressbar", { name: m.aria.cycleProgress })
          .getAttribute("style") ?? "";
      expect(style.match(/var\(--rose\)/g)?.length).toBe(4);
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

    it("porte aria-label et title traduits, sans texte visible (FR-005)", () => {
      pomodoroStore.state = {
        status: "focus",
        repetition: 1,
        running: true,
        phaseEndsAt: Date.now() + 25 * 60_000,
        phaseRemainingMs: null,
      };

      render(PomodoroStatus, { props: { repetitions: 4 } });

      const button = screen.getByRole("button", { name: m.aria.pause });
      expect(button.getAttribute("title")).toBe(m.aria.pause);
      expect(button.querySelector("svg")).toBeTruthy();
      expect(button.textContent?.trim()).toBe("");
      // Retour utilisateur : commande circulaire (donut 64 px, bouton 52 px),
      // groupe centré.
      expect(button.classList.contains("size-13")).toBe(true);
      expect(button.classList.contains("rounded-full")).toBe(true);
      expect(
        button.parentElement?.parentElement?.classList.contains(
          "justify-center",
        ),
      ).toBe(true);
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

      const nextButton = screen.getByRole("button", { name: m.aria.next });
      expect(nextButton).toBeTruthy();
      expect(nextButton.getAttribute("title")).toBe(m.aria.next);
      expect(nextButton.querySelector("svg")).toBeTruthy();
      expect(nextButton.textContent?.trim()).toBe("");
      expect(nextButton.classList.contains("rounded-full")).toBe(true);
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
