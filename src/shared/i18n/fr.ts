import type { Messages } from "./en";

/**
 * Catalogue français — typé `Messages`, la complétude vis-à-vis de l'anglais
 * est garantie à la compilation (contracts/i18n.md).
 */
export const fr: Messages = {
  status: {
    focus: "Focus",
    break: "Pause",
    longBreak: "Longue pause",
  },
  repetition: (current: number, total: number) =>
    `répétition ${current} / ${total}`,
  aria: {
    cycleProgress: "Progression du cycle pomodoro",
    pause: "Mettre en pause",
    resume: "Reprendre",
    next: "Focus suivant",
    settings: "Réglages",
    retry: "Réessayer",
  },
  loading: "Chargement…",
  settings: {
    backToVerse: "Retour au verset",
    autoDisplay: "Affichage automatique",
    interval: "Intervalle (minutes)",
    focus: "Focus (minutes)",
    break: "Pause (minutes)",
    longBreak: "Longue pause (minutes)",
    repetitions: "Répétitions avant longue pause",
  },
  errors: {
    minutesRange: "Entrez un nombre entier entre 1 et 1440.",
    repetitionsRange: "Entrez un nombre entier entre 1 et 10.",
    unexpected: "Une erreur inattendue s'est produite. Réessayez.",
    bibleUnavailable:
      "Versets indisponibles. Vérifiez votre connexion et réessayez.",
  },
  store: {
    loadError: "Impossible de charger l'état du pomodoro",
    pauseError: "Échec de la suspension",
    resumeError: "Échec de la reprise",
    nextError: "Échec du passage au focus suivant",
  },
};
