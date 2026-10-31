<script lang="ts">
  import { onMount } from "svelte";
  import { Settings, Undo2 } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import ErrorView from "./components/ErrorView.svelte";
  import SettingsView from "./components/SettingsView.svelte";
  import VerseView from "./components/VerseView.svelte";
  import PomodoroStatus from "./components/PomodoroStatus.svelte";
  import PomodoroStatusHeader from "./components/PomodoroStatusHeader.svelte";
  import { getMessages, resolveUiLocale } from "../shared/i18n";
  import { SettingsStore } from "./lib/settings.svelte.ts";
  import { VerseStore } from "./lib/verse.svelte.ts";
  import { pomodoroStore } from "./lib/pomodoro.svelte.ts";

  // Locale résolue une seule fois par ouverture : un changement de langue du
  // navigateur s'applique à la prochaine ouverture (contracts/i18n.md).
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));

  const store = new VerseStore();
  const settingsStore = new SettingsStore();
  const verse = $derived(store.verse);
  const error = $derived(store.error);

  // FR-007/SC-003 : verset ≤ 1 interaction, réglages ≤ 2 (engrenage).
  let view = $state<"verse" | "settings">("verse");

  onMount(() => {
    void store.load();
    store.observe();
    void settingsStore.load();
    settingsStore.observe();
    void pomodoroStore.load();
    pomodoroStore.observe();
  });
</script>

<!-- Popup à taille fixe 400×400 (retour utilisateur) : en-têtes et pied
     fixes, la zone du verset défile et occupe la plus grande part. -->
<div class="flex h-[400px] w-[400px] flex-col">
  <header class="flex h-9 shrink-0 items-center justify-end px-1">
    {#if view === "verse"}
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full"
        aria-label={messages.aria.settings}
        title={messages.aria.settings}
        onclick={() => (view = "settings")}
      >
        <Settings />
      </Button>
    {:else}
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full"
        aria-label={messages.settings.backToVerse}
        title={messages.settings.backToVerse}
        onclick={() => (view = "verse")}
      >
        <Undo2 />
      </Button>
    {/if}
  </header>

  {#if view === "settings"}
    <SettingsView
      settings={settingsStore.settings}
      onChange={(settings) => void settingsStore.update(settings)}
    />
  {:else}
    <!-- FR-002 : le statut pomodoro reste visible en toutes circonstances,
         en en-tête au-dessus du verset (retour utilisateur). -->
    <PomodoroStatusHeader />
    <!-- Conteneur du verset défilant : la plus grande part de la fenêtre. -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      {#if verse}
        <VerseView {verse} />
      {:else if error}
        <ErrorView message={error} onRetry={() => void store.load()} />
      {:else}
        <div class="flex h-full items-center justify-center">
          <p class="text-lg text-muted-foreground">{messages.loading}</p>
        </div>
      {/if}
    </div>
    <!-- FR-002 : le statut pomodoro reste visible en toutes circonstances,
         en pied de fenêtre (footer). -->
    <PomodoroStatus
      repetitions={settingsStore.settings.repetitionsBeforeLongBreak}
    />
  {/if}
</div>
