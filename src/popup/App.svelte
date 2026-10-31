<script lang="ts">
  import { onMount } from "svelte";
  import ErrorView from "./components/ErrorView.svelte";
  import SettingsView from "./components/SettingsView.svelte";
  import VerseView from "./components/VerseView.svelte";
  import PomodoroStatus from "./components/PomodoroStatus.svelte";
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

<div class="w-80">
  <header class="flex h-9 items-center justify-end px-1">
    {#if view === "verse"}
      <button
        type="button"
        class="rounded px-2 text-gray-400 hover:text-gray-600"
        aria-label={messages.aria.settings}
        title={messages.aria.settings}
        onclick={() => (view = "settings")}
      >
        ⚙
      </button>
    {:else}
      <button
        type="button"
        class="rounded px-2 text-sm text-blue-600"
        onclick={() => (view = "verse")}
      >
        {messages.settings.backToVerse}
      </button>
    {/if}
  </header>

  {#if view === "settings"}
    <SettingsView
      settings={settingsStore.settings}
      onChange={(settings) => void settingsStore.update(settings)}
    />
  {:else}
    <!-- FR-002 : le statut pomodoro reste visible en toutes circonstances
         dans la vue verset (contracts/ui-behavior.md). -->
    <PomodoroStatus
      repetitions={settingsStore.settings.repetitionsBeforeLongBreak}
    />
    {#if verse}
      <VerseView {verse} />
    {:else if error}
      <ErrorView message={error} onRetry={() => void store.load()} />
    {:else}
      <main class="flex h-64 w-80 items-center justify-center">
        <p class="text-lg">{messages.loading}</p>
      </main>
    {/if}
  {/if}
</div>
