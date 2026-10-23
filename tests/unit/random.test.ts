import { describe, expect, it } from "vitest";
import type { BookSummary } from "../../src/shared/bible/api";
import {
  pickUniformChapterNumber,
  pickUniformVerseNumber,
  pickWeightedBook,
} from "../../src/shared/bible/random";

// 100 + 300 = 400 versets : GEN 25 %, EXO 75 %.
const GEN: BookSummary = {
  id: "GEN",
  commonName: "Genèse",
  numberOfChapters: 50,
  totalNumberOfVerses: 100,
};
const EXO: BookSummary = {
  id: "EXO",
  commonName: "Exode",
  numberOfChapters: 40,
  totalNumberOfVerses: 300,
};
const BOOKS = [GEN, EXO];

describe("pickWeightedBook (livre pondéré par totalNumberOfVerses)", () => {
  it("donne à chaque livre une part proportionnelle à ses versets", () => {
    // 0.1 × 400 = 40 < 100 → GEN ; 0.5 × 400 = 200 ≥ 100 → EXO
    // (une pondération par chapitres donnerait GEN dans les deux cas).
    expect(pickWeightedBook(BOOKS, () => 0.1).id).toBe("GEN");
    expect(pickWeightedBook(BOOKS, () => 0.5).id).toBe("EXO");
    expect(pickWeightedBook(BOOKS, () => 0.9).id).toBe("EXO");
  });

  it("renvoie l'unique livre d'une liste à un élément", () => {
    expect(pickWeightedBook([GEN], () => 0.42).id).toBe("GEN");
  });
});

describe("pickUniformChapterNumber (chapitre uniforme)", () => {
  it("tire dans 1..numberOfChapters, bornes incluses", () => {
    expect(pickUniformChapterNumber(GEN, () => 0)).toBe(1);
    expect(pickUniformChapterNumber(GEN, () => 0.5)).toBe(26);
    expect(pickUniformChapterNumber(GEN, () => 0.999)).toBe(50);
  });
});

describe("pickUniformVerseNumber (verset uniforme)", () => {
  it("tire dans 1..numberOfVerses, bornes incluses", () => {
    expect(pickUniformVerseNumber(31, () => 0)).toBe(1);
    expect(pickUniformVerseNumber(31, () => 0.5)).toBe(16);
    expect(pickUniformVerseNumber(31, () => 0.999)).toBe(31);
  });

  it("utilise Math.random par défaut et reste dans les bornes", () => {
    const verseNumber = pickUniformVerseNumber(31);
    expect(verseNumber).toBeGreaterThanOrEqual(1);
    expect(verseNumber).toBeLessThanOrEqual(31);
  });
});
