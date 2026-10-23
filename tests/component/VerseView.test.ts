import { cleanup, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import VerseView from "../../src/popup/components/VerseView.svelte";
import type { Verse } from "../../src/shared/bible/extract";

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

afterEach(cleanup);

describe("VerseView (FR-009 : texte + référence + traduction)", () => {
  it("affiche le texte du verset", () => {
    render(VerseView, { verse });
    expect(screen.getByText(verse.text)).toBeTruthy();
  });

  it("affiche la référence au format « livre chapitre:verset »", () => {
    render(VerseView, { verse });
    expect(screen.getByText("Genèse 1:1")).toBeTruthy();
  });

  it("affiche la traduction", () => {
    render(VerseView, { verse });
    expect(screen.getByText("Louis Segond 1910")).toBeTruthy();
  });
});
