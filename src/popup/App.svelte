<script lang="ts">
  import { onMount } from "svelte";
  import ErrorView from "./components/ErrorView.svelte";
  import VerseView from "./components/VerseView.svelte";
  import { VerseStore } from "./lib/verse.svelte.ts";

  const store = new VerseStore();
  const verse = $derived(store.verse);
  const error = $derived(store.error);

  onMount(() => {
    void store.load();
    store.observe();
  });
</script>

{#if verse}
  <VerseView {verse} />
{:else if error}
  <ErrorView message={error} onRetry={() => void store.load()} />
{:else}
  <main class="flex h-64 w-80 items-center justify-center">
    <p class="text-lg">Chargement…</p>
  </main>
{/if}
