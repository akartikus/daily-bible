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

function booksPayload() {
  return {
    translation: { id: TRANSLATION_ID, name: "Louis Segond 1910" },
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
        bookIndex: expect.objectContaining({ translationId: TRANSLATION_ID }),
      });

      const second = await fetchBookIndex(TRANSLATION_ID);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it("re-télécharge quand le cache a plus de 30 jours", async () => {
      await set("bookIndex", {
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

    it("mappe réseau, HTTP non 200 et JSON invalide vers le même message utilisateur (FR-011)", async () => {
      const messages: string[] = [];

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new TypeError("Failed to fetch");
        }),
      );
      messages.push(
        (await captureBibleApiError(() => fetchBookIndex(TRANSLATION_ID)))
          .message,
      );

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ status: 500, json: async () => ({}) })),
      );
      messages.push(
        (await captureBibleApiError(() => fetchBookIndex(TRANSLATION_ID)))
          .message,
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
      messages.push(
        (await captureBibleApiError(() => fetchBookIndex(TRANSLATION_ID)))
          .message,
      );

      expect(messages[0]).toBeTruthy();
      expect(messages[1]).toBe(messages[0]);
      expect(messages[2]).toBe(messages[0]);
    });
  });
});
