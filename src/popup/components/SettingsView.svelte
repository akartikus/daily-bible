<script lang="ts">
  import type { Settings } from "../../shared/settings/defaults";
  import { getMessages, resolveUiLocale } from "../../shared/i18n";
  import {
    isValidIntervalMinutes,
    isValidPomodoroMinutes,
    isValidRepetitionCount,
  } from "../../shared/settings/validate";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";

  interface Props {
    settings: Settings;
    onChange: (settings: Settings) => void;
  }

  let { settings, onChange }: Props = $props();

  // Locale résolue une seule fois par ouverture (contracts/i18n.md).
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));

  // Version de l'extension pour le pied de page (manifest, retours 003).
  const version = chrome.runtime.getManifest().version;

  type NumberField =
    | "intervalMinutes"
    | "focusMinutes"
    | "breakMinutes"
    | "longBreakMinutes"
    | "repetitionsBeforeLongBreak";

  function toDisplayValues(settings: Settings): Record<NumberField, string> {
    return {
      intervalMinutes: String(settings.intervalMinutes),
      focusMinutes: String(settings.focusMinutes),
      breakMinutes: String(settings.breakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
      repetitionsBeforeLongBreak: String(settings.repetitionsBeforeLongBreak),
    };
  }

  // Valeurs affichées : $derived inscriptibles, chaînés sur les réglages —
  // suivent le chargement asynchrone (App.svelte) ; une saisie refusée
  // surcharge `values` avec la dernière valeur valide, ce qui revertit chaque
  // champ via son bind (le composant Input écrase tout reset impératif du
  // DOM, la reprise passe donc par l'état).
  let values = $derived(toDisplayValues(settings));
  let interval = $derived(values.intervalMinutes);
  let focus = $derived(values.focusMinutes);
  let breakMinutes = $derived(values.breakMinutes);
  let longBreak = $derived(values.longBreakMinutes);
  let repetitions = $derived(values.repetitionsBeforeLongBreak);

  let errors = $state<Record<string, string>>({});

  function handleAutoDisplay(checked: boolean): void {
    onChange({ ...settings, autoDisplayEnabled: checked });
  }

  // FR-011 : saisie invalide refusée avec message, dernière valeur valide
  // conservée.
  function handleNumber(
    event: Event,
    field: NumberField,
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
      values = toDisplayValues(settings);
    }
  }
</script>

<!-- FR-008/FR-009 : chaque réglage est une ligne de grille partagée
     grid-cols-[1fr_auto] items-center — Label à gauche, champ à droite ;
     l'erreur traduite s'affiche sous le champ concerné (colonne 2), sans
     décaler la grille des lignes suivantes. La zone défile si le contenu
     dépasse (popup à hauteur fixe). -->
<div class="flex min-h-0 flex-1 flex-col">
  <main class="flex-1 overflow-y-auto p-6 text-left">
    <div class="flex flex-col gap-2">
      <div class="grid grid-cols-[1fr_auto] items-center gap-2">
        <Label for="settings-auto-display"
          >{messages.settings.autoDisplay}</Label
        >
        <Switch
          id="settings-auto-display"
          checked={settings.autoDisplayEnabled}
          onCheckedChange={handleAutoDisplay}
        />
      </div>
      <div class="grid grid-cols-[1fr_auto] items-center gap-2">
        <Label for="settings-interval">{messages.settings.interval}</Label>
        <div>
          <Input
            id="settings-interval"
            type="number"
            min="1"
            max="1440"
            bind:value={interval}
            class="w-12 pl-2 pr-1 text-right"
            oninput={(event) =>
              handleNumber(
                event,
                "intervalMinutes",
                isValidIntervalMinutes,
                messages.errors.minutesRange,
              )}
          />
          {#if errors.intervalMinutes}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {errors.intervalMinutes}
            </p>
          {/if}
        </div>
      </div>
      <div class="grid grid-cols-[1fr_auto] items-center gap-2">
        <Label for="settings-focus">{messages.settings.focus}</Label>
        <div>
          <Input
            id="settings-focus"
            type="number"
            min="1"
            max="1440"
            bind:value={focus}
            class="w-12 pl-2 pr-1 text-right"
            oninput={(event) =>
              handleNumber(
                event,
                "focusMinutes",
                isValidPomodoroMinutes,
                messages.errors.minutesRange,
              )}
          />
          {#if errors.focusMinutes}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {errors.focusMinutes}
            </p>
          {/if}
        </div>
      </div>
      <div class="grid grid-cols-[1fr_auto] items-center gap-2">
        <Label for="settings-break">{messages.settings.break}</Label>
        <div>
          <Input
            id="settings-break"
            type="number"
            min="1"
            max="1440"
            bind:value={breakMinutes}
            class="w-12 pl-2 pr-1 text-right"
            oninput={(event) =>
              handleNumber(
                event,
                "breakMinutes",
                isValidPomodoroMinutes,
                messages.errors.minutesRange,
              )}
          />
          {#if errors.breakMinutes}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {errors.breakMinutes}
            </p>
          {/if}
        </div>
      </div>
      <div class="grid grid-cols-[1fr_auto] items-center gap-2">
        <Label for="settings-long-break">{messages.settings.longBreak}</Label>
        <div>
          <Input
            id="settings-long-break"
            type="number"
            min="1"
            max="1440"
            bind:value={longBreak}
            class="w-12 pl-2 pr-1 text-right"
            oninput={(event) =>
              handleNumber(
                event,
                "longBreakMinutes",
                isValidPomodoroMinutes,
                messages.errors.minutesRange,
              )}
          />
          {#if errors.longBreakMinutes}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {errors.longBreakMinutes}
            </p>
          {/if}
        </div>
      </div>
      <div class="grid grid-cols-[1fr_auto] items-center gap-2">
        <Label for="settings-repetitions">{messages.settings.repetitions}</Label
        >
        <div>
          <Input
            id="settings-repetitions"
            type="number"
            min="1"
            max="10"
            bind:value={repetitions}
            class="w-12 pl-2 pr-1 text-right"
            oninput={(event) =>
              handleNumber(
                event,
                "repetitionsBeforeLongBreak",
                isValidRepetitionCount,
                messages.errors.repetitionsRange,
              )}
          />
          {#if errors.repetitionsBeforeLongBreak}
            <p class="mt-1 text-xs text-destructive" role="alert">
              {errors.repetitionsBeforeLongBreak}
            </p>
          {/if}
        </div>
      </div>
    </div>
  </main>
  <!-- Pied de page : copyright et version de l'extension (retour 003). -->
  <footer
    class="border-t border-border px-6 py-2.5 text-center text-xs text-muted-foreground"
  >
    ©
    <a
      class="underline-offset-2 hover:text-foreground hover:underline"
      href="https://sitraka.dev"
      target="_blank"
      rel="noreferrer">sitraka.dev</a
    >
    <span class="mx-1">·</span>v{version}
  </footer>
</div>
