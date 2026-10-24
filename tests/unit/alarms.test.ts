import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import {
  ALARM_NAME,
  clearVerseIntervalAlarm,
  createVerseIntervalAlarm,
  ensureVerseIntervalAlarm,
} from "../../src/shared/chrome/alarms";

describe("wrapper chrome.alarms (Alarm — data-model.md)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("nomme l'alarme « verse-interval »", () => {
    expect(ALARM_NAME).toBe("verse-interval");
  });

  it("create crée l'alarme avec periodInMinutes = intervalMinutes", async () => {
    await createVerseIntervalAlarm(25);
    expect(chrome.alarms.create).toHaveBeenCalledWith("verse-interval", {
      periodInMinutes: 25,
    });
    expect(await chrome.alarms.get("verse-interval")).toEqual({
      name: "verse-interval",
      periodInMinutes: 25,
    });
  });

  it("clear supprime l'alarme à la désactivation", async () => {
    await createVerseIntervalAlarm(25);
    await clearVerseIntervalAlarm();
    expect(chrome.alarms.clear).toHaveBeenCalledWith("verse-interval");
    expect(await chrome.alarms.get("verse-interval")).toBeUndefined();
  });

  it("ensure recrée l'alarme si absente au démarrage du service worker", async () => {
    await ensureVerseIntervalAlarm(25);
    expect(await chrome.alarms.get("verse-interval")).toEqual({
      name: "verse-interval",
      periodInMinutes: 25,
    });
  });

  it("ensure ne recrée pas une alarme déjà présente (rythme fixe conservé)", async () => {
    await createVerseIntervalAlarm(25);
    await ensureVerseIntervalAlarm(25);
    expect(chrome.alarms.create).toHaveBeenCalledTimes(1);
  });

  it("le mock propage l'échéance d'une alarme unique", async () => {
    const listener = vi.fn();
    chrome.alarms.onAlarm.addListener(listener);

    chrome.alarms.create("pomodoro-phase", { when: 1_000 });

    expect(await chrome.alarms.get("pomodoro-phase")).toEqual({
      name: "pomodoro-phase",
      when: 1_000,
    });
    expect(await chrome.alarms.getAll()).toEqual([
      { name: "pomodoro-phase", when: 1_000 },
    ]);
    mock.fireAlarm("pomodoro-phase");
    expect(listener).toHaveBeenCalledWith({
      name: "pomodoro-phase",
      when: 1_000,
    });
  });
});
