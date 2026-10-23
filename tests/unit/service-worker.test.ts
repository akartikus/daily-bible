import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { sendMessage } from "../../src/shared/chrome/runtime";
import { get, set } from "../../src/shared/chrome/storage";
import type { Verse } from "../../src/shared/bible/extract";
import type { EnsureCurrentVerseResponse } from "../../src/background/service-worker";

const TRANSLATION_ID = "fra_lsg";
const API_ERROR_MESSAGE =
  "Versets indisponibles. Vérifiez votre connexion et réessayez.";

function booksPayload() {
  return {
    translation: { id: TRANSLATION_ID, name: "Louis Segond 1910" },
    books: [
      {
        id: "GEN",
        commonName: "Genèse",
        numberOfChapters: 50,
        totalNumberOfVerses: 100,
      },
      {
        id: "EXO",
        commonName: "Exode",
        numberOfChapters: 40,
        totalNumberOfVerses: 300,
      },
    ],
  };
}

function chapterPayload() {
  return {
    translation: { id: TRANSLATION_ID },
    book: { id: "GEN", commonName: "Genèse" },
    numberOfVerses: 2,
    chapter: {
      number: 6,
      content: [
        {
          type: "verse",
          number: 1,
          content: ["Au commencement, Dieu créa les cieux et la terre."],
        },
        {
          type: "verse",
          number: 2,
          content: ["La terre était informe et vide."],
        },
      ],
    },
  };
}

function jsonResponse(body: unknown) {
  return { status: 200, json: async () => body };
}

const existingVerse: Verse = {
  bookId: "PSA",
  bookName: "Psaumes",
  chapterNumber: 23,
  verseNumber: 1,
  text: "L'Éternel est mon berger.",
  translationId: TRANSLATION_ID,
  translationName: "Louis Segond 1910",
  fetchedAt: 1_000,
};

describe("service-worker : orchestration « ensure-current-verse » (T014)", () => {
  let mock: ChromeMock;

  beforeEach(async () => {
    // Ré-importe le module à chaque test : son listener s'enregistre sur le
    // mock courant (vi.resetModules vide le registre entre deux tests).
    vi.resetModules();
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
    await import("../../src/background/service-worker");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("premier appel : tire un verset, écrit currentCycle et répond le verset", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith("/books.json")) return jsonResponse(booksPayload());
      if (path.endsWith("/GEN/6.json")) return jsonResponse(chapterPayload());
      throw new Error(`URL inattendue : ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({
      verse: {
        bookId: "GEN",
        bookName: "Genèse",
        chapterNumber: 6,
        verseNumber: 1,
        text: "Au commencement, Dieu créa les cieux et la terre.",
        translationId: TRANSLATION_ID,
        translationName: "Louis Segond 1910",
        fetchedAt: expect.any(Number),
      },
    });
    expect(await get("currentCycle")).toEqual({
      verse: (response as { verse: Verse }).verse,
      startedAt: expect.any(Number),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("verset en cours : réaffiche sans consommer de tirage (FR-002)", async () => {
    await set("currentCycle", { verse: existingVerse, startedAt: 1_000 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({ verse: existingVerse });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await get("currentCycle")).toEqual({
      verse: existingVerse,
      startedAt: 1_000,
    });
  });

  it("API indisponible : répond { error } sans écrire currentCycle (FR-011)", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({ error: API_ERROR_MESSAGE });
    expect(await get("currentCycle")).toBeUndefined();
  });

  it("message inconnu : aucune réponse (canal fermé sans sendResponse)", async () => {
    const response = await sendMessage<unknown>({ type: "autre-message" });
    expect(response).toBeUndefined();
  });
});
