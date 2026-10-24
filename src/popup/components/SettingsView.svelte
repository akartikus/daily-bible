<script lang="ts">
  import type { Settings } from "../../shared/settings/defaults";
  import { isValidIntervalMinutes } from "../../shared/settings/validate";

  interface Props {
    settings: Settings;
    onChange: (settings: Settings) => void;
  }

  let { settings, onChange }: Props = $props();

  const INTERVAL_ERROR_MESSAGE = "Entrez un nombre entier entre 1 et 1440.";

  let intervalError = $state<string | null>(null);

  function handleAutoDisplay(event: Event): void {
    const toggle = event.currentTarget as HTMLInputElement;
    onChange({ ...settings, autoDisplayEnabled: toggle.checked });
  }

  function handleInterval(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (isValidIntervalMinutes(value)) {
      intervalError = null;
      onChange({ ...settings, intervalMinutes: value });
    } else {
      // FR-008 : saisie invalide refusée avec message, dernière valeur
      // valide conservée.
      intervalError = INTERVAL_ERROR_MESSAGE;
      input.value = String(settings.intervalMinutes);
    }
  }
</script>

<main
  class="flex h-64 w-80 flex-col items-center justify-center gap-4 p-4 text-center"
>
  <label class="flex items-center gap-2" for="auto-display">
    <input
      id="auto-display"
      type="checkbox"
      checked={settings.autoDisplayEnabled}
      onchange={handleAutoDisplay}
      class="size-4"
    />
    <span>Affichage automatique</span>
  </label>

  <label class="flex items-center gap-2" for="interval">
    <span>Intervalle (minutes)</span>
    <input
      id="interval"
      type="number"
      min="1"
      max="1440"
      step="1"
      value={settings.intervalMinutes}
      oninput={handleInterval}
      class="w-20 rounded border border-gray-300 px-2 py-1"
    />
  </label>

  {#if intervalError}
    <p role="alert" class="text-sm text-red-600">{intervalError}</p>
  {/if}
</main>
