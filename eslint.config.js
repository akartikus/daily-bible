import js from "@eslint/js";
import tseslint from "typescript-eslint";
import svelte from "eslint-plugin-svelte";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // Les .svelte.ts sont du TypeScript pur (pas de template) : le plugin
    // svelte leur impose svelte-eslint-parser, qui ne comprend pas la
    // syntaxe TS sans ce retour au parser @typescript-eslint.
    files: ["**/*.svelte.ts"],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
  {
    rules: {
      // Aligné sur noUnusedParameters (tsc) : les paramètres préfixés `_` sont ignorés.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
