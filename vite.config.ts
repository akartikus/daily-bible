import path from "node:path";
import { defineConfig } from "vitest/config";
import { crx } from "@crxjs/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest.ts";

export default defineConfig(({ mode }) => ({
  plugins: [svelte(), crx({ manifest }), tailwindcss()],
  // $lib → src/popup : alias des composants shadcn-svelte (components.json).
  resolve: {
    alias: { $lib: path.resolve("./src/popup") },
    // Sous vitest (mode « test ») : résoudre le build client de Svelte — sinon
    // mount() lève lifecycle_function_unavailable.
    conditions: mode === "test" ? ["browser"] : undefined,
  },
  // Sous vitest (mode « test ») : exécuter en jsdom.
  test: { environment: "jsdom" },
}));
