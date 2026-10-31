<script lang="ts">
  import { RotateCcw } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { getMessages, resolveUiLocale } from "../../shared/i18n";

  interface Props {
    message: string;
    onRetry: () => void;
  }

  let { message, onRetry }: Props = $props();

  // Locale résolue une seule fois par ouverture (contracts/i18n.md).
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));
</script>

<!-- min-h-full : remplit le conteneur défilant d'App, centré quel que soit
     l'espace disponible. -->
<main
  class="flex min-h-full flex-col items-center justify-center gap-4 p-4 text-center"
>
  <p class="text-lg">{message}</p>
  <Button
    variant="outline"
    size="icon"
    class="rounded-full"
    aria-label={messages.aria.retry}
    title={messages.aria.retry}
    onclick={onRetry}
  >
    <RotateCcw />
  </Button>
</main>
