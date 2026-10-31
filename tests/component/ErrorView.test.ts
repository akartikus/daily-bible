import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";
import ErrorView from "../../src/popup/components/ErrorView.svelte";

// T004 : le bouton de relance s'affirme aux deux locales (mock getUILanguage
// pilotable) ; le message passé en prop reste affiché tel quel.
const languages = ["fr", "en-US"] as const;

describe.each(languages)(
  "ErrorView (FR-011 : message clair + réessayer, jamais d'écran vide) — locale %s",
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

    it("affiche le message d'erreur passé en prop", () => {
      render(ErrorView, {
        message: m.errors.bibleUnavailable,
        onRetry: () => {},
      });
      expect(screen.getByText(m.errors.bibleUnavailable)).toBeTruthy();
    });

    it("affiche un bouton de relance localisé qui déclenche onRetry", async () => {
      const onRetry = vi.fn();
      render(ErrorView, { message: "Erreur", onRetry });
      await fireEvent.click(screen.getByRole("button", { name: m.aria.retry }));
      expect(onRetry).toHaveBeenCalledOnce();
    });
  },
);
