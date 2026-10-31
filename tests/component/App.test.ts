import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { onMessage } from "../../src/shared/chrome/runtime";
import { get, set } from "../../src/shared/chrome/storage";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";
import type { Verse } from "../../src/shared/bible/extract";
import type { EnsureCurrentVerseResponse } from "../../src/background/service-worker";
import App from "../../src/popup/App.svelte";

// The pomodoro bar sends pomodoro-get-state on mount; only a verse draw is forbidden.
function assertNoVerseDraw() {
  const draws = vi
    .mocked(chrome.runtime.sendMessage)
    .mock.calls.filter(
      ([message]) =>
        (message as { type?: string }).type === "ensure-current-verse",
    );
  expect(draws).toHaveLength(0);
}

const verse: Verse = {
  bookId: "GEN",
  bookName: "Genèse",
  chapterNumber: 1,
  verseNumber: 1,
  text: "Au commencement, Dieu créa les cieux et la terre.",
  translationId: "fra_lsg",
  translationName: "Louis Segond 1910",
  fetchedAt: 1_000,
};

// T004 : chaque scénario s'exécute aux deux locales, textes attendus tirés du
// catalogue de la locale résolue (mock getUILanguage pilotable).
const languages = ["fr", "en-US"] as const;

describe.each(languages)(
  "App (T018 — scénarios 1, 2 et 6 de quickstart.md) — locale %s",
  (language) => {
    const m = getMessages(resolveUiLocale(language));
    let mock: ChromeMock;

    beforeEach(() => {
      mock = createChromeMock();
      mock.setUiLanguage(language);
      vi.stubGlobal("chrome", mock.chrome);
    });

    afterEach(() => {
      cleanup();
      vi.unstubAllGlobals();
    });

    it("scénario 2 : verset en cours → affiché immédiatement, sans nouveau tirage", async () => {
      await set("currentCycle", { verse, startedAt: 1_000 });

      render(App);

      expect(await screen.findByText(verse.text)).toBeTruthy();
      expect(screen.getByText("Genèse 1:1")).toBeTruthy();
      expect(screen.getByText("Louis Segond 1910")).toBeTruthy();
      assertNoVerseDraw();
    });

    it("scénario 1 : installation fraîche → demande au service worker puis verset affiché", async () => {
      onMessage((_message, _sender, sendResponse) => {
        sendResponse({ verse });
      });

      render(App);

      expect(await screen.findByText(verse.text)).toBeTruthy();
      expect(screen.getByText("Genèse 1:1")).toBeTruthy();
      expect(screen.getByText("Louis Segond 1910")).toBeTruthy();
    });

    it("affiche l'état de chargement dans la langue du navigateur", async () => {
      onMessage(() => true); // canal ouvert, jamais de réponse

      render(App);

      expect(await screen.findByText(m.loading)).toBeTruthy();
    });

    it("scénario 6 : échec → ErrorView ; réessayer relance la demande qui réussit", async () => {
      // Texte tel que le service worker le résout pour cette locale.
      let response: EnsureCurrentVerseResponse = {
        error: m.errors.bibleUnavailable,
      };
      onMessage((_message, _sender, sendResponse) => {
        sendResponse(response);
      });

      render(App);
      expect(await screen.findByText(m.errors.bibleUnavailable)).toBeTruthy();

      response = { verse };
      await fireEvent.click(screen.getByRole("button", { name: m.aria.retry }));
      expect(await screen.findByText(verse.text)).toBeTruthy();
      expect(screen.queryByRole("button", { name: m.aria.retry })).toBeNull();
    });
  },
);

describe.each(languages)(
  "App : navigation réglages (T027 — FR-007/SC-003) — locale %s",
  (language) => {
    const m = getMessages(resolveUiLocale(language));
    let mock: ChromeMock;

    beforeEach(() => {
      mock = createChromeMock();
      mock.setUiLanguage(language);
      vi.stubGlobal("chrome", mock.chrome);
    });

    afterEach(() => {
      cleanup();
      vi.unstubAllGlobals();
    });

    it("engrenage → réglages (≤ 2 interactions) ; retour → verset réaffiché sans tirage (FR-002)", async () => {
      await set("currentCycle", { verse, startedAt: 1_000 });

      render(App);
      expect(await screen.findByText(verse.text)).toBeTruthy();

      await fireEvent.click(
        screen.getByRole("button", { name: m.aria.settings }),
      );
      expect(
        screen.getByRole("checkbox", { name: m.settings.autoDisplay }),
      ).toBeTruthy();

      await fireEvent.click(
        screen.getByRole("button", { name: m.settings.backToVerse }),
      );
      expect(await screen.findByText(verse.text)).toBeTruthy();
      assertNoVerseDraw();
    });

    it("scénario 3 : réglages persistés → interrupteur et intervalle conservés (FR-006/SC-004)", async () => {
      await set("settings", {
        autoDisplayEnabled: true,
        intervalMinutes: 1,
        translationId: "fra_lsg",
      });

      render(App);
      await fireEvent.click(
        screen.getByRole("button", { name: m.aria.settings }),
      );

      const toggle = screen.getByRole("checkbox", {
        name: m.settings.autoDisplay,
      }) as HTMLInputElement;
      await waitFor(() => expect(toggle.checked).toBe(true));
      expect(
        (
          screen.getByRole("spinbutton", {
            name: m.settings.interval,
          }) as HTMLInputElement
        ).value,
      ).toBe("1");
    });

    it("modifier un réglage l'écrit dans le stockage (application immédiate — FR-006)", async () => {
      render(App);
      await fireEvent.click(
        screen.getByRole("button", { name: m.aria.settings }),
      );
      await fireEvent.click(
        screen.getByRole("checkbox", { name: m.settings.autoDisplay }),
      );

      await waitFor(async () =>
        expect(await get("settings")).toEqual({
          autoDisplayEnabled: true,
          intervalMinutes: 25,
          focusMinutes: 25,
          breakMinutes: 5,
          longBreakMinutes: 15,
          repetitionsBeforeLongBreak: 4,
        }),
      );
    });
  },
);
