import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { onMessage, sendMessage } from "../../src/shared/chrome/runtime";

interface EnsureCurrentVerseRequest {
  type: "ensure-current-verse";
}

interface EnsureCurrentVerseResponse {
  verseText: string;
}

describe("wrapper chrome.runtime (messagerie popup ↔ service worker)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sendMessage transmet le message à chrome.runtime.sendMessage", async () => {
    await sendMessage<unknown>({ type: "ensure-current-verse" });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "ensure-current-verse",
    });
  });

  it("sendMessage résout la réponse envoyée par le handler via sendResponse (round-trip)", async () => {
    onMessage<EnsureCurrentVerseRequest>((_message, _sender, sendResponse) => {
      sendResponse({ verseText: "Au commencement" });
    });

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({ verseText: "Au commencement" });
  });

  it("onMessage reçoit le message et le sender du service worker", async () => {
    const handler = vi.fn(
      (
        _message: EnsureCurrentVerseRequest,
        _sender: chrome.runtime.MessageSender,
      ) => {
        return false;
      },
    );
    onMessage(handler);

    await sendMessage<undefined>({ type: "ensure-current-verse" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toEqual({
      type: "ensure-current-verse",
    });
    expect(handler.mock.calls[0]?.[1]).toEqual({ id: "mock" });
  });

  it("sendMessage résout undefined quand aucun listener ne répond", async () => {
    const response = await sendMessage<unknown>({
      type: "ensure-current-verse",
    });
    expect(response).toBeUndefined();
  });
});
