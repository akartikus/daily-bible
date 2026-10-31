/**
 * Random verse drawing shared by on-demand display and focus completion.
 */

import { fetchBookIndex, fetchChapter } from "./api";
import { extractVerse, type Verse } from "./extract";
import {
  pickUniformChapterNumber,
  pickUniformVerseNumber,
  pickWeightedBook,
} from "./random";
import type { UiLocale } from "../i18n";

/** Traduction biblique associée à une locale (contracts/i18n.md §Traductions). */
export interface Translation {
  id: string;
  name: string;
}

export const TRANSLATIONS: Record<UiLocale, Translation> = {
  fr: { id: "fra_lsg", name: "Louis Segond 1910" },
  en: { id: "eng_kjv", name: "King James Version" },
};

/** Traduction de la locale : fr → Louis Segond 1910, en → King James Version. */
export function translationForLocale(locale: UiLocale): Translation {
  return TRANSLATIONS[locale];
}

/** Draws a book, chapter, and verse from the given translation. */
export async function drawRandomVerse(
  translation: Translation,
): Promise<Verse> {
  const bookIndex = await fetchBookIndex(translation.id);
  const book = pickWeightedBook(bookIndex.books);
  const chapter = await fetchChapter(
    translation.id,
    book.id,
    pickUniformChapterNumber(book),
  );
  return extractVerse(
    chapter,
    pickUniformVerseNumber(chapter.numberOfVerses),
    translation.name,
  );
}
