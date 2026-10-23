import { describe, expect, it } from "vitest";
import { BibleApiError, type Chapter } from "../../src/shared/bible/api";
import { extractVerse, extractVerseText } from "../../src/shared/bible/extract";

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    translationId: "fra_lsg",
    bookId: "GEN",
    bookName: "Genèse",
    number: 1,
    numberOfVerses: 2,
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
    ...overrides,
  };
}

describe("extractVerseText (règle d'extraction — data-model.md)", () => {
  it("concatène les chaînes et les FormattedText.text", () => {
    expect(
      extractVerseText([
        "Au commencement, ",
        { text: "Dieu créa" },
        " le ciel et la terre.",
      ]),
    ).toBe("Au commencement, Dieu créa le ciel et la terre.");
  });

  it("ignore les VerseFootnoteReference et les InlineLineBreak", () => {
    expect(
      extractVerseText([
        "Un",
        { footnoteId: 1 },
        { type: "line_break" },
        " seul texte.",
      ]),
    ).toBe("Un seul texte.");
  });

  it("renvoie une chaîne vide pour un contenu sans texte", () => {
    expect(extractVerseText([{ footnoteId: 1 }, { type: "line_break" }])).toBe(
      "",
    );
  });
});

describe("extractVerse (Verse — data-model.md)", () => {
  it("extrait le verset demandé avec tous les champs du Verse", () => {
    const verse = extractVerse(makeChapter(), 2, "Louis Segond 1910");
    expect(verse).toEqual({
      bookId: "GEN",
      bookName: "Genèse",
      chapterNumber: 1,
      verseNumber: 2,
      text: "La terre était informe",
      translationId: "fra_lsg",
      translationName: "Louis Segond 1910",
      fetchedAt: expect.any(Number),
    });
  });

  it("extrait le texte du premier verset (chaînes simples)", () => {
    expect(extractVerse(makeChapter(), 1, "Louis Segond 1910").text).toBe(
      "Au commencement, Dieu créa",
    );
  });

  it("jette BibleApiError si le verset est absent (sélection vide — jamais d'écran vide)", () => {
    expect(() => extractVerse(makeChapter(), 3, "Louis Segond 1910")).toThrow(
      BibleApiError,
    );
  });
});
