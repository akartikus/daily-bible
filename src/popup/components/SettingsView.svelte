<script lang="ts">
  import type { Settings } from "../../shared/settings/defaults";
  import {
    isValidIntervalMinutes,
    isValidPomodoroMinutes,
    isValidRepetitionCount,
  } from "../../shared/settings/validate";

  interface Props {
    settings: Settings;
    onChange: (settings: Settings) => void;
  }

  let { settings, onChange }: Props = $props();

  const MINUTES_ERROR_MESSAGE = "Entrez un nombre entier entre 1 et 1440.";
  const REPETITIONS_ERROR_MESSAGE = "Entrez un nombre entier entre 1 et 10.";

  let errors = $state<Record<string, string>>({});

  function handleAutoDisplay(event: Event): void {
    const toggle = event.currentTarget as HTMLInputElement;
    onChange({ ...settings, autoDisplayEnabled: toggle.checked });
  }

  // FR-011 : saisie invalide refusée avec message, dernière valeur valide
  // conservée.
  function handleNumber(
    event: Event,
    field: keyof Pick<
      Settings,
      | "intervalMinutes"
      | "focusMinutes"
      | "breakMinutes"
      | "longBreakMinutes"
      | "repetitionsBeforeLongBreak"
    >,
    isValid: (value: number) => boolean,
    errorMessage: string,
  ): void {
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (isValid(value)) {
      delete errors[field];
      const next: Settings = { ...settings };
      next[field] = value;
      onChange(next);
    } else {
      errors[field] = errorMessage;
      input.value = String(settings[field]);
    }
  }
</script>

<main
  class="flex min-h-64 w-80 flex-col items-center justify-center gap-4 p-4 text-center"
>
  <label class="flex items-center gap-2">
    <input
      type="checkbox"
      checked={settings.autoDisplayEnabled}
      onchange={handleAutoDisplay}
    />
    Affichage automatique
  </label>
  <label class="flex flex-col items-center gap-1">
    Intervalle (minutes)
    <input
      type="number"
      min="1"
      max="1440"
      value={settings.intervalMinutes}
      oninput={(event) =>
        handleNumber(
          event,
          "intervalMinutes",
          isValidIntervalMinutes,
          MINUTES_ERROR_MESSAGE,
        )}
    />
    {#if errors.intervalMinutes}
      <span class="text-xs text-red-500" role="alert"
        >{errors.intervalMinutes}</span
      >
    {/if}
  </label>
  <label class="flex flex-col items-center gap-1">
    Focus (minutes)
    <input
      type="number"
      min="1"
      max="1440"
      value={settings.focusMinutes}
      oninput={(event) =>
        handleNumber(
          event,
          "focusMinutes",
          isValidPomodoroMinutes,
          MINUTES_ERROR_MESSAGE,
        )}
    />
    {#if errors.focusMinutes}
      <span class="text-xs text-red-500" role="alert"
        >{errors.focusMinutes}</span
      >
    {/if}
  </label>
  <label class="flex flex-col items-center gap-1">
    Pause (minutes)
    <input
      type="number"
      min="1"
      max="1440"
      value={settings.breakMinutes}
      oninput={(event) =>
        handleNumber(
          event,
          "breakMinutes",
          isValidPomodoroMinutes,
          MINUTES_ERROR_MESSAGE,
        )}
    />
    {#if errors.breakMinutes}
      <span class="text-xs text-red-500" role="alert"
        >{errors.breakMinutes}</span
      >
    {/if}
  </label>
  <label class="flex flex-col items-center gap-1">
    Longue pause (minutes)
    <input
      type="number"
      min="1"
      max="1440"
      value={settings.longBreakMinutes}
      oninput={(event) =>
        handleNumber(
          event,
          "longBreakMinutes",
          isValidPomodoroMinutes,
          MINUTES_ERROR_MESSAGE,
        )}
    />
    {#if errors.longBreakMinutes}
      <span class="text-xs text-red-500" role="alert"
        >{errors.longBreakMinutes}</span
      >
    {/if}
  </label>
  <label class="flex flex-col items-center gap-1">
    Répétitions avant longue pause
    <input
      type="number"
      min="1"
      max="10"
      value={settings.repetitionsBeforeLongBreak}
      oninput={(event) =>
        handleNumber(
          event,
          "repetitionsBeforeLongBreak",
          isValidRepetitionCount,
          REPETITIONS_ERROR_MESSAGE,
        )}
    />
    {#if errors.repetitionsBeforeLongBreak}
      <span class="text-xs text-red-500" role="alert"
        >{errors.repetitionsBeforeLongBreak}</span
      >
    {/if}
  </label>
</main>
