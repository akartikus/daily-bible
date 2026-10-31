<script lang="ts">
  import type { Verse } from "../../shared/bible/extract";

  interface Props {
    verse: Verse;
  }

  let { verse }: Props = $props();
</script>

<!-- T033 option A : l'ouverture automatique du popup EST l'invitation à la
     pause (clarification 2026-10-20) — aucun libellé dédié en v1. -->
<!-- Positionnement « verset du jour » (retour utilisateur) : traduction en
     surtitre capitales, référence en vedette, texte serif. min-h-full :
     remplit le conteneur défilant d'App (centré si court, défile si long). -->
<main class="flex min-h-full flex-col justify-center gap-2 px-6 text-left">
  <div class="flex flex-col">
    <span
      class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {verse.translationName}
    </span>
    <h2 class="text-2xl font-medium text-foreground">
      {verse.bookName}
      {verse.chapterNumber}:{verse.verseNumber}
    </h2>
  </div>

  <!-- Le verset en Lora (serif), le reste de l'interface en Inter. -->
  <p class="font-serif text-base leading-snug text-foreground">{verse.text}</p>
</main>
