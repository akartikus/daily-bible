# Implementation Plan: Minuteur Pomodoro

**Branch**: `002-pomodoro-timer` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-pomodoro-timer/spec.md`

## Summary

Ajoute à l'extension de la feature 001 un vrai minuteur pomodoro : X
répétitions focus → pause, puis une longue pause, puis un nouveau cycle. Le
minuteur vit dans le service worker MV3 : l'état (phase, répétition,
lecture/suspension, échéance de phase en epoch ms) est persisté dans
`chrome.storage.local` (clé `pomodoroState`) et chaque phase est déclenchée
par une alarme one-shot `chrome.alarms` (`when = phaseEndsAt`) — robuste au
cycle de vie éphémère du service worker et au popup fermé. À la fin de
chaque focus, le popup s'ouvre automatiquement avec un verset neuf
(`drawRandomVerse` extrait du service worker et réutilisé) et le statut
passe en pause ou longue pause ; le retour au focus n'est JAMAIS
automatique : le bouton « next » de la page VerseView le déclenche, et le
popup se rouvre quand le décompte de la pause atteint zéro. Le bouton
play/pause suspend ou reprend le décompte dans toute phase, sans être un
indicateur de statut. Les durées et X sont configurables dans SettingsView.
Transitions pures dans `shared/pomodoro/state.ts`, orchestration dans
`background/pomodoro.ts`, affichage dans le nouveau composant
`PomodoroStatus.svelte`.

## Technical Context

**Language/Version**: TypeScript 5 (strict) + Svelte 5

**Primary Dependencies**: Vite, @crxjs/vite-plugin, Tailwind CSS 4,
@types/chrome — inchangées, aucune nouvelle dépendance.

**Storage**: `chrome.storage.local` — nouvelle clé `pomodoroState` (état du
minuteur, seul écrivain : le service worker, comme `currentCycle` en 001) ;
`settings` étendu (durées focus/pause/longue pause + X). Échéances stockées
en epoch ms : l'état reste exact même après suspension, veille ou
réveil du service worker.

**Testing**: Vitest + @testing-library/svelte (jsdom) ; transitions et
réconciliation = fonctions pures (`shared/pomodoro/state.ts`) testées sans
Chrome ; orchestration testée via le global `chrome` stubbé
(`tests/mocks`), composants testés via Testing Library.

**Target Platform**: Chrome desktop ≥ 127, Manifest V3 — permissions
existantes `storage` + `alarms` suffisantes, manifeste inchangé.

**Project Type**: browser-extension (projet unique, pas de backend)

**Performance Goals**: réactivité du popup aux transitions de phase
< 100 ms (push `storage.onChanged`, pas de polling ni de ticker local) ;
bundle du popup < 300 Ko gzippé (objectif 001 inchangé).

**Constraints**: service worker MV3 éphémère — aucun état du minuteur en
mémoire, uniquement `storage.local` ; `chrome.alarms` peut être différé
au-delà de son échéance (précision à la minute — durées en minutes, et la
spec n'exige aucun décompte du temps restant) ; `openPopup()` peut rejeter
(popup déjà ouvert) — non bloquant ; `pomodoroState` écrit uniquement par
le service worker, le popup commande par messages.

**Scale/Scope**: 1 utilisateur par poste ; 2 vues + 1 nouveau composant
(`PomodoroStatus`) ; X ≤ 10 répétitions par cycle ; coexistence avec
l'affichage automatique à intervalle de la feature 001 (hors périmètre).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Verdict | Application concrète |
| --- | --- | --- |
| I. Readability First | PASS | `PomodoroState`, `phaseRemainingMs`, `advanceAfterFocusEnd`, `startNextFocus` : noms révélant l'intention ; transitions = fonctions pures courtes, un niveau d'abstraction |
| II. Idiomatic Code | PASS | `chrome.alarms` one-shot `{ when }`, `storage.onChanged`, runes Svelte 5 ; patterns maison 001 (wrappers `shared/chrome`, stores `$state`, messages kebab-case) réutilisés tels quels |
| III. Simple Design (YAGNI) | PASS | Pas de décompte à la seconde ni de ticker local (la spec demande une progression par répétition) ; `drawRandomVerse` extrait pour réutilisation, pas dupliqué ; aucun réglage ni option au-delà de la spec |
| IV. Testability | PASS | Transitions et réconciliation = fonctions pures testées sans Chrome ; orchestration isolée derrière alarme + messages mockés ; nouveau composant testé |
| V. Consistency & Maintainability | PASS | Aucune nouvelle dépendance ; mêmes conventions que 001 ; interfaces publiques explicites dans `shared/` (contrats documentés dans `contracts/`) |

**Post-design re-check (Phase 1)** : PASS — le design n'ajoute aucune
indirection au runtime au-delà des patterns existants (wrappers
`shared/chrome`, messages typés) ; la seule extraction de code (`draw.ts`)
supprime une duplication au lieu d'en créer.

## Project Structure

### Documentation (this feature)

```text
specs/002-pomodoro-timer/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── runtime-messages.md
│   ├── storage-schema.md
│   └── ui-behavior.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── manifest.ts                     # inchangé (storage + alarms déjà déclarés)
├── background/
│   ├── service-worker.ts           # versets inchangés ; importe et branche pomodoro
│   └── pomodoro.ts                 # orchestration : alarme pomodoro-phase, messages, verset à la fin du focus
├── popup/
│   ├── App.svelte                  # PomodoroStatus rendu dans la vue verset (au-dessus du contenu)
│   ├── components/
│   │   ├── PomodoroStatus.svelte   # statut + barre X segments + play/pause + next
│   │   ├── VerseView.svelte        # inchangé
│   │   ├── ErrorView.svelte        # inchangé
│   │   └── SettingsView.svelte     # + 4 champs pomodoro (3 durées + répétitions)
│   └── lib/
│       ├── pomodoro.svelte.ts      # PomodoroStore : chargement, observation, actions
│       ├── settings.svelte.ts      # fusion des défauts à la lecture (migration)
│       └── verse.svelte.ts         # inchangé
└── shared/
    ├── bible/
    │   └── draw.ts                 # drawRandomVerse extrait du service worker (réutilisé tel quel)
    ├── pomodoro/
    │   └── state.ts                # PomodoroState + transitions pures + réconciliation
    └── settings/
        ├── defaults.ts             # + 4 réglages pomodoro + readSettings (fusion des défauts)
        └── validate.ts             # + isValidPomodoroMinutes, isValidRepetitionCount

tests/
├── unit/
│   ├── pomodoro-state.test.ts      # transitions pures (fin de focus, next, suspend/resume, réconciliation, X=1)
│   ├── pomodoro-orchestrator.test.ts # alarme one-shot, messages, verset à la fin du focus
│   ├── pomodoro-store.test.ts      # chargement, observation, actions du store
│   ├── settings.test.ts            # étendu : défauts pomodoro, validations, fusion
│   ├── settings-store.test.ts      # étendu : fusion des défauts
│   └── service-worker.test.ts      # étendu : branchement pomodoro, extraction de drawRandomVerse
└── component/
    ├── PomodoroStatus.test.ts      # statut, barre n/X, play/pause, next conditionnel
    └── SettingsView.test.ts        # étendu : 4 champs, refus des valeurs invalides
```

**Structure Decision**: identique à 001 — projet unique, l'extension est le
seul livrable. Changements purement additifs : un module pur
`shared/pomodoro/state.ts` (toute la logique de cycle, testable sans
Chrome), une orchestration `background/pomodoro.ts` (seul écrivain de
`pomodoroState`), un composant `PomodoroStatus.svelte` et un store
`pomodoro.svelte.ts`. `drawRandomVerse` déménage du service worker vers
`shared/bible/draw.ts` pour être réutilisé à la fin de chaque focus, sans
changement de comportement. Le manifeste n'est pas modifié.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Aucune violation — table volontairement vide.
