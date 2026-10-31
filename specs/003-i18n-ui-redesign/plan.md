# Implementation Plan: Internationalisation et refonte graphique

**Branch**: `003-i18n-ui-redesign` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-i18n-ui-redesign/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

L'extension passe en FR/EN selon la langue du navigateur (fallback EN) pour
tous ses textes d'interface, et le verset suit la langue (fr → Louis Segond,
en → King James Version). Refonte graphique épurée avec le design system
shadcn-svelte (thème neutre Tailwind v4) et des boutons épurés en icônes
seules Lucide, libellés accessibles traduits inclus ; les paramètres passent
en grille libellé | champ sur deux colonnes alignées. Comportement des
features 001/002 inchangé.

## Technical Context

**Language/Version**: TypeScript 5 (strict) + Svelte 5 — inchangés.

**Primary Dependencies**: ajout de `@lucide/svelte` (icônes officielles
Lucide) ; via le CLI shadcn-svelte : `bits-ui`, `tailwind-variants`,
`tailwind-merge`, `clsx`, `tw-animate-css`. Le reste est inchangé (Vite,
@crxjs/vite-plugin, Tailwind CSS 4, @types/chrome).

**Storage**: `chrome.storage.local` inchangé. Le champ réglage
`translationId` (mort : jamais édité, jamais lu) est supprimé de
`DEFAULT_SETTINGS`/`Settings` ; les valeurs déjà stockées sont ignorées par
la fusion de `readSettings`. La clé de cache `bookIndex` devient indexée par
traduction (clé `bookIndex:fra_lsg` / `bookIndex:eng_kjv`) car l'index des
livres diffère entre traductions.

**Testing**: Vitest + @testing-library/svelte (jsdom), global `chrome`
stubbé par `tests/mocks` — le mock gagne `i18n.getUIanguage` (langue
pilotable par test).

**Target Platform**: Chrome desktop ≥ 127, Manifest V3 — permissions
inchangées (`getUIanguage` ne nécessite rien).

**Project Type**: browser-extension (projet unique, pas de backend).

**Performance Goals**: bundle du popup < 300 Ko gzippé (inchangé) ;
icônes tree-shakées (imports par icône) ; aucun impact réponse < 100 ms
(pas de nouvelle I/O au rendu — la locale est résolue une fois).

**Constraints**: la locale est résolue via `chrome.i18n.getUIanguage()`
au chargement du popup (nouvelle langue = nouvelle ouverture, exigence de
la spec) ; les textes d'interface du service worker (journaux développeur)
restent hors catalogue ; le verset est fourni localisé par l'API (noms de
livres inclus dans la traduction choisie).

**Scale/Scope**: 2 locales ; 4 composants shadcn-svelte (Button, Input,
Label, Switch) + barre X segments custom ; 5 boutons icône ; ~30 clés de
traduction.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Verdict | Application concrète |
| --- | --- | --- |
| I. Readability First | PASS | `Messages` typé dérivé de `en.ts` (complétude FR garantie à la compilation) ; `resolveUiLocale` pure ; clés de catalogue groupées par intention (`status.`, `buttons.`, `settings.`, `errors.`) |
| II. Idiomatic Code | PASS | `@lucide/svelte` + shadcn-svelte = paquets communautaires standard Svelte 5 (demande utilisateur) ; runes Svelte 5 inchangés ; `chrome.i18n.getUIanguage` = API plateforme |
| III. Simple Design (YAGNI) | PASS | aucune librairie i18n tierce (catalogue TS de 2 locales) ; pas de sélecteur de langue en UI (suivre le navigateur, FR-004) ; pas de thème clair/sombre commutable (charte unique épurée) ; suppression du réglage mort `translationId` |
| IV. Testability | PASS | `resolveUiLocale` pure testée sans Chrome ; complétude du catalogue = erreur de compilation ; composants testés aux deux locales via le mock `getUIanguage` pilotable |
| V. Consistency & Maintainability | PASS | catalogue dans `shared/` au même rang que `pomodoro`/`settings` ; composants shadcn dans `src/popup/components/ui/` à côté des vues ; contrats documentés dans `contracts/` |

**Post-design re-check (Phase 1)** : PASS — le design n'ajoute aucune
indirection : la table locale→traduction remplace deux constantes ; le
catalogue est un module de données pur ; les composants shadcn sont des
sources copiées, pas une dépendance opaque.

## Project Structure

### Documentation (this feature)

```text
specs/003-i18n-ui-redesign/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md       # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── i18n.md
│   └── ui-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── manifest.ts                     # inchangé (getUIanguage sans permission)
├── shared/
│   ├── bible/
│   │   ├── draw.ts                 # TRANSLATIONS: Record<UiLocale, {id, name}> (remplace TRANSLATION_ID/NAME), translationForLocale()
│   │   └── api.ts                  # BibleApiError porte un code (plus un texte FR codé dur)
│   ├── i18n/
│   │   ├── index.ts                # UiLocale, resolveUiLocale(), getMessages(), type Messages
│   │   ├── en.ts                   # catalogue anglais (source du type)
│   │   └── fr.ts                   # catalogue français (typé Messages)
│   └── settings/
│       └── defaults.ts             # Settings sans translationId
├── popup/
│   ├── app.css                     # variables de thème shadcn-svelte (:root, @theme inline, @custom-variant dark)
│   ├── App.svelte                  # boutons icône (Settings/RotateCcw), textes du catalogue
│   ├── components/
│   │   ├── ui/                     # sources shadcn-svelte (button, input, label, switch)
│   │   ├── VerseView.svelte        # inchangé (contenu API)
│   │   ├── ErrorView.svelte        # message + Retry icône seule
│   │   ├── SettingsView.svelte     # grille 2 colonnes Label | Input/Switch, textes traduits
│   │   └── PomodoroStatus.svelte   # icônes Lucide (Pause/Play/SkipForward), textes traduits
│   └── lib/
│       ├── pomodoro.svelte.ts      # statusLabel/error → clés de catalogue (pas de texte codé dur)
│       └── verse.svelte.ts         # erreur → clé de catalogue
tests/
├── unit/
│   ├── i18n.test.ts                # resolveUiLocale (fr, fr-CA, en-US, de, absent), complétude
│   ├── draw.test.ts                # translationForLocale, tirage par traduction (étendu)
│   └── … (stores : textes attendus localisés, mock getUIanguage)
└── component/
    └── … (PomodoroStatus/SettingsView/App aux deux locales)
```

**Structure Decision**: projet unique, l'extension reste le seul livrable
(structure 001/002). Changements additifs : `shared/i18n/` (module de
données pur + résolution pure, même rang que `pomodoro`), composants
shadcn-svelte copiés dans `popup/components/ui/` (à côté des vues, alias
`components.json`). Les textes de statut/erreur migrent des vues et stores
vers le catalogue — aucun texte d'interface ne reste codé en dur
(FR-003), les journaux développeur du service worker exceptés.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Aucune violation — table volontairement vide.