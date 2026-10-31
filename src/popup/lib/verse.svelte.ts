/**
 * Store du verset courant du popup (contracts/ui-behavior.md) : lecture de
 * currentCycle au montage, demande de tirage au service worker si absent,
 * états loading/erreur (FR-011 : jamais d'écran vide ni de plantage).
 */

import type {
  EnsureCurrentVerseRequest,
  EnsureCurrentVerseResponse,
} from "../../background/service-worker";
import type { Verse } from "../../shared/bible/extract";
import { sendMessage } from "../../shared/chrome/runtime";
import { get, onChanged } from "../../shared/chrome/storage";
import { getMessages, resolveUiLocale } from "../../shared/i18n";

interface CurrentCycle {
  verse: Verse | null;
  startedAt: number;
}

export class VerseStore {
  verse = $state<Verse | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  /** Lecture de currentCycle puis demande au service worker si absent. */
  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const currentCycle = await get<CurrentCycle>("currentCycle");
      if (currentCycle?.verse) {
        this.verse = currentCycle.verse;
        return;
      }
      const response = await sendMessage<EnsureCurrentVerseResponse>({
        type: "ensure-current-verse",
      } satisfies EnsureCurrentVerseRequest);
      if ("verse" in response) {
        this.verse = response.verse;
      } else {
        this.error = response.error;
      }
    } catch {
      this.error = getMessages(
        resolveUiLocale(chrome.i18n.getUILanguage()),
      ).errors.unexpected;
    } finally {
      this.loading = false;
    }
  }

  /** Observe les écritures du service worker pendant l'ouverture du popup. */
  observe(): void {
    onChanged((changes) => {
      const cycle = changes.currentCycle?.newValue as CurrentCycle | undefined;
      if (cycle?.verse) {
        this.verse = cycle.verse;
        this.error = null;
      }
    });
  }
}
