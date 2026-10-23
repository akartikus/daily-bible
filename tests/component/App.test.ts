import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import { onMessage } from "../../src/shared/chrome/runtime";
import { set } from "../../src/shared/chrome/storage";
import type { Verse } from "../../src/shared/bible/extract";
import type { EnsureCurrentVerseResponse } from "../../src/background/service-worker";
import App from "../../src/popup/App.svelte";

const verse: Verse = {
  bookId: "GEN",
  bookName: "Genèse",
  chapterNumber: 1,
  verseNumber: 1,
  text: "Au commencement, Dieu créa les cieux et la terre.",
  translationId: "fra_lsg",
  translationName: "Louis Segond 1910",
  fetchedAt: 1_000,
};

describe("App (T018 — scénarios 1, 2 et 6 de quickstart.md)", () => {
  let mock: ChromeMock;

  beforeEach(() => {
    mock = createChromeMock();
    vi.stubGlobal("chrome", mock.chrome);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("scénario 2 : verset en cours → affiché immédiatement, sans nouveau tirage", async () => {
    await set("currentCycle", { verse, startedAt: 1_000 });

    render(App);

    expect(await screen.findByText(verse.text)).toBeTruthy();
    expect(screen.getByText("Genèse 1:1")).toBeTruthy();
    expect(screen.getByText("Louis Segond 1910")).toBeTruthy();
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("scénario 1 : installation fraîche → demande au service worker puis verset affiché", async () => {
    onMessage((_message, _sender, sendResponse) => {
      sendResponse({ verse });
    });

    render(App);

    expect(await screen.findByText(verse.text)).toBeTruthy();
    expect(screen.getByText("Genèse 1:1")).toBeTruthy();
    expect(screen.getByText("Louis Segond 1910")).toBeTruthy();
  });

  it("affiche un état de chargement pendant la demande", async () => {
    onMessage(() => true); // canal ouvert, jamais de réponse

    render(App);

    expect(await screen.findByText("Chargement…")).toBeTruthy();
  });

  it("scénario 6 : échec → ErrorView ; « Réessayer » relance la demande qui réussit", async () => {
    let response: EnsureCurrentVerseResponse = {
      error: "Versets indisponibles. Vérifiez votre connexion et réessayez.",
    };
    onMessage((_message, _sender, sendResponse) => {
      sendResponse(response);
    });

    render(App);
    expect(
      await screen.findByText(
        "Versets indisponibles. Vérifiez votre connexion et réessayez.",
      ),
    ).toBeTruthy();

    response = { verse };
    await fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText(verse.text)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
