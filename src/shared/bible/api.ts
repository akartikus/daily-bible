/**
 * Client HTTP de la Free Use Bible API (contracts/bible-api.md). Toute erreur
 * (réseau, HTTP non 200, JSON invalide, lenteur) est mappée vers BibleApiError
 * et son message utilisateur unique (FR-011).
 */

import { get, set } from "../chrome/storage";

const BASE_URL = "https://bible.helloao.org";
const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class BibleApiError extends Error {
  constructor() {
    super("Versets indisponibles. Vérifiez votre connexion et réessayez.");
    this.name = "BibleApiError";
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

/** Index des livres, mis en cache dans storage.local (invalidation 30 jours). */
export async function fetchBookIndex(
  translationId: string,
): Promise<BookIndex> {
  const cached = await get<BookIndex>("bookIndex");
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
  await set("bookIndex", index);
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
