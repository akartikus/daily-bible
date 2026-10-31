<script lang="ts">
  import { getMessages, resolveUiLocale } from "../../shared/i18n";

  interface Props {
    message: string;
    onRetry: () => void;
  }

  let { message, onRetry }: Props = $props();

  // Locale résolue une seule fois par ouverture (contracts/i18n.md).
  const messages = getMessages(resolveUiLocale(chrome.i18n.getUILanguage()));
</script>

<main
  class="flex h-64 w-80 flex-col items-center justify-center gap-4 p-4 text-center"
>
  <p class="text-lg">{message}</p>
  <button
    type="button"
    class="rounded bg-blue-600 px-4 py-2 text-white"
    onclick={onRetry}
  >
    {messages.aria.retry}
  </button>
</main>
