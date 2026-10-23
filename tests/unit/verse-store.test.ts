import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { set } from "../../src/shared/chrome/storage";
import type { Verse } from "../../src/shared/bible/extract";
import { onMessage } from "../../src/shared/chrome/runtime";
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

describe("store du verset courant (T017 — contracts/ui-behavior.md)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
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
    onMessage((_message, _sender, sendResponse) => {
      sendResponse({
        error: "Versets indisponibles. Vérifiez votre connexion et réessayez.",
      });
    });
    const store = new VerseStore();

    await store.load();

    expect(store.verse).toBeNull();
    expect(store.error).toBe(
      "Versets indisponibles. Vérifiez votre connexion et réessayez.",
    );
    expect(store.loading).toBe(false);
  });

  it("load : échec de la messagerie → erreur inattendue sans plantage (FR-011)", async () => {
    onMessage(() => {
      throw new Error("channel closed");
    });
    const store = new VerseStore();

    await expect(store.load()).resolves.toBeUndefined();

    expect(store.verse).toBeNull();
    expect(store.error).toBeTruthy();
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
});
