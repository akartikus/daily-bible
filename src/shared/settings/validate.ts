/**
 * Validation helpers for the existing interval and pomodoro duration limits.
 */

export function isValidIntervalMinutes(intervalMinutes: number): boolean {
  return (
    Number.isInteger(intervalMinutes) &&
    intervalMinutes >= 1 &&
    intervalMinutes <= 1440
  );
}

/** Validates a pomodoro duration: an integer from 1 to 1440 minutes. */
export function isValidPomodoroMinutes(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440;
}

/** Validates the repetition count: an integer from 1 to 10. */
export function isValidRepetitionCount(repetitions: number): boolean {
  return Number.isInteger(repetitions) && repetitions >= 1 && repetitions <= 10;
}
