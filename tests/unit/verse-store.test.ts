import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { set } from "../../src/shared/chrome/storage";
import type { Verse } from "../../src/shared/bible/extract";
import { onMessage } from "../../src/shared/chrome/runtime";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";
import { VerseStore } from "../../src/popup/lib/verse.svelte.ts";

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

// T004 : les messages d'erreur du store s'affirment aux deux locales, textes
// attendus tirés du catalogue de la locale résolue (mock getUILanguage pilotable).
const languages = ["fr", "en-US"] as const;

describe.each(languages)(
  "store du verset courant (T017 — contracts/ui-behavior.md) — locale %s",
  (language) => {
    const m = getMessages(resolveUiLocale(language));
    let mock: ChromeMock;

    beforeEach(() => {
      mock = createChromeMock();
      mock.setUiLanguage(language);
      vi.stubGlobal("chrome", mock.chrome);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("load : verset en cours dans currentCycle → affichage immédiat, sans message au service worker", async () => {
      await set("currentCycle", { verse, startedAt: 1_000 });
      const store = new VerseStore();

      await store.load();

      expect(store.verse).toEqual(verse);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it("load : currentCycle absent → demande au service worker, loading puis verset", async () => {
      onMessage((_message, _sender, sendResponse) => {
        sendResponse({ verse });
      });
      const store = new VerseStore();

      const pending = store.load();
      expect(store.loading).toBe(true);

      await pending;
      expect(store.verse).toEqual(verse);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: "ensure-current-verse",
      });
    });

    it("load : réponse { error } → état erreur, pas de verset (FR-011)", async () => {
      // Texte tel que le service worker le résout pour cette locale.
      onMessage((_message, _sender, sendResponse) => {
        sendResponse({ error: m.errors.bibleUnavailable });
      });
      const store = new VerseStore();

      await store.load();

      expect(store.verse).toBeNull();
      expect(store.error).toBe(m.errors.bibleUnavailable);
      expect(store.loading).toBe(false);
    });

    it("load : échec de la messagerie → erreur inattendue localisée sans plantage (FR-011)", async () => {
      onMessage(() => {
        throw new Error("channel closed");
      });
      const store = new VerseStore();

      await expect(store.load()).resolves.toBeUndefined();

      expect(store.verse).toBeNull();
      expect(store.error).toBe(m.errors.unexpected);
      expect(store.loading).toBe(false);
    });

    it("observe : une écriture de currentCycle par le service worker met à jour le verset", async () => {
      const store = new VerseStore();
      store.observe();

      const nextVerse: Verse = {
        ...verse,
        verseNumber: 2,
        text: "La terre était informe et vide.",
      };
      await set("currentCycle", { verse: nextVerse, startedAt: 2_000 });

      expect(store.verse).toEqual(nextVerse);
    });
  },
);
