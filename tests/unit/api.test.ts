import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { set } from "../../src/shared/chrome/storage";
import {
  BibleApiError,
  fetchBookIndex,
  fetchChapter,
} from "../../src/shared/bible/api";

const TRANSLATION_ID = "fra_lsg";
const BOOKS_URL = `https://bible.helloao.org/api/${TRANSLATION_ID}/books.json`;
const CHAPTER_URL = `https://bible.helloao.org/api/${TRANSLATION_ID}/GEN/1.json`;
const DAY_MS = 24 * 60 * 60 * 1000;

function booksPayload(translationId: string = TRANSLATION_ID) {
  return {
    translation: { id: translationId, name: "Louis Segond 1910" },
    books: [
      {
        id: "GEN",
        commonName: "Genèse",
        numberOfChapters: 50,
        totalNumberOfVerses: 1533,
      },
      {
        id: "EXO",
        commonName: "Exode",
        numberOfChapters: 40,
        totalNumberOfVerses: 1213,
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
      number: 1,
      content: [
        { type: "heading", content: ["Création du ciel et de la terre"] },
        { type: "line_break" },
        { type: "verse", number: 1, content: ["Au commencement, Dieu créa"] },
        {
          type: "verse",
          number: 2,
          content: [{ text: "La terre était informe" }],
        },
      ],
    },
  };
}

/** Réponse HTTP 200 JSON, limitée aux champs consommés par le client. */
function jsonRespond(body: unknown) {
  return {
    status: 200,
    json: async () => body,
  };
}

/** Exécute l'action et capture le rejet, en vérifiant que c'est un BibleApiError. */
async function captureBibleApiError(
  action: () => Promise<unknown>,
): Promise<BibleApiError> {
  const error = await action().catch((error: unknown) => error);
  expect(error).toBeInstanceOf(BibleApiError);
  return error as BibleApiError;
}

describe("client Free Use Bible API (contracts/bible-api.md)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("fetchBookIndex", () => {
    it("récupère books.json et renvoie un BookIndex (translationId, books, fetchedAt)", async () => {
      const fetchMock = vi.fn(async (_url: string) =>
        jsonRespond(booksPayload()),
      );
      vi.stubGlobal("fetch", fetchMock);

      const index = await fetchBookIndex(TRANSLATION_ID);

      expect(fetchMock.mock.calls[0]?.[0]).toBe(BOOKS_URL);
      expect(index.translationId).toBe(TRANSLATION_ID);
      expect(index.books).toEqual(booksPayload().books);
      expect(typeof index.fetchedAt).toBe("number");
    });

    it("persiste l'index via le wrapper storage puis le réutilise sans nouvelle requête", async () => {
      const fetchMock = vi.fn(async () => jsonRespond(booksPayload()));
      vi.stubGlobal("fetch", fetchMock);

      const first = await fetchBookIndex(TRANSLATION_ID);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        "bookIndex:fra_lsg": expect.objectContaining({
          translationId: TRANSLATION_ID,
        }),
      });

      const second = await fetchBookIndex(TRANSLATION_ID);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it("chaque traduction a son propre cache (bookIndex:<id>)", async () => {
      // Index fra_lsg frais en cache : ne doit pas servir eng_kjv
      await set("bookIndex:fra_lsg", {
        translationId: "fra_lsg",
        books: [],
        fetchedAt: Date.now(),
      });
      const fetchMock = vi.fn(async (url: string) => {
        if (String(url).endsWith("/eng_kjv/books.json")) {
          return jsonRespond(booksPayload("eng_kjv"));
        }
        throw new Error(`URL inattendue : ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      const index = await fetchBookIndex("eng_kjv");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(index.translationId).toBe("eng_kjv");
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        "bookIndex:eng_kjv": expect.objectContaining({
          translationId: "eng_kjv",
        }),
      });
    });

    it("re-télécharge quand le cache a plus de 30 jours", async () => {
      await set("bookIndex:fra_lsg", {
        translationId: TRANSLATION_ID,
        books: [],
        fetchedAt: Date.now() - 31 * DAY_MS,
      });
      const fetchMock = vi.fn(async () => jsonRespond(booksPayload()));
      vi.stubGlobal("fetch", fetchMock);

      await fetchBookIndex(TRANSLATION_ID);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchChapter", () => {
    it("récupère le chapitre et expose les champs consommés", async () => {
      const fetchMock = vi.fn(async (_url: string) =>
        jsonRespond(chapterPayload()),
      );
      vi.stubGlobal("fetch", fetchMock);

      const chapter = await fetchChapter(TRANSLATION_ID, "GEN", 1);

      expect(fetchMock.mock.calls[0]?.[0]).toBe(CHAPTER_URL);
      expect(chapter).toEqual({
        translationId: TRANSLATION_ID,
        bookId: "GEN",
        bookName: "Genèse",
        number: 1,
        numberOfVerses: 2,
        content: chapterPayload().chapter.content,
      });
    });
  });

  describe("règles transversales", () => {
    it("rejette avec BibleApiError après 10 s sans réponse (timeout par requête)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})),
      );

      const pending = fetchBookIndex(TRANSLATION_ID);
      const rejection = expect(pending).rejects.toBeInstanceOf(BibleApiError);
      await vi.advanceTimersByTimeAsync(10_000);
      await rejection;
    });

    it("mappe réseau, HTTP non 200 et JSON invalide vers le même code bible-unavailable (FR-011)", async () => {
      const codes: string[] = [];

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new TypeError("Failed to fetch");
        }),
      );
      codes.push(
        (await captureBibleApiError(() => fetchBookIndex(TRANSLATION_ID))).code,
      );

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ status: 500, json: async () => ({}) })),
      );
      codes.push(
        (await captureBibleApiError(() => fetchBookIndex(TRANSLATION_ID))).code,
      );

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          status: 200,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        })),
      );
      codes.push(
        (await captureBibleApiError(() => fetchBookIndex(TRANSLATION_ID))).code,
      );

      expect(codes[0]).toBe("bible-unavailable");
      expect(codes[1]).toBe(codes[0]);
      expect(codes[2]).toBe(codes[0]);
    });
  });
});
