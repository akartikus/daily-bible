/**
 * English message catalog — the source of the `Messages` type. Every visible
 * or accessible UI string is added here first (contracts/i18n.md).
 */
export const en = {
  status: {
    focus: "Focus",
    break: "Break",
    longBreak: "Long break",
  },
  repetition: (current: number, total: number) =>
    `repetition ${current} / ${total}`,
  aria: {
    cycleProgress: "Pomodoro cycle progress",
    pause: "Pause",
    resume: "Resume",
    next: "Next focus",
    settings: "Settings",
    retry: "Try again",
  },
  loading: "Loading…",
  settings: {
    backToVerse: "Back to verse",
    autoDisplay: "Automatic display",
    interval: "Interval (minutes)",
    focus: "Focus (minutes)",
    break: "Break (minutes)",
    longBreak: "Long break (minutes)",
    repetitions: "Repetitions before long break",
  },
  errors: {
    minutesRange: "Enter a whole number between 1 and 1440.",
    repetitionsRange: "Enter a whole number between 1 and 10.",
    unexpected: "An unexpected error occurred. Try again.",
    bibleUnavailable:
      "Verses unavailable. Check your connection and try again.",
  },
  store: {
    loadError: "Could not load the pomodoro state",
    pauseError: "Could not pause",
    resumeError: "Could not resume",
    nextError: "Could not start the next focus",
  },
};

export type Messages = typeof en;
