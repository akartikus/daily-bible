import { describe, expect, it } from "vitest";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";
import { createChromeMock } from "../mocks/chrome";

describe("resolveUiLocale (résolution — contracts/i18n.md)", () => {
  it("reconnaît le français, insensible à la casse", () => {
    expect(resolveUiLocale("fr")).toBe("fr");
    expect(resolveUiLocale("FR")).toBe("fr");
  });

  it("reconnaît les variantes régionales du français", () => {
    expect(resolveUiLocale("fr-CA")).toBe("fr");
    expect(resolveUiLocale("fr-BE")).toBe("fr");
  });

  it("retombe sur l'anglais pour toute autre langue (FR-002)", () => {
    expect(resolveUiLocale("en")).toBe("en");
    expect(resolveUiLocale("en-US")).toBe("en");
    expect(resolveUiLocale("en-GB")).toBe("en");
    expect(resolveUiLocale("de")).toBe("en");
    expect(resolveUiLocale("es")).toBe("en");
  });

  it("retombe sur l'anglais quand la langue est absente (FR-002)", () => {
    expect(resolveUiLocale(undefined)).toBe("en");
  });
});

describe("getMessages (catalogue — contracts/i18n.md)", () => {
  it("sert le catalogue français en locale fr", () => {
    const messages = getMessages("fr");
    expect(messages.status.focus).toBe("Focus");
    expect(messages.status.longBreak).toBe("Longue pause");
    expect(messages.repetition(1, 4)).toBe("répétition 1 / 4");
    expect(messages.errors.minutesRange).toBe(
      "Entrez un nombre entier entre 1 et 1440.",
    );
  });

  it("sert le catalogue anglais en locale en", () => {
    const messages = getMessages("en");
    expect(messages.status.focus).toBe("Focus");
    expect(messages.status.longBreak).toBe("Long break");
    expect(messages.repetition(1, 4)).toBe("repetition 1 / 4");
    expect(messages.errors.minutesRange).toBe(
      "Enter a whole number between 1 and 1440.",
    );
  });
});

describe("mock chrome.i18n.getUILanguage (valeur pilotable)", () => {
  it("ramène la langue fixée par le test", () => {
    const mock = createChromeMock();
    mock.setUiLanguage("fr-CA");
    expect(mock.chrome.i18n.getUILanguage()).toBe("fr-CA");
    expect(resolveUiLocale(mock.chrome.i18n.getUILanguage())).toBe("fr");
  });

  it("est absente par défaut (fallback en)", () => {
    const mock = createChromeMock();
    expect(resolveUiLocale(mock.chrome.i18n.getUILanguage())).toBe("en");
  });
});
