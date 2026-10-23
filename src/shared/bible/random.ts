/**
 * Tirage aléatoire côté client (research.md §2) : l'API n'expose pas d'endpoint
 * « verset aléatoire ». La source aléatoire est injectée pour des tests
 * déterministes (constitution IV) ; Math.random par défaut en production.
 */

import type { BookSummary } from "./api";

/** Tire un livre, pondéré par totalNumberOfVerses (approxime l'uniformité sur les versets). */
export function pickWeightedBook(
  books: BookSummary[],
  random: () => number = Math.random,
): BookSummary {
  const totalVerses = books.reduce(
    (sum, book) => sum + book.totalNumberOfVerses,
    0,
  );
  const threshold = random() * totalVerses;
  let cumulative = 0;
  for (const book of books) {
    cumulative += book.totalNumberOfVerses;
    if (threshold < cumulative) {
      return book;
    }
  }
  // shortcut: random() peut renvoyer 1 avec une source injectée, retombe sur le dernier livre
  return books[books.length - 1];
}

/** Tire un numéro de chapitre uniforme dans 1..numberOfChapters. */
export function pickUniformChapterNumber(
  book: BookSummary,
  random: () => number = Math.random,
): number {
  return uniformInRange(book.numberOfChapters, random);
}

/** Tire un numéro de verset uniforme dans 1..numberOfVerses. */
export function pickUniformVerseNumber(
  numberOfVerses: number,
  random: () => number = Math.random,
): number {
  return uniformInRange(numberOfVerses, random);
}

/** Uniforme dans 1..n bornes incluses ; clamp si une source injectée renvoie 1. */
function uniformInRange(n: number, random: () => number): number {
  return Math.min(Math.floor(random() * n) + 1, n);
}
