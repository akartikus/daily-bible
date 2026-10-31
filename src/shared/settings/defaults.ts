/**
 * Default settings for the popup and pomodoro timer. Missing values are
 * filled from these defaults when reading existing installations.
 */

export interface Settings {
  autoDisplayEnabled: boolean;
  intervalMinutes: number;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  repetitionsBeforeLongBreak: number;
}

export const DEFAULT_SETTINGS: Settings = {
  autoDisplayEnabled: false,
  intervalMinutes: 25,
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  repetitionsBeforeLongBreak: 4,
};

/**
 * Fills missing settings with defaults for installations created before
 * pomodoro. Only known fields are rebuilt, so orphan keys from older installs
 * (e.g. the removed translationId) are ignored.
 */
export function readSettings(stored?: Partial<Settings>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...stored };
  return {
    autoDisplayEnabled: merged.autoDisplayEnabled,
    intervalMinutes: merged.intervalMinutes,
    focusMinutes: merged.focusMinutes,
    breakMinutes: merged.breakMinutes,
    longBreakMinutes: merged.longBreakMinutes,
    repetitionsBeforeLongBreak: merged.repetitionsBeforeLongBreak,
  };
}
