import { en, type Messages } from "./en";
import { fr } from "./fr";

export type { Messages };

/** Langue d'interface supportée par l'extension (data-model.md). */
export type UiLocale = "fr" | "en";

const messages: Record<UiLocale, Messages> = { fr, en };

/**
 * Ramène la langue du navigateur à une locale supportée : préfixe `fr`
 * (variantes régionales incluses) → `"fr"` ; toute autre valeur, y compris
 * absente → `"en"` (fallback FR-002).
 */
export function resolveUiLocale(language: string | undefined): UiLocale {
  return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Sert le catalogue de textes d'une locale. */
export function getMessages(locale: UiLocale): Messages {
  return messages[locale];
}
