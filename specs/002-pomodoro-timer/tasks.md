---
description: "Task list for Minuteur Pomodoro implementation"
---

# Tasks: Minuteur Pomodoro

**Input**: Design documents from `/specs/002-pomodoro-timer/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Inclus — la constitution (principe IV : « Every feature MUST ship with
tests ») et plan.md (Vitest + @testing-library/svelte) les exigent. Les tâches de
tests précèdent l'implémentation et doivent échouer (RED) avant celle-ci.

**Organization**: Tâches groupées par user story (US1 = P1 … US5 = P5 d'après
spec.md) pour permettre implémentation et validation indépendantes.

**Setup**: Pas de phase Setup — le projet, l'outillage qualité et le manifeste
existent (feature 001) ; aucune nouvelle dépendance, manifeste inchangé
(plan.md Technical Context).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, pas de dépendance sur des tâches incomplètes)
- **[Story]**: User story de rattachement (US1…US5)
- Chemins de fichiers exacts dans chaque description

## Path Conventions

- Projet unique : `src/` et `tests/` à la racine du dépôt (per plan.md)
- Stack existante : Svelte 5 + TypeScript strict + Vite/@crxjs + Tailwind CSS 4, Manifest V3

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure partagée que TOUTE user story utilise

**⚠️ CRITICAL**: Aucune user story ne peut commencer avant la fin de cette phase

- [X] T001 [P] Étendre le type `StorageKey` avec `"pomodoroState"` dans src/shared/chrome/storage.ts et couvrir la nouvelle clé dans tests/unit/storage.test.ts — per contracts/storage-schema.md (écrivain : service worker seul)
- [X] T002 [P] Étendre tests/mocks/chrome.ts pour les alarmes one-shot : champ `when` sur `Alarm`, propagé par create/get/getAll/fireAlarm (le mock actuel ne connaît que `periodInMinutes`)
- [X] T003 [P] Étendre les réglages pour le pomodoro : src/shared/settings/defaults.ts (focusMinutes=25, breakMinutes=5, longBreakMinutes=15, repetitionsBeforeLongBreak=4 + `readSettings(stored) = { ...DEFAULT_SETTINGS, ...stored }` — migration des installations 001), src/shared/settings/validate.ts (`isValidPomodoroMinutes` : « entier, 1 ≤ x ≤ 1440 » ; `isValidRepetitionCount` : « entier, 1 ≤ x ≤ 10 » — contraintes verbatim data-model.md), lecture via readSettings dans src/popup/lib/settings.svelte.ts ; tests étendus dans tests/unit/settings.test.ts et tests/unit/settings-store.test.ts (FR-009/FR-011)
- [X] T004 [P] Tests unitaires RED dans tests/unit/pomodoro-state.test.ts des transitions pures — per data-model.md : `initialPomodoroState` (focus, répétition 1, lecture, phaseEndsAt = now + focusMinutes) ; `advanceAfterFocusEnd` (répétition < X → break, répétition ≥ X → longBreak) ; `startNextFocus` (break → répétition + 1, longBreak → répétition 1, lecture) ; `suspendPomodoro`/`resumePomodoro` (`max(0, phaseEndsAt - now)`, invariants `running ⇔ phaseEndsAt` et `!running ⇔ phaseRemainingMs`) ; `reconcilePomodoro` (focus échu → advance, pause échue → inchangé) ; edge case X = 1 (focus → longBreak direct)
- [X] T005 [P] Extraire `drawRandomVerse` (et les constantes de traduction) de src/background/service-worker.ts vers src/shared/bible/draw.ts — comportement inchangé, imports mis à jour, tests existants verts (réutilisation à la fin de chaque focus — plan.md Structure Decision)
- [X] T006 Implémenter src/shared/pomodoro/state.ts : type `PomodoroStatus` ("focus" | "break" | "longBreak"), `PomodoroState` (status, repetition, running, phaseEndsAt, phaseRemainingMs) et les 6 fonctions pures testées en T004 (dépend de T004)

**Checkpoint**: Fondations prêtes — les user stories peuvent commencer

---

## Phase 2: User Story 1 - Voir l'état du pomodoro (Priority: P1) 🎯 MVP

**Goal**: Ouvrir le popup affiche le statut courant (Focus / Pause / Longue pause) et la progression sur les X répétitions, l'état étant initialisé et maintenu en arrière-plan (FR-002, FR-003, FR-008, FR-013, SC-001)

**Independent Test**: Scénario 1 de quickstart.md — installation fraîche → « Focus », « répétition 1 / 4 », barre à 4 segments avec le 1er courant

### Implementation for User Story 1

- [X] T007 [P] [US1] Étendre src/shared/chrome/alarms.ts : `POMODORO_ALARM_NAME = "pomodoro-phase"`, `createPomodoroPhaseAlarm(phaseEndsAt)` (one-shot `{ when }`), `clearPomodoroPhaseAlarm()` + tests étendus dans tests/unit/alarms.test.ts
- [X] T008 [P] [US1] Tests orchestrateur RED dans tests/unit/pomodoro-orchestrator.test.ts (import de src/background/service-worker, mock chrome, fireStartup/fireInstalled/fireAlarm) : onInstalled initialise `pomodoroState` si absent (focus, répétition 1, lecture, alarme créée `{ when: phaseEndsAt }`) ; onStartup remet un nouveau cycle (FR-013) ; `pomodoro-get-state` répond l'état et initialise défensivement si absent ; focus échu non alarmé → état réconcilié (SC-001)
- [X] T009 [US1] Implémenter src/background/pomodoro.ts : `registerPomodoro()` — cycle de vie (onInstalled init si absent, onStartup reset + alarme recréée), handler `pomodoro-get-state` (init défensive + `reconcilePomodoro`, réponse = PomodoroState), création/suppression de l'alarme via T007 ; types de messages exportés ; brancher `registerPomodoro()` dans src/background/service-worker.ts et adapter tests/unit/service-worker.test.ts (l'alarme pomodoro-phase est désormais créée au démarrage même si l'affichage auto est désactivé) (dépend de T001–T008)
- [X] T010 [P] [US1] Créer le store src/popup/lib/pomodoro.svelte.ts : `PomodoroStore` — chargement via message `pomodoro-get-state`, observation `onChanged` sur `pomodoroState`, erreur minimale affichable (jamais d'écran vide) + tests unitaires dans tests/unit/pomodoro-store.test.ts (dépend de T009 pour les types)
- [X] T011 [P] [US1] Créer src/popup/components/PomodoroStatus.svelte : libellé du statut (Focus / Pause / Longue pause), barre à X segments (accomplis remplis, courant distinct, pleine en longue pause, X = 1 → un segment), texte « répétition n / X » — FR-002/FR-003, contracts/ui-behavior.md (X vient du store réglages existant) + tests composant dans tests/component/PomodoroStatus.test.ts
- [X] T012 [US1] Câbler src/popup/App.svelte : instancier PomodoroStore, rendre PomodoroStatus dans la vue verset AU-DESSUS du contenu verset/erreur/chargement (FR-002 « en permanence ») ; valider le scénario 1 de quickstart.md (dépend de T010, T011)

**Checkpoint**: MVP fonctionnel — le statut du pomodoro est visible et correct

---

## Phase 3: User Story 2 - Fin de focus : verset et passage automatique en pause (Priority: P2)

**Goal**: À la fin de chaque focus, le popup s'ouvre automatiquement avec un verset neuf et le statut passe en pause (ou longue pause après le X-ième focus), même en cas d'échec de l'API (FR-001, FR-006, FR-008, FR-014, SC-002, SC-007)

**Independent Test**: Scénarios 2 et 4 de quickstart.md — focus 1 min → popup + verset neuf + « Pause » ; X = 1 → « Longue pause » (partie statut ; le bouton next arrive avec l'US3)

### Implementation for User Story 2

- [X] T013 [US2] Tests orchestrateur RED dans tests/unit/pomodoro-orchestrator.test.ts : fireAlarm(pomodoro-phase) en focus → openPopup, verset neuf dans currentCycle, `advanceAfterFocusEnd` (break si répétition < X, longBreak sinon), nouvelle alarme `{ when }` ; échec du tirage → transition quand même, ancien verset conservé (FR-014) ; alarme `verse-interval` ignorée par le dispatch pomodoro
- [X] T014 [US2] Implémenter la branche focus de l'alarme dans src/background/pomodoro.ts : dispatch par nom d'alarme ; openPopup non bloquant → `drawRandomVerse` → écriture currentCycle (dégradation gracieuse) → `advanceAfterFocusEnd` → alarme suivante (dépend de T009, T013) ; valider les scénarios 2 et 4 (partie statut) de quickstart.md

**Checkpoint**: Le pomodoro biblique bat — verset neuf et pause automatique à chaque fin de focus

---

## Phase 4: User Story 3 - Reprendre le focus avec le bouton next (Priority: P3)

**Goal**: Le bouton next démarre le focus suivant depuis la pause (ou un nouveau cycle après la longue pause), sans jamais de transition automatique ; le popup se rouvre quand le décompte d'une pause atteint zéro (FR-001, FR-005, FR-007, SC-003)

**Independent Test**: Scénarios 3, 4 et 6 de quickstart.md — next → « Focus », répétition + 1 ; X = 1 → next → nouveau cycle « répétition 1 / 1 » ; popup fermé → repop à la fin du décompte, aucun passage automatique en focus

### Implementation for User Story 3

- [X] T015 [US3] Tests orchestrateur RED dans tests/unit/pomodoro-orchestrator.test.ts : fireAlarm en break/longBreak → openPopup seul (repop FR-007), statut inchangé, aucune nouvelle alarme ; message `pomodoro-next` → `startNextFocus` (break → répétition + 1, longBreak → répétition 1), lecture, alarme recréée ; next ignoré en focus ; next pendant une pause suspendue → focus en lecture (edge case spec)
- [X] T016 [US3] Implémenter la branche break/longBreak de l'alarme (openPopup seul) et le message `pomodoro-next` dans src/background/pomodoro.ts (dépend de T014, T015)
- [X] T017 [P] [US3] Ajouter le bouton next dans src/popup/components/PomodoroStatus.svelte (visible en Pause / Longue pause uniquement — FR-005) et l'action dans src/popup/lib/pomodoro.svelte.ts (message `pomodoro-next`) + tests composant étendus ; valider les scénarios 3, 4 et 6 (dépend de T016)

**Checkpoint**: Le cycle se referme — l'utilisateur décide quand reprendre le focus

---

## Phase 5: User Story 4 - Suspendre et reprendre le décompte (Priority: P4)

**Goal**: Le bouton play/pause suspend ou reprend le décompte dans toute phase, sans perte de position ; le bouton est un contrôle, pas un indicateur de statut (FR-004, SC-004)

**Independent Test**: Scénario 5 de quickstart.md — suspendre en cours de focus, fermer/rouvrir le popup (état suspendu conservé), reprendre : la fin du focus est décalée d'autant

### Implementation for User Story 4

- [x] T018 [P] [US4] Tests orchestrateur RED dans tests/unit/pomodoro-orchestrator.test.ts : `pomodoro-pause` → `suspendPomodoro`, alarme supprimée, invariants respectés ; `pomodoro-resume` → `resumePomodoro`, alarme recréée `{ when: now + phaseRemainingMs }` ; reprise d'une pause à décompte terminé → aucune alarme (attente de next) ; pause/play valables dans toute phase (FR-004)
- [x] T019 [US4] Implémenter les messages `pomodoro-pause` / `pomodoro-resume` dans src/background/pomodoro.ts (dépend de T016, T018)
- [x] T020 [US4] Ajouter le bouton play/pause dans src/popup/components/PomodoroStatus.svelte (action opposée à l'état : pause si lecture — défaut, play si suspendu — FR-004) et les actions dans src/popup/lib/pomodoro.svelte.ts + tests composant ; valider le scénario 5 (dépend de T017, T019)

**Checkpoint**: Minuteur pleinement contrôlable — suspension fidèle dans toute phase

---

## Phase 6: User Story 5 - Configurer les durées du pomodoro (Priority: P5)

**Goal**: Les durées focus/pause/longue pause et le nombre X sont réglables dans les paramètres, refus des valeurs invalides, application à partir de la phase suivante (FR-009, FR-010, FR-011, FR-012, SC-006)

**Independent Test**: Scénarios 7 et 8 de quickstart.md — redémarrage Chrome : réglages conservés + nouveau cycle ; saisies 0, 1500 puis 11 → refus avec message, dernières valeurs valides conservées

### Implementation for User Story 5

- [x] T021 [P] [US5] Étendre src/popup/components/SettingsView.svelte : champs Focus / Pause / Longue pause (minutes, bornes 1..1440) et Répétitions avant longue pause (1..10), validation à la saisie via `isValidPomodoroMinutes` / `isValidRepetitionCount` (T003), messages « Entrez un nombre entier entre 1 et 1440. » / « Entrez un nombre entier entre 1 et 10. », dernière valeur valide conservée (FR-011) + tests composant étendus dans tests/component/SettingsView.test.ts — ne dépend que de T003 : peut avancer en parallèle des stories 1–4
- [x] T022 [US5] Valider les scénarios 7 et 8 de quickstart.md et vérifier FR-012 : un changement de durée en cours de phase ne recrée pas l'alarme courante ; les nouvelles valeurs s'appliquent à partir de la phase suivante (l'orchestrateur relit `readSettings` à chaque transition — research.md §6)

**Checkpoint**: Expérience complète — les cinq stories fonctionnent indépendamment

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Améliorations transversales aux cinq stories

- [x] T023 Exécuter les portes qualité de package.json : npm run check, npm run test, npm run lint, npm run format, npm run build, npm run check:size (bundle < 300 Ko gzippé) ; corriger tout échec dans les fichiers concernés (constitution — CI rouge bloque)
- [x] T024 Valider les 9 scénarios de specs/002-pomodoro-timer/quickstart.md dans Chrome ≥ 127 (dist/ chargé non empaqueté) et consigner les résultats dans docs/context/002-validation.md + mise à jour de docs/context/index.md (règle projet)
- [x] T025 Mettre à jour la documentation : docs/context/002-pomodoro-timer.md (statut Actif, décisions finales), docs/context/index.md et docs/release-notes.md (une ligne courte par tâche, style existant — règle projet)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: Aucune dépendance — T001 ∥ T002 ∥ T003 ∥ T004 ∥ T005, puis T006 (après T004)
- **User Stories (Phases 2–6)**: Toutes dépendent de la Phase 1
  - US1 (P2) fonde l'orchestration ; US2→US4 l'étendent séquentiellement (même fichier src/background/pomodoro.ts)
  - **US5 est indépendante** des stories 1–4 : ne dépend que de T003 — peut avancer en parallèle dès la fin de la Phase 1
- **Polish (Phase 7)**: Dépend de la complétion des stories retenues

### User Story Dependencies

- **US1 (P1)**: Après Phase 1 — T007 ∥ T008, puis T009, puis T010 ∥ T011, puis T012
- **US2 (P2)**: Après T009 — T013 (RED) puis T014
- **US3 (P3)**: Après T014 — T015 (RED) puis T016 puis T017
- **US4 (P4)**: Après T016 — T018 (RED, parallélisable avec T017) puis T019 puis T020
- **US5 (P5)**: Après T003 uniquement — T021 puis T022

### Within Each User Story

- Tests d'abord (RED) → implémentation → UI/actions → validation quickstart
- Le fichier tests/unit/pomodoro-orchestrator.test.ts croît story après story : T008 → T013 → T015 → T018 restent séquentiels
- PomodoroStatus.svelte croît : T011 (statut+barre) → T017 (next) → T020 (play/pause)

### Parallel Opportunities

- T001 ∥ T002 ∥ T003 ∥ T004 ∥ T005 (Phase 1) ; T007 ∥ T008 ; T010 ∥ T011
- T017 ∥ T018 (US3 UI ∥ US4 tests — fichiers différents)
- T021 (US5) avec toute tâche des stories 1–4 (fichiers disjoints)

---

## Parallel Example: User Story 1

```bash
# Lancer ensemble les modules indépendants (après la Phase 1) :
Task: "Wrapper alarme one-shot dans src/shared/chrome/alarms.ts"            # T007
Task: "Tests orchestrateur dans tests/unit/pomodoro-orchestrator.test.ts"  # T008

# Puis l'orchestration, puis ensemble :
Task: "Orchestration src/background/pomodoro.ts + branchement"             # T009
Task: "Store src/popup/lib/pomodoro.svelte.ts + tests"                     # T010
Task: "Composant PomodoroStatus.svelte + tests"                            # T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Compléter la Phase 1 (Foundational)
2. Compléter la Phase 2 (US1)
3. **STOP et VALIDER** : scénario 1 de quickstart.md — statut visible et correct
4. Démo possible : le statut du pomodoro s'affiche (valeur cœur de la spec, FR-002/FR-003)

### Incremental Delivery

1. Foundational → fondations pures et testées
2. + US1 → MVP validé (statut + progression)
3. + US2 → le cycle bat seul (verset + pause automatiques)
4. + US3 → le cycle se referme (next, repop)
5. + US4 → suspension fidèle
6. + US5 → réglages complets, expérience finale
7. Chaque story ajoute de la valeur sans casser les précédentes

### Parallel Team Strategy

1. L'équipe complète la Phase 1 ensemble
2. Puis : développeur A → US1 puis US2… ; développeur B → US5 (indépendante)
3. US2–US4 restent séquentielles (même orchestrateur), leurs tests/UI parallélisables par fichiers

---

## Notes

- [P] = fichiers différents, pas de dépendance sur des tâches incomplètes
- [Story] rattache la tâche à sa user story (traçabilité spec ↔ tasks)
- Règle projet : cocher une tâche uniquement après implémentation ET vérification
- Format des commits (règle projet) : `002-<numéro-de-tâche>: <message en anglais>` (ex. `002-T009: Add pomodoro orchestrator`)
- Valider chaque checkpoint de story indépendamment avant de continuer
- Committer après chaque tâche ou groupe logique
