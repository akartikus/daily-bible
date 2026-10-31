import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  readSettings,
  type Settings,
} from "../../src/shared/settings/defaults";
import {
  isValidIntervalMinutes,
  isValidPomodoroMinutes,
  isValidRepetitionCount,
} from "../../src/shared/settings/validate";

describe("DEFAULT_SETTINGS (défauts — data-model.md)", () => {
  it("désactive l'affichage automatique (opt-in explicite — FR-003)", () => {
    expect(DEFAULT_SETTINGS.autoDisplayEnabled).toBe(false);
  });

  it("fixe l'intervalle à 25 minutes (FR-004)", () => {
    expect(DEFAULT_SETTINGS.intervalMinutes).toBe(25);
  });

  it("fixe les durées pomodoro à 25 / 5 / 15 minutes et X à 4", () => {
    expect(DEFAULT_SETTINGS.focusMinutes).toBe(25);
    expect(DEFAULT_SETTINGS.breakMinutes).toBe(5);
    expect(DEFAULT_SETTINGS.longBreakMinutes).toBe(15);
    expect(DEFAULT_SETTINGS.repetitionsBeforeLongBreak).toBe(4);
  });
});

describe("readSettings (migration des réglages 001)", () => {
  it("complète les réglages 001 avec les défauts pomodoro", () => {
    expect(
      readSettings({
        autoDisplayEnabled: true,
        intervalMinutes: 10,
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      autoDisplayEnabled: true,
      intervalMinutes: 10,
    });
  });

  it("ignore la clé orpheline translationId des installations 001/002 (migration invisible)", () => {
    const legacy = {
      autoDisplayEnabled: true,
      intervalMinutes: 10,
      translationId: "fra_lsg",
    } as Partial<Settings> & { translationId: string };
    expect(readSettings(legacy)).toEqual({
      ...DEFAULT_SETTINGS,
      autoDisplayEnabled: true,
      intervalMinutes: 10,
    });
  });

  it("conserve les valeurs pomodoro déjà stockées", () => {
    expect(
      readSettings({
        focusMinutes: 40,
        breakMinutes: 8,
        longBreakMinutes: 20,
        repetitionsBeforeLongBreak: 3,
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      focusMinutes: 40,
      breakMinutes: 8,
      longBreakMinutes: 20,
      repetitionsBeforeLongBreak: 3,
    });
  });
});

describe("isValidPomodoroMinutes (entier, 1 ≤ x ≤ 1440)", () => {
  it("accepte les bornes et les valeurs entières", () => {
    expect(isValidPomodoroMinutes(1)).toBe(true);
    expect(isValidPomodoroMinutes(1440)).toBe(true);
    expect(isValidPomodoroMinutes(25)).toBe(true);
  });

  it("refuse les valeurs invalides", () => {
    expect(isValidPomodoroMinutes(0)).toBe(false);
    expect(isValidPomodoroMinutes(-1)).toBe(false);
    expect(isValidPomodoroMinutes(1441)).toBe(false);
    expect(isValidPomodoroMinutes(25.5)).toBe(false);
    expect(isValidPomodoroMinutes(NaN)).toBe(false);
  });
});

describe("isValidRepetitionCount (entier, 1 ≤ x ≤ 10)", () => {
  it("accepte les bornes et les valeurs entières", () => {
    expect(isValidRepetitionCount(1)).toBe(true);
    expect(isValidRepetitionCount(10)).toBe(true);
    expect(isValidRepetitionCount(4)).toBe(true);
  });

  it("refuse les valeurs invalides", () => {
    expect(isValidRepetitionCount(0)).toBe(false);
    expect(isValidRepetitionCount(-1)).toBe(false);
    expect(isValidRepetitionCount(11)).toBe(false);
    expect(isValidRepetitionCount(4.5)).toBe(false);
    expect(isValidRepetitionCount(NaN)).toBe(false);
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
