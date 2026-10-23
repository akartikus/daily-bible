/**
 * Extraction d'un verset depuis le contenu d'un chapitre (règle data-model.md :
 * concaténer les chaînes et FormattedText.text, ignorer les références de notes
 * et les sauts de ligne internes).
 */

import { BibleApiError, type Chapter } from "./api";

/** Verset affichable — champs et identité : data-model.md (Verse). */
export interface Verse {
  bookId: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  text: string;
  translationId: string;
  translationName: string;
  fetchedAt: number;
}

/** Un élément de contenu de verset : chaîne, texte formaté, note ou saut. */
type VerseContentItem = string | ({ text?: string } & Record<string, unknown>);

/** Concatène le texte exploitable d'un contenu de verset. */
export function extractVerseText(content: VerseContentItem[]): string {
  return content
    .map((item) => (typeof item === "string" ? item : (item.text ?? "")))
    .join("");
}

/**
 * Extrait le verset demandé d'un chapitre. Jette BibleApiError si le verset
 * est absent (sélection vide → message utilisateur, jamais d'écran vide).
 */
export function extractVerse(
  chapter: Chapter,
  verseNumber: number,
  translationName: string,
): Verse {
  const verseElement = chapter.content.find(
    (item): item is { type: "verse"; number: number; content: unknown[] } =>
      typeof item === "object" &&
      item !== null &&
      (item as { type?: string }).type === "verse" &&
      (item as { number?: number }).number === verseNumber,
  );
  if (!verseElement) {
    throw new BibleApiError();
  }
  return {
    bookId: chapter.bookId,
    bookName: chapter.bookName,
    chapterNumber: chapter.number,
    verseNumber,
    text: extractVerseText(verseElement.content as VerseContentItem[]),
    translationId: chapter.translationId,
    translationName,
    fetchedAt: Date.now(),
  };
}
