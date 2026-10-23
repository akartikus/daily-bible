<script lang="ts">
  import type { Verse } from "../../shared/bible/extract";

  interface Props {
    verse: Verse;
  }

  let { verse }: Props = $props();
</script>

<!-- T033 option A : l'ouverture automatique du popup EST l'invitation à la
     pause (clarification 2026-10-20) — aucun libellé dédié en v1. -->
<main
  class="flex h-64 w-80 flex-col items-center justify-center gap-4 p-4 text-center"
>
  <p class="text-lg">{verse.text}</p>
  <p class="text-sm text-gray-600">
    {verse.bookName}
    {verse.chapterNumber}:{verse.verseNumber}
  </p>
  <p class="text-xs text-gray-400">{verse.translationName}</p>
</main>
