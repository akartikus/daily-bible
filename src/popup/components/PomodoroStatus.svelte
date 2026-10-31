<script lang="ts">
  import { getMessages, resolveUiLocale } from "../../shared/i18n";
  import { pomodoroStore } from "../lib/pomodoro.svelte.ts";

  interface Props {
    /** Nombre total de répétitions X (depuis les réglages) */
    repetitions: number;
  }

  let { repetitions }: Props = $props();

  // Accès au store via import (singleton)
  const store = pomodoroStore;

  // Locale résolue une seule fois par ouverture (contracts/i18n.md).
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));

  /** Largeur d'un segment de la barre de progression (en %) */
  const segmentWidth = $derived(repetitions > 0 ? 100 / repetitions : 0);

  /** Classes CSS pour un segment selon son état */
  function segmentClass(index: number): string {
    if (!store.state) return "bg-gray-200";
    const currentRep = store.currentRepetition;
    const isLongBreak = store.state?.status === "longBreak";

    if (isLongBreak) {
      return "bg-amber-500";
    }

    if (index < currentRep) {
      return "bg-green-500"; // répétitions accomplies
    }

    if (index === currentRep - 1) {
      return "bg-blue-500"; // répétition courante
    }

    return "bg-gray-200"; // répétitions futures
  }
</script>

<div class="p-3 space-y-2">
  <!-- Statut et progression -->
  <div class="space-y-1">
    <div class="flex items-center justify-between text-sm">
      <span class="font-medium text-gray-700">{store.statusLabel}</span>
      {#if store.state}
        <span class="text-xs text-gray-500">
          {messages.repetition(store.currentRepetition, repetitions)}
        </span>
      {/if}
    </div>

    <!-- Barre de progression à X segments -->
    <div
      class="h-2 bg-gray-100 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={store.currentRepetition}
      aria-valuemin={0}
      aria-valuemax={repetitions}
      aria-label={messages.aria.cycleProgress}
    >
      {#each Array.from({ length: repetitions }, (_, i) => i) as i (i)}
        <div
          class="h-full transition-all duration-300 {segmentClass(i)}"
          style="width: {segmentWidth}%"
        ></div>
      {/each}
    </div>
  </div>

  <!-- Contrôles : play/pause et next -->
  <div class="flex items-center gap-2">
    <!-- Play / Pause -->
    <button
      type="button"
      class="flex-1 py-2 px-3 text-sm font-medium text-white rounded-lg transition-colors
        {store.state?.running
        ? 'bg-red-500 hover:bg-red-600'
        : 'bg-green-500 hover:bg-green-600'}"
      onclick={() => store.toggle()}
      disabled={!store.state}
      aria-label={store.state?.running
        ? messages.aria.pause
        : messages.aria.resume}
    >
      {#if store.state?.running}
        <span class="flex items-center justify-center gap-1">
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Pause
        </span>
      {:else}
        <span class="flex items-center justify-center gap-1">
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Play
        </span>
      {/if}
    </button>

    <!-- Next (visible seulement en pause / longue pause) -->
    {#if store.showNext}
      <button
        type="button"
        class="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        onclick={() => store.next()}
        disabled={!store.state}
        aria-label={messages.aria.next}
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
          Next
        </span>
      </button>
    {/if}
  </div>

  <!-- Message d'erreur minimal -->
  {#if store.error}
    <div class="text-xs text-red-500 text-center" role="alert">
      {store.error}
    </div>
  {/if}
</div>
