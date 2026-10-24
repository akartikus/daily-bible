import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { openPopup } from "../../src/shared/chrome/action";

describe("wrapper chrome.action.openPopup (research.md §4)", () => {
  let mock: ChromeMock;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    warnSpy.mockRestore();
  });

  it("appelle chrome.action.openPopup()", async () => {
    await openPopup();
    expect(chrome.action.openPopup).toHaveBeenCalledTimes(1);
  });

  it("journalise et continue si la promesse rejette (échec non bloquant)", async () => {
    vi.mocked(chrome.action.openPopup).mockRejectedValueOnce(
      new Error("popup déjà ouvert"),
    );
    await expect(openPopup()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
