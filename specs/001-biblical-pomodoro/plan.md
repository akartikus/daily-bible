# Implementation Plan: Pomodoro Biblique

**Branch**: `001-biblical-pomodoro` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-biblical-pomodoro/spec.md`

## Summary

Extension Chrome Manifest V3 (Svelte 5 + TypeScript strict + Tailwind CSS 4,
outillée par Vite et @crxjs/vite-plugin) affichant un verset biblique tiré
au hasard dans la traduction Louis Segond 1910, obtenu depuis la Free Use
Bible API. Le « pomodoro biblique » repose sur `chrome.alarms` (rythme fixe,
intervalle par défaut 25 minutes, activation explicite) et sur
`chrome.action.openPopup()` (Chrome ≥ 127) pour ouvrir automatiquement le
popup à chaque échéance. Réglages, verset courant et cache de l'index des
livres sont persistés dans `chrome.storage.local`.

## Technical Context

**Language/Version**: TypeScript 5 (strict) + Svelte 5

**Primary Dependencies**: Vite, @crxjs/vite-plugin (build MV3 + HMR),
Tailwind CSS 4 (@tailwindcss/vite), @types/chrome

**Storage**: `chrome.storage.local` (quota 10 Mo) — réglages, verset
courant, cache de l'index des livres. Le `localStorage` du Web est écarté :
indisponible dans le service worker MV3 (voir [research.md](research.md)).

**Testing**: Vitest + @testing-library/svelte (jsdom) ; APIs Chrome isolées
derrière des wrappers minces (`src/shared/chrome/`) mockés via `vi.mock`.

**Target Platform**: Chrome desktop ≥ 127, Manifest V3
(`minimum_chrome_version: "127"` requis pour `openPopup()` sans geste).

**Project Type**: browser-extension (projet unique, pas de backend)

**Performance Goals**: verset affiché < 3 s après le clic sur connexion
standard (SC-001) ; tirage aléatoire < 100 ms hors réseau ; bundle du
popup < 300 Ko gzippé.

**Constraints**: service worker MV3 éphémère (aucun état en mémoire entre
deux réveils) ; `chrome.alarms` période minimale 30 s en production ;
`openPopup()` peut rejeter (popup déjà ouvert…) — échec non bloquant ;
connexion internet requise (FR-010/FR-011).

**Scale/Scope**: 1 utilisateur par poste ; ~31 170 versets (LSG) ; 2 vues
dans le popup (verset, réglages).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Verdict | Application concrète |
| --- | --- | --- |
| I. Readability First | PASS | Noms révélant l'intention, fonctions courtes, un niveau d'abstraction par module |
| II. Idiomatic Code | PASS | Stack standard Svelte/Vite/TS/Tailwind ; APIs Chrome utilisées comme prévu (`alarms`, `storage.local`, `action.openPopup`) ; runes Svelte 5 |
| III. Simple Design (YAGNI) | PASS | Projet unique, 2 vues, traduction fixe v1, pas d'abstraction spéculative |
| IV. Testability | PASS | Tirage aléatoire, extraction de texte et validation = fonctions pures ; APIs Chrome derrière wrappers minces mockables ; tests unitaires + composants exigés |
| V. Consistency & Maintainability | PASS | ESLint + Prettier + svelte-check ; interfaces publiques explicites dans `shared/` |

**Post-design re-check (Phase 1)** : PASS — le design n'introduit aucune
indirection au runtime au-delà des wrappers `shared/chrome`, justifiés par
le principe IV.

## Project Structure

### Documentation (this feature)

```text
specs/001-biblical-pomodoro/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── bible-api.md
│   ├── storage-schema.md
│   └── ui-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── manifest.ts               # manifeste MV3 (via @crxjs/vite-plugin)
├── background/
│   └── service-worker.ts     # alarme, cycle des versets, openPopup()
├── popup/
│   ├── index.html
│   ├── main.ts               # montage Svelte
│   ├── App.svelte            # bascule verset ↔ réglages
│   ├── components/
│   │   ├── VerseView.svelte  # verset courant + référence + traduction
│   │   ├── ErrorView.svelte  # message d'erreur + Réessayer (FR-011)
│   │   └── SettingsView.svelte
│   └── lib/
│       ├── settings.svelte.ts   # store réglages (storage.local)
│       └── verse.svelte.ts      # store verset courant
├── shared/
│   ├── bible/
│   │   ├── api.ts            # client HTTP Free Use Bible API
│   │   ├── random.ts         # tirage pondéré livre/chapitre/verset (pur)
│   │   └── extract.ts        # extraction du texte d'un verset (pur)
│   ├── settings/
│   │   ├── defaults.ts       # 25 min, auto-display off, fra_lsg
│   │   └── validate.ts       # validation de l'intervalle (pur)
│   └── chrome/
│       ├── storage.ts        # wrapper chrome.storage.local
│       ├── alarms.ts         # wrapper chrome.alarms
│       ├── action.ts         # wrapper chrome.action.openPopup
│       └── runtime.ts        # wrapper runtime.sendMessage/onMessage
tests/
├── unit/                     # random.ts, extract.ts, validate.ts
└── component/                # VerseView, SettingsView, ErrorView
```

**Structure Decision**: projet unique — l'extension est le seul livrable
(l'API des versets est un service externe existant). Les wrappers
`shared/chrome/` isolent les APIs du navigateur pour la testabilité
(principe IV) sans indirection superflue. Le manifeste déclare
`permissions: ["storage", "alarms"]`,
`host_permissions: ["https://bible.helloao.org/*"]` et
`minimum_chrome_version: "127"`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Aucune violation — table volontairement vide.
