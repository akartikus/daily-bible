import { defineConfig } from "vitest/config";
import { crx } from "@crxjs/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest.ts";

export default defineConfig(({ mode }) => ({
  plugins: [svelte(), crx({ manifest }), tailwindcss()],
  // Sous vitest (mode « test ») : résoudre le build client de Svelte — sinon
  // mount() lève lifecycle_function_unavailable — et exécuter en jsdom.
  test: { environment: "jsdom" },
  resolve: mode === "test" ? { conditions: ["browser"] } : undefined,
}));
