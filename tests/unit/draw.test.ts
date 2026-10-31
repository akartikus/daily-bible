import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock } from "../mocks/chrome";
import {
  drawRandomVerse,
  translationForLocale,
  TRANSLATIONS,
} from "../../src/shared/bible/draw";

function booksPayload(translationId: string) {
  return {
    translation: { id: translationId, name: "Nom de traduction" },
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

function chapterPayload(translationId: string, bookName: string) {
  return {
    translation: { id: translationId },
    book: { id: "GEN", commonName: bookName },
    numberOfVerses: 2,
    chapter: {
      number: 6,
      content: [
        {
          type: "verse",
          number: 1,
          content: ["Texte du verset tiré."],
        },
        {
          type: "verse",
          number: 2,
          content: ["Deuxième verset."],
        },
      ],
    },
  };
}

function jsonResponse(body: unknown) {
  return { status: 200, json: async () => body };
}

describe("translationForLocale (table locale → traduction — contracts/i18n.md)", () => {
  it("fr → fra_lsg / Louis Segond 1910", () => {
    expect(translationForLocale("fr")).toEqual({
      id: "fra_lsg",
      name: "Louis Segond 1910",
    });
  });

  it("en → eng_kjv / King James Version", () => {
    expect(translationForLocale("en")).toEqual({
      id: "eng_kjv",
      name: "King James Version",
    });
  });

  it("couvre les deux locales sans trou", () => {
    expect(Object.keys(TRANSLATIONS).sort()).toEqual(["en", "fr"]);
  });
});

describe("drawRandomVerse (tirage dans la traduction de la locale)", () => {
  beforeEach(() => {
    const mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("locale fr : tire dans Louis Segond 1910 (fra_lsg)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith("/books.json"))
        return jsonResponse(booksPayload("fra_lsg"));
      if (path.endsWith("/GEN/6.json"))
        return jsonResponse(chapterPayload("fra_lsg", "Genèse"));
      throw new Error(`URL inattendue : ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const verse = await drawRandomVerse(translationForLocale("fr"));

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://bible.helloao.org/api/fra_lsg/books.json",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://bible.helloao.org/api/fra_lsg/GEN/6.json",
    );
    expect(verse).toMatchObject({
      bookId: "GEN",
      bookName: "Genèse",
      chapterNumber: 6,
      verseNumber: 1,
      translationId: "fra_lsg",
      translationName: "Louis Segond 1910",
    });
  });

  it("locale en : tire dans la King James Version (eng_kjv)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith("/books.json"))
        return jsonResponse(booksPayload("eng_kjv"));
      if (path.endsWith("/GEN/6.json"))
        return jsonResponse(chapterPayload("eng_kjv", "Genesis"));
      throw new Error(`URL inattendue : ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const verse = await drawRandomVerse(translationForLocale("en"));

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://bible.helloao.org/api/eng_kjv/books.json",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://bible.helloao.org/api/eng_kjv/GEN/6.json",
    );
    expect(verse).toMatchObject({
      bookId: "GEN",
      bookName: "Genesis",
      chapterNumber: 6,
      verseNumber: 1,
      translationId: "eng_kjv",
      translationName: "King James Version",
    });
  });
});
