import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../src/shared/settings/defaults";
import { isValidIntervalMinutes } from "../../src/shared/settings/validate";

describe("DEFAULT_SETTINGS (défauts — data-model.md)", () => {
  it("désactive l'affichage automatique (opt-in explicite — FR-003)", () => {
    expect(DEFAULT_SETTINGS.autoDisplayEnabled).toBe(false);
  });

  it("fixe l'intervalle à 25 minutes (FR-004)", () => {
    expect(DEFAULT_SETTINGS.intervalMinutes).toBe(25);
  });

  it("fixe la traduction à fra_lsg (v1, non exposée dans l'UI)", () => {
    expect(DEFAULT_SETTINGS.translationId).toBe("fra_lsg");
  });
});

describe("isValidIntervalMinutes (entier, 1 ≤ x ≤ 1440 — FR-004/FR-008)", () => {
  it("accepte les bornes 1 et 1440", () => {
    expect(isValidIntervalMinutes(1)).toBe(true);
    expect(isValidIntervalMinutes(1440)).toBe(true);
  });

  it("accepte les valeurs entières intermédiaires", () => {
    expect(isValidIntervalMinutes(25)).toBe(true);
    expect(isValidIntervalMinutes(60)).toBe(true);
  });

  it("refuse 0", () => {
    expect(isValidIntervalMinutes(0)).toBe(false);
  });

  it("refuse les valeurs négatives", () => {
    expect(isValidIntervalMinutes(-1)).toBe(false);
    expect(isValidIntervalMinutes(-25)).toBe(false);
  });

  it("refuse les valeurs supérieures à 1440", () => {
    expect(isValidIntervalMinutes(1441)).toBe(false);
    expect(isValidIntervalMinutes(1500)).toBe(false);
  });

  it("refuse les valeurs non entières", () => {
    expect(isValidIntervalMinutes(0.5)).toBe(false);
    expect(isValidIntervalMinutes(25.5)).toBe(false);
  });

  it("refuse les valeurs non numériques", () => {
    expect(isValidIntervalMinutes(NaN)).toBe(false);
    expect(isValidIntervalMinutes(Infinity)).toBe(false);
  });
});
