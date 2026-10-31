<script lang="ts">
  import { Pause, Play, SkipForward } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
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

  /** Libellé accessible du bouton play/pause : l'action opposée à l'état. */
  const toggleLabel = $derived(
    store.state?.running ? messages.aria.pause : messages.aria.resume,
  );

  // Horloge locale : fait vivre le compte à rebours tant que le popup est
  // ouvert (l'état porté par le service worker ne tick pas).
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  /** Format mm:ss d'une durée en millisecondes (arrondi à la seconde entamée). */
  function formatClock(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  /** Compte à rebours de la phase en cours : lecture → phaseEndsAt, suspendu
      → temps restant figé (phaseRemainingMs). */
  const countdown = $derived.by(() => {
    const state = store.state;
    if (!state) return null;
    if (!state.running) {
      return state.phaseRemainingMs === null
        ? null
        : formatClock(state.phaseRemainingMs);
    }
    if (state.phaseEndsAt === null) return null;
    return formatClock(Math.max(0, state.phaseEndsAt - now));
  });

  /** Couleur d'un segment du cycle selon son état — pastels de la charte.
      Ordre requis par le contrat (courant distinct des accomplis) : le
      segment courant se teste avant les accomplis, sinon `index < currentRep`
      l'attrape toujours. */
  function segmentColor(index: number): string {
    if (!store.state) return "var(--muted)";
    const currentRep = store.currentRepetition;
    const isLongBreak = store.state?.status === "longBreak";

    if (isLongBreak) {
      return "var(--rose)"; // anneau pleine en longue pause
    }

    if (index === currentRep - 1) {
      return "var(--honey)"; // répétition courante
    }

    if (index < currentRep - 1) {
      return "var(--sage)"; // répétitions accomplies
    }

    return "var(--muted)"; // répétitions futures
  }

  /** Anneau donut : la bordure du bouton play/pause EST la barre de
      progression du cycle (retour utilisateur) — un conic-gradient à X
      segments ; seul l'espace entre le bouton (52 px) et le donut (64 px)
      reste visible, 6 px d'anneau. */
  const ringGradient = $derived(
    repetitions > 0
      ? `conic-gradient(${Array.from({ length: repetitions }, (_, i) => {
          const width = 100 / repetitions;
          return `${segmentColor(i)} ${(i * width).toFixed(2)}% ${(
            (i + 1) *
            width
          ).toFixed(2)}%`;
        }).join(", ")})`
      : "var(--muted)",
  );
</script>

<!-- Pied à hauteur fixe et compacte (retour utilisateur) : l'anneau donut
     autour du play/pause EST la barre du cycle, le compte à rebours de la
     phase passe dessous. Le statut et les minutes restantes vivent dans
     l'en-tête (PomodoroStatusHeader), au-dessus du verset. -->
<footer
  class="flex h-24 shrink-0 flex-col items-center justify-center gap-1 px-4"
>
  <div class="flex items-center justify-center gap-2">
    <!-- Anneau donut : la bordure du bouton play/pause est la barre du cycle —
         donut 64 px, bouton 52 px, icône 28 px au centre. -->
    <div class="relative inline-flex size-16 items-center justify-center">
      <div
        class="absolute inset-0 rounded-full transition-all duration-300"
        role="progressbar"
        aria-valuenow={store.currentRepetition}
        aria-valuemin={0}
        aria-valuemax={repetitions}
        aria-label={messages.aria.cycleProgress}
        style="background: {ringGradient}"
      ></div>
      <!-- `relative` fait peindre le bouton APRÈS l'anneau (ordre du DOM) :
           son fond opaque creuse le centre, l'icône reste visible — un donut,
           pas un camembert. -->
      <Button
        variant="outline"
        size="icon"
        class="relative size-13 rounded-full"
        onclick={() => store.toggle()}
        disabled={!store.state}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {#if store.state?.running}
          <Pause class="size-7" />
        {:else}
          <Play class="size-7" />
        {/if}
      </Button>
    </div>

    <!-- Next (visible seulement en pause / longue pause) -->
    {#if store.showNext}
      <Button
        variant="outline"
        size="icon"
        class="rounded-full"
        onclick={() => store.next()}
        disabled={!store.state}
        aria-label={messages.aria.next}
        title={messages.aria.next}
      >
        <SkipForward />
      </Button>
    {/if}
  </div>

  <!-- Compte à rebours mm:ss de la phase ou message d'erreur : un seul
       emplacement d'une ligne, la hauteur du pied ne bouge pas (fixe).
       tabular-nums : les chiffres restent en place au fil des secondes. -->
  {#if store.error}
    <p class="text-center text-xs text-destructive" role="alert">
      {store.error}
    </p>
  {:else if countdown}
    <p class="text-center text-xs tabular-nums text-muted-foreground/80">
      {countdown}
    </p>
  {/if}
</footer>
