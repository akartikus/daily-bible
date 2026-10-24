/**
 * Default settings for the popup and pomodoro timer. Missing values are
 * filled from these defaults when reading existing installations.
 */

export interface Settings {
  autoDisplayEnabled: boolean;
  intervalMinutes: number;
  translationId: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  repetitionsBeforeLongBreak: number;
}

export const DEFAULT_SETTINGS: Settings = {
  autoDisplayEnabled: false,
  intervalMinutes: 25,
  translationId: "fra_lsg",
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  repetitionsBeforeLongBreak: 4,
};

/** Fills missing settings with defaults for installations created before pomodoro. */
export function readSettings(stored?: Partial<Settings>): Settings {
  return { ...DEFAULT_SETTINGS, ...stored };
}
