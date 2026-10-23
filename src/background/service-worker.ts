/**
 * Orchestration du pomodoro biblique (service worker MV3). Au message
 * « ensure-current-verse » : réaffiche le verset du cycle courant s'il existe
 * (FR-002 : un clic manuel ne consomme pas de tirage), sinon tire un verset
 * (BookIndex → livre pondéré → chapitre → extraction), l'écrit dans
 * currentCycle et répond. Toute erreur est convertie en réponse { error }
 * affichable (FR-011 : jamais de plantage).
 */

import {
  BibleApiError,
  fetchBookIndex,
  fetchChapter,
} from "../shared/bible/api";
import { extractVerse, type Verse } from "../shared/bible/extract";
import {
  pickUniformChapterNumber,
  pickUniformVerseNumber,
  pickWeightedBook,
} from "../shared/bible/random";
import { onMessage } from "../shared/chrome/runtime";
import { get, set } from "../shared/chrome/storage";

const TRANSLATION_ID = "fra_lsg";
const TRANSLATION_NAME = "Louis Segond 1910";

export interface EnsureCurrentVerseRequest {
  type: "ensure-current-verse";
}

export type EnsureCurrentVerseResponse = { verse: Verse } | { error: string };

interface CurrentCycle {
  verse: Verse | null;
  startedAt: number;
}

onMessage<EnsureCurrentVerseRequest>((message, _sender, sendResponse) => {
  if (message.type !== "ensure-current-verse") {
    return;
  }
  void ensureCurrentVerse().then(sendResponse);
  return true; // garde le canal ouvert pour la réponse asynchrone
});

async function ensureCurrentVerse(): Promise<EnsureCurrentVerseResponse> {
  try {
    const currentCycle = await get<CurrentCycle>("currentCycle");
    if (currentCycle?.verse) {
      return { verse: currentCycle.verse };
    }
    const bookIndex = await fetchBookIndex(TRANSLATION_ID);
    const book = pickWeightedBook(bookIndex.books);
    const chapter = await fetchChapter(
      TRANSLATION_ID,
      book.id,
      pickUniformChapterNumber(book),
    );
    const verse = extractVerse(
      chapter,
      pickUniformVerseNumber(chapter.numberOfVerses),
      TRANSLATION_NAME,
    );
    await set("currentCycle", { verse, startedAt: Date.now() });
    return { verse };
  } catch (error) {
    return { error: toUserMessage(error) };
  }
}

function toUserMessage(error: unknown): string {
  return error instanceof BibleApiError
    ? error.message
    : "Une erreur inattendue s'est produite. Réessayez.";
}
