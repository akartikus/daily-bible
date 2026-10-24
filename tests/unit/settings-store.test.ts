import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { get, set } from "../../src/shared/chrome/storage";
import { DEFAULT_SETTINGS } from "../../src/shared/settings/defaults";
import { SettingsStore } from "../../src/popup/lib/settings.svelte.ts";

describe("store des réglages (T025 — contracts/storage-schema.md)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("load : réglages absents → défauts appliqués, sans écriture (SC-002)", async () => {
    const store = new SettingsStore();

    await store.load();

    expect(store.settings).toEqual(DEFAULT_SETTINGS);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("load : réglages présents → valeurs lues", async () => {
    const stored = {
      autoDisplayEnabled: true,
      intervalMinutes: 10,
      translationId: "fra_lsg",
    };
    await set("settings", stored);
    const store = new SettingsStore();

    await store.load();

    expect(store.settings).toEqual(stored);
  });

  it("update : écrit les réglages dans storage.local", async () => {
    const store = new SettingsStore();
    const next = {
      autoDisplayEnabled: true,
      intervalMinutes: 60,
      translationId: "fra_lsg",
    };

    await store.update(next);

    expect(await get("settings")).toEqual(next);
    expect(store.settings).toEqual(next);
  });

  it("observe : une écriture externe des réglages met à jour l'état", async () => {
    const store = new SettingsStore();
    store.observe();

    const next = {
      autoDisplayEnabled: true,
      intervalMinutes: 30,
      translationId: "fra_lsg",
    };
    await set("settings", next);

    expect(store.settings).toEqual(next);
  });

  it("observe : ignore les changements hors settings", async () => {
    const store = new SettingsStore();
    store.observe();

    await set("currentCycle", { verse: null, startedAt: 1_000 });

    expect(store.settings).toEqual(DEFAULT_SETTINGS);
  });
});
