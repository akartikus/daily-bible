<script lang="ts">
  import { getMessages, resolveUiLocale } from "../../shared/i18n";
  import { pomodoroStore } from "../lib/pomodoro.svelte.ts";

  // Accès au store via import (singleton)
  const store = pomodoroStore;

  // Locale résolue une seule fois par ouverture (contracts/i18n.md).
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));

  // Horloge locale : minute le calcul des minutes restantes tant que le
  // popup est ouvert (l'état porté par le service worker ne tick pas).
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  /** Minutes restantes de la phase en cours (running → phaseEndsAt, sinon phase restante figée). */
  const remainingMinutes = $derived.by(() => {
    const state = store.state;
    if (!state) return null;
    if (!state.running) {
      return state.phaseRemainingMs === null
        ? null
        : Math.max(1, Math.ceil(state.phaseRemainingMs / 60_000));
    }
    if (state.phaseEndsAt === null) return null;
    // Math.max(1, …) évite le « 0 min » juste avant le changement de phase.
    return Math.max(
      1,
      Math.ceil(Math.max(0, state.phaseEndsAt - now) / 60_000),
    );
  });
</script>

<!-- En-tête de statut, au-dessus du verset (retour utilisateur) : libellé
     centré agrandi + minutes restantes discrètes. Le pied (PomodoroStatus)
     ne porte plus que barre, légende et contrôles. -->
<header class="flex shrink-0 flex-col items-center px-4 pb-2">
  <span class="text-2xl font-medium text-foreground">{store.statusLabel}</span>
  {#if remainingMinutes !== null}
    <span class="text-xs text-muted-foreground">
      {messages.remaining(remainingMinutes)}
    </span>
  {/if}
</header>
