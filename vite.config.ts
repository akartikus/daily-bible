import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest.ts";

export default defineConfig({
  plugins: [svelte(), crx({ manifest }), tailwindcss()],
});
