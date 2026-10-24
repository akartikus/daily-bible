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

export const TRANSLATION_ID = "fra_lsg";
export const TRANSLATION_NAME = "Louis Segond 1910";

/** Draws a book, chapter, and verse from the current translation. */
export async function drawRandomVerse(): Promise<Verse> {
  const bookIndex = await fetchBookIndex(TRANSLATION_ID);
  const book = pickWeightedBook(bookIndex.books);
  const chapter = await fetchChapter(
    TRANSLATION_ID,
    book.id,
    pickUniformChapterNumber(book),
  );
  return extractVerse(
    chapter,
    pickUniformVerseNumber(chapter.numberOfVerses),
    TRANSLATION_NAME,
  );
}
