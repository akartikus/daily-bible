/**
 * Client HTTP de la Free Use Bible API (contracts/bible-api.md). Toute erreur
 * (réseau, HTTP non 200, JSON invalide, lenteur) est mappée vers BibleApiError
 * et son code unique (FR-011) ; le texte est résolu à l'affichage depuis la
 * locale (errors.bibleUnavailable).
 */

import { get, set, type StorageKey } from "../chrome/storage";

const BASE_URL = "https://bible.helloao.org";
const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Code résolu en texte à l'affichage via le catalogue (errors.bibleUnavailable). */
export type BibleApiErrorCode = "bible-unavailable";

export class BibleApiError extends Error {
  readonly code: BibleApiErrorCode;

  constructor() {
    super("bible-unavailable");
    this.name = "BibleApiError";
    this.code = "bible-unavailable";
  }
}

export interface BookSummary {
  id: string;
  commonName: string;
  numberOfChapters: number;
  totalNumberOfVerses: number;
}

export interface BookIndex {
  translationId: string;
  books: BookSummary[];
  fetchedAt: number;
}

export interface Chapter {
  translationId: string;
  bookId: string;
  bookName: string;
  number: number;
  numberOfVerses: number;
  content: unknown[];
}

interface BooksPayload {
  translation: { id: string; name: string };
  books: BookSummary[];
}

interface ChapterPayload {
  translation: { id: string };
  book: { id: string; commonName: string };
  numberOfVerses: number;
  chapter: { number: number; content: unknown[] };
}

/** GET JSON avec timeout 10 s par requête ; annule la requête au délai. */
async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, TIMEOUT_MS);
  });
  try {
    const response = await Promise.race([
      fetch(url, { signal: controller.signal }),
      timeout,
    ]);
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch {
    throw new BibleApiError();
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Index des livres, mis en cache par traduction (invalidation 30 jours). */
export async function fetchBookIndex(
  translationId: string,
): Promise<BookIndex> {
  const cacheKey: StorageKey = `bookIndex:${translationId}`;
  const cached = await get<BookIndex>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }
  const payload = (await fetchJson(
    `${BASE_URL}/api/${translationId}/books.json`,
  )) as BooksPayload;
  const index: BookIndex = {
    translationId,
    books: payload.books,
    fetchedAt: Date.now(),
  };
  await set(cacheKey, index);
  return index;
}

/** Chapitre d'une traduction ; le contenu reste brut (extraction en extract.ts). */
export async function fetchChapter(
  translationId: string,
  bookId: string,
  chapterNumber: number,
): Promise<Chapter> {
  const payload = (await fetchJson(
    `${BASE_URL}/api/${translationId}/${bookId}/${chapterNumber}.json`,
  )) as ChapterPayload;
  return {
    translationId: payload.translation.id,
    bookId: payload.book.id,
    bookName: payload.book.commonName,
    number: payload.chapter.number,
    numberOfVerses: payload.numberOfVerses,
    content: payload.chapter.content,
  };
}
