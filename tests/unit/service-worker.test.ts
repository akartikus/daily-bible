import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { sendMessage } from "../../src/shared/chrome/runtime";
import { get, set } from "../../src/shared/chrome/storage";
import {
  ALARM_NAME,
  POMODORO_ALARM_NAME,
} from "../../src/shared/chrome/alarms";
import type { Verse } from "../../src/shared/bible/extract";
import type { EnsureCurrentVerseResponse } from "../../src/background/service-worker";

const TRANSLATION_ID = "fra_lsg";
const API_ERROR_MESSAGE =
  "Versets indisponibles. Vérifiez votre connexion et réessayez.";

function booksPayload(translationId: string = TRANSLATION_ID) {
  return {
    translation: { id: translationId, name: "Louis Segond 1910" },
    books: [
      {
        id: "GEN",
        commonName: "Genèse",
        numberOfChapters: 50,
        totalNumberOfVerses: 100,
      },
      {
        id: "EXO",
        commonName: "Exode",
        numberOfChapters: 40,
        totalNumberOfVerses: 300,
      },
    ],
  };
}

function chapterPayload(
  translationId: string = TRANSLATION_ID,
  bookName: string = "Genèse",
) {
  return {
    translation: { id: translationId },
    book: { id: "GEN", commonName: bookName },
    numberOfVerses: 2,
    chapter: {
      number: 6,
      content: [
        {
          type: "verse",
          number: 1,
          content: ["Au commencement, Dieu créa les cieux et la terre."],
        },
        {
          type: "verse",
          number: 2,
          content: ["La terre était informe et vide."],
        },
      ],
    },
  };
}

function jsonResponse(body: unknown) {
  return { status: 200, json: async () => body };
}

const existingVerse: Verse = {
  bookId: "PSA",
  bookName: "Psaumes",
  chapterNumber: 23,
  verseNumber: 1,
  text: "L'Éternel est mon berger.",
  translationId: TRANSLATION_ID,
  translationName: "Louis Segond 1910",
  fetchedAt: 1_000,
};

describe("service-worker : orchestration « ensure-current-verse » (T014)", () => {
  let mock: ChromeMock;

  beforeEach(async () => {
    // Ré-importe le module à chaque test : son listener s'enregistre sur le
    // mock courant (vi.resetModules vide le registre entre deux tests).
    vi.resetModules();
    mock = createChromeMock();
    // Interface française par défaut : les tirages partent sur fra_lsg.
    mock.setUiLanguage("fr");
    vi.stubGlobal("chrome", mock.chrome);
    await import("../../src/background/service-worker");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("premier appel : tire un verset, écrit currentCycle et répond le verset", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith("/books.json")) return jsonResponse(booksPayload());
      if (path.endsWith("/GEN/6.json")) return jsonResponse(chapterPayload());
      throw new Error(`URL inattendue : ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({
      verse: {
        bookId: "GEN",
        bookName: "Genèse",
        chapterNumber: 6,
        verseNumber: 1,
        text: "Au commencement, Dieu créa les cieux et la terre.",
        translationId: TRANSLATION_ID,
        translationName: "Louis Segond 1910",
        fetchedAt: expect.any(Number),
      },
    });
    expect(await get("currentCycle")).toEqual({
      verse: (response as { verse: Verse }).verse,
      startedAt: expect.any(Number),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("interface anglaise : le tirage suit la langue (eng_kjv / King James Version — FR-001)", async () => {
    mock.setUiLanguage("en-US");
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith("/books.json"))
        return jsonResponse(booksPayload("eng_kjv"));
      if (path.endsWith("/GEN/6.json"))
        return jsonResponse(chapterPayload("eng_kjv", "Genesis"));
      throw new Error(`URL inattendue : ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://bible.helloao.org/api/eng_kjv/books.json",
    );
    expect(response).toEqual({
      verse: expect.objectContaining({
        bookId: "GEN",
        bookName: "Genesis",
        chapterNumber: 6,
        verseNumber: 1,
        translationId: "eng_kjv",
        translationName: "King James Version",
      }),
    });
  });

  it("verset en cours : réaffiche sans consommer de tirage (FR-002)", async () => {
    await set("currentCycle", { verse: existingVerse, startedAt: 1_000 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({ verse: existingVerse });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await get("currentCycle")).toEqual({
      verse: existingVerse,
      startedAt: 1_000,
    });
  });

  it("API indisponible : répond { error } sans écrire currentCycle (FR-011)", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({ error: API_ERROR_MESSAGE });
    expect(await get("currentCycle")).toBeUndefined();
  });

  it("API indisponible en interface anglaise : message traduit (FR-002)", async () => {
    mock.setUiLanguage("en-GB");
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await sendMessage<EnsureCurrentVerseResponse>({
      type: "ensure-current-verse",
    });

    expect(response).toEqual({
      error: "Verses unavailable. Check your connection and try again.",
    });
  });

  it("message inconnu : aucune réponse (canal fermé sans sendResponse)", async () => {
    const response = await sendMessage<unknown>({ type: "autre-message" });
    expect(response).toBeUndefined();
  });
});

/** Laisse s'exécuter les promesses lancées par les listeners du service worker. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const enabledSettings = {
  autoDisplayEnabled: true,
  intervalMinutes: 25,
};

describe("service-worker : pomodoro automatique (T024)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    vi.resetModules();
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Importé après l'arrangement éventuel du stockage : les listeners du
  // service worker ne doivent pas réagir à des écritures antérieures.
  async function importServiceWorker(): Promise<void> {
    await import("../../src/background/service-worker");
  }

  function stubFetchSuccess(): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith("/books.json")) return jsonResponse(booksPayload());
      if (path.endsWith("/GEN/6.json")) return jsonResponse(chapterPayload());
      throw new Error(`URL inattendue : ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  function stubFetchFailure(): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("onStartup garantit l'alarme si l'affichage auto est activé", async () => {
    await set("settings", enabledSettings);
    await importServiceWorker();
    mock.fireStartup();
    await vi.waitFor(async () => {
      expect(await chrome.alarms.get(ALARM_NAME)).toEqual({
        name: ALARM_NAME,
        periodInMinutes: 25,
      });
    });
  });

  it("onInstalled garantit aussi l'alarme", async () => {
    await set("settings", enabledSettings);
    await importServiceWorker();
    mock.fireInstalled();
    await vi.waitFor(async () => {
      expect(await chrome.alarms.get(ALARM_NAME)).toEqual({
        name: ALARM_NAME,
        periodInMinutes: 25,
      });
    });
  });

  it("onStartup ne crée rien si l'affichage auto est désactivé (défauts)", async () => {
    await importServiceWorker();
    mock.fireStartup();
    await flush();
    // Le pomodoro crée son alarme au démarrage, mais pas l'alarme verse-interval
    expect(chrome.alarms.create).toHaveBeenCalledTimes(1);
    expect(chrome.alarms.create).toHaveBeenCalledWith(
      POMODORO_ALARM_NAME,
      expect.any(Object),
    );
    const verseAlarm = await mock.chrome.alarms.get(ALARM_NAME);
    expect(verseAlarm).toBeUndefined();
  });

  it("onStartup ne recrée pas une alarme déjà présente (rythme fixe)", async () => {
    await set("settings", enabledSettings);
    await import("../../src/shared/chrome/alarms").then((m) =>
      m.createVerseIntervalAlarm(25),
    );
    await importServiceWorker();
    mock.fireStartup();
    await flush();
    // Une création manuelle (verse-interval) + une création pomodoro (pomodoro-phase)
    // L'alarme verse-interval existante n'est pas recréée
    expect(chrome.alarms.create).toHaveBeenCalledTimes(2);
    const verseAlarm = await mock.chrome.alarms.get(ALARM_NAME);
    expect(verseAlarm).toEqual({
      name: ALARM_NAME,
      periodInMinutes: 25,
    });
  });

  it("activation des réglages crée l'alarme avec l'intervalle choisi", async () => {
    await importServiceWorker();
    await set("settings", { ...enabledSettings, intervalMinutes: 10 });
    await vi.waitFor(async () => {
      expect(await chrome.alarms.get(ALARM_NAME)).toEqual({
        name: ALARM_NAME,
        periodInMinutes: 10,
      });
    });
  });

  it("changement d'intervalle recrée l'alarme", async () => {
    await set("settings", { ...enabledSettings, intervalMinutes: 10 });
    await importServiceWorker();
    await set("settings", { ...enabledSettings, intervalMinutes: 30 });
    await vi.waitFor(async () => {
      expect(await chrome.alarms.get(ALARM_NAME)).toEqual({
        name: ALARM_NAME,
        periodInMinutes: 30,
      });
    });
  });

  it("désactivation supprime l'alarme", async () => {
    await importServiceWorker();
    await set("settings", enabledSettings);
    await set("settings", { ...enabledSettings, autoDisplayEnabled: false });
    await vi.waitFor(async () => {
      expect(await chrome.alarms.get(ALARM_NAME)).toBeUndefined();
    });
  });

  it("changement de stockage hors settings est ignoré", async () => {
    await importServiceWorker();
    await set("currentCycle", { verse: null, startedAt: 1_000 });
    await flush();
    expect(chrome.alarms.create).not.toHaveBeenCalled();
    expect(chrome.alarms.clear).not.toHaveBeenCalled();
  });

  it("échéance : openPopup puis nouveau verset écrit dans currentCycle", async () => {
    await set("currentCycle", { verse: existingVerse, startedAt: 1_000 });
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    stubFetchSuccess();
    await importServiceWorker();
    mock.fireAlarm(ALARM_NAME);
    await vi.waitFor(async () => {
      const cycle = await get<{ verse: Verse; startedAt: number }>(
        "currentCycle",
      );
      expect(cycle?.verse).toMatchObject({
        bookId: "GEN",
        chapterNumber: 6,
        verseNumber: 1,
      });
      expect(cycle?.startedAt).toBeGreaterThan(1_000);
    });
    expect(chrome.action.openPopup).toHaveBeenCalledTimes(1);
  });

  it("échec d'openPopup : le tirage a lieu quand même (non bloquant)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    stubFetchSuccess();
    await importServiceWorker();
    vi.mocked(chrome.action.openPopup).mockRejectedValueOnce(
      new Error("popup déjà ouvert"),
    );
    mock.fireAlarm(ALARM_NAME);
    await vi.waitFor(async () => {
      const cycle = await get<{ verse: Verse }>("currentCycle");
      expect(cycle?.verse).toMatchObject({ bookId: "GEN", verseNumber: 1 });
    });
  });

  it("échec du tirage : l'ancien verset reste (dégradation gracieuse FR-011)", async () => {
    await set("currentCycle", { verse: existingVerse, startedAt: 1_000 });
    stubFetchFailure();
    await importServiceWorker();
    mock.fireAlarm(ALARM_NAME);
    await flush();
    expect(await get("currentCycle")).toEqual({
      verse: existingVerse,
      startedAt: 1_000,
    });
    expect(chrome.action.openPopup).toHaveBeenCalledTimes(1);
  });

  it("échec du tirage sans verset en cours : currentCycle reste absent (ErrorView au popup)", async () => {
    stubFetchFailure();
    await importServiceWorker();
    mock.fireAlarm(ALARM_NAME);
    await flush();
    expect(await get("currentCycle")).toBeUndefined();
  });

  it("alarme étrangère ignorée", async () => {
    const fetchMock = stubFetchSuccess();
    await importServiceWorker();
    mock.fireAlarm("autre-alarme");
    await flush();
    expect(chrome.action.openPopup).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
