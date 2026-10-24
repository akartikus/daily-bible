import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { get, onChanged, set } from "../../src/shared/chrome/storage";

describe("wrapper chrome.storage.local", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("get renvoie undefined pour une clé absente", async () => {
    expect(await get("settings")).toBeUndefined();
  });

  it("set stocke la valeur puis get la relit", async () => {
    const settings = {
      autoDisplayEnabled: false,
      intervalMinutes: 25,
      translationId: "fra_lsg",
    };
    await set("settings", settings);
    expect(await get("settings")).toEqual(settings);
  });

  it("set transmet { clé: valeur } à chrome.storage.local.set", async () => {
    const bookIndex = { translationId: "fra_lsg", books: [], fetchedAt: 0 };
    await set("bookIndex", bookIndex);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ bookIndex });
  });

  it("permet de stocker et relire l'état pomodoro", async () => {
    const pomodoroState = {
      status: "focus",
      repetition: 1,
      running: true,
      phaseEndsAt: 2_000,
      phaseRemainingMs: null,
    };
    await set("pomodoroState", pomodoroState);
    expect(await get("pomodoroState")).toEqual(pomodoroState);
  });

  it("onChanged reçoit oldValue et newValue de la zone local", async () => {
    const listener = vi.fn();
    onChanged(listener);
    const first = { verse: null, startedAt: 1_000 };
    const second = { verse: null, startedAt: 2_000 };
    await set("currentCycle", first);
    await set("currentCycle", second);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({
      currentCycle: { oldValue: first, newValue: second },
    });
  });

  it("onChanged ignore les changements hors de la zone local", () => {
    const listener = vi.fn();
    onChanged(listener);
    mock.fireStorageChange({ settings: { newValue: {} } }, "sync");
    expect(listener).not.toHaveBeenCalled();
  });
});
