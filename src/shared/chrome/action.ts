/**
 * Wrapper mince autour de `chrome.action.openPopup()` (research.md §4) :
 * appelé depuis le service worker à chaque échéance de l'alarme. La promesse
 * peut rejeter (popup déjà ouvert, plein écran…) : l'échec est journalisé et
 * non bloquant — le verset reste disponible au clic sur l'icône. Isolé pour
 * la testabilité (constitution IV) — les tests stubbent le global `chrome`.
 */

/** Ouvre le popup ; en cas d'échec, journalise et continue (non bloquant). */
export async function openPopup(): Promise<void> {
  try {
    await chrome.action.openPopup();
  } catch (error) {
    console.warn("openPopup a échoué (non bloquant) :", error);
  }
}
