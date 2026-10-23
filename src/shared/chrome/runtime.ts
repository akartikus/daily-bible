/**
 * Wrapper autour de `chrome.runtime` pour la messagerie popup ↔ service worker
 * (message « ensure-current-verse » — T014). Isolé pour la testabilité
 * (constitution IV) — les tests stubbent le global `chrome`.
 */

/** Envoie un message (typé côté appelant) et attend la réponse du service worker. */
export async function sendMessage<TResponse>(
  message: unknown,
): Promise<TResponse> {
  const response = await chrome.runtime.sendMessage(message);
  return response as TResponse;
}

/**
 * Enregistre un handler de message. Retourner `true` garde le canal de
 * réponse ouvert pour une réponse asynchrone (sendResponse après un await) ;
 * toute autre valeur ferme le canal au retour du handler.
 */
export function onMessage<TMessage>(
  handler: (
    message: TMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => boolean | undefined | void,
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
    handler(message as TMessage, sender, sendResponse),
  );
}
