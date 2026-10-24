---
description: "Task list for Pomodoro Biblique implementation"
---

# Tasks: Pomodoro Biblique

**Input**: Design documents from `/specs/001-biblical-pomodoro/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Inclus — la constitution (principe IV : « Every feature MUST ship with
tests ») et plan.md (Vitest + @testing-library/svelte) les exigent. Les tâches de
tests précèdent l'implémentation et doivent échouer (RED) avant celle-ci.

**Organization**: Tâches groupées par user story (US1 = P1, US2 = P2, US3 = P3
d'après spec.md) pour permettre implémentation et validation indépendantes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, pas de dépendance sur des tâches incomplètes)
- **[Story]**: User story de rattachement (US1, US2, US3)
- Chemins de fichiers exacts dans chaque description

## Path Conventions

- Projet unique : `src/` et `tests/` à la racine du dépôt (per plan.md)
- Stack : Svelte 5 + TypeScript strict + Vite/@crxjs + Tailwind CSS 4, Manifest V3

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation du projet et structure de base

- [X] T001 Initialiser le projet à la racine du dépôt : package.json, vite.config.ts (@crxjs/vite-plugin), tsconfig.json (strict) avec Svelte 5, TypeScript 5, @types/chrome — per plan.md Technical Context
- [X] T002 [P] Créer le manifeste MV3 dans src/manifest.ts : permissions ["storage", "alarms"], host_permissions ["https://bible.helloao.org/*"], minimum_chrome_version "127", action.default_popup, background.service_worker — per plan.md Structure Decision
- [X] T003 [P] Configurer l'outillage qualité : eslint.config.js (flat config), .prettierrc, scripts npm (dev/build/check/test) — per constitution II (outils standard, verdicts acceptés)
- [X] T004 Configurer Tailwind CSS 4 via @tailwindcss/vite et l'entrée popup (src/popup/index.html, src/popup/main.ts, src/popup/App.svelte minimal) ; vérifier que npm run build produit dist/ chargeable dans Chrome (dépend de T001, T002)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure partagée que TOUTE user story utilise

**⚠️ CRITICAL**: Aucune user story ne peut commencer avant la fin de cette phase

- [X] T005 Créer le mock des APIs Chrome dans tests/mocks/chrome.ts (storage, alarms, action, runtime — vi.mock) utilisé par toutes les suites de tests
- [X] T006 Implémenter le wrapper chrome.storage.local typé dans src/shared/chrome/storage.ts (get/set/onChanged pour les clés settings, currentCycle, bookIndex — contracts/storage-schema.md) + tests unitaires dans tests/unit/storage.test.ts (dépend de T005)

**Checkpoint**: Fondations prêtes — les user stories peuvent commencer

---

## Phase 3: User Story 1 - Afficher un verset à la demande (Priority: P1) 🎯 MVP

**Goal**: Un clic sur l'icône affiche un verset complet (texte + référence + traduction) en moins de 3 s, sans aucune configuration (FR-001, FR-009, FR-010, FR-011, SC-001, SC-002)

**Independent Test**: Scénarios 1, 2 et 6 de quickstart.md — clic sur l'icône sur installation fraîche → verset < 3 s ; second clic → même verset ; hors connexion → message + « Réessayer »

### Tests for User Story 1

- [X] T007 [P] [US1] Tests de contrat du client API dans tests/unit/api.test.ts per contracts/bible-api.md : shapes books.json/chapitre, timeout 10 s, erreurs réseau/HTTP/JSON mappées vers un type d'erreur utilisateur — écrire d'abord, vérifier l'échec (RED)
- [X] T008 [P] [US1] Tests unitaires de l'extraction de verset dans tests/unit/extract.test.ts : concaténation des chaînes et FormattedText.text, ignorance des VerseFootnoteReference et InlineLineBreak — per data-model.md (Verse)
- [X] T009 [P] [US1] Tests unitaires du tirage pondéré dans tests/unit/random.test.ts : livre pondéré par totalNumberOfVerses, chapitre et verset uniformes — per research.md §2

### Implementation for User Story 1

- [X] T010 [P] [US1] Implémenter l'extraction de verset (fonction pure) dans src/shared/bible/extract.ts et y définir le type Verse (bookId, bookName, chapterNumber, verseNumber, text, translationId, translationName, fetchedAt — data-model.md)
- [X] T011 [P] [US1] Implémenter le tirage aléatoire pondéré (fonction pure) dans src/shared/bible/random.ts
- [X] T012 [US1] Implémenter le client API dans src/shared/bible/api.ts : GET books.json → cache BookIndex (invalidation 30 jours) via le wrapper storage, GET chapitre, timeout 10 s, mapping d'erreurs (dépend de T006)
- [X] T013 [P] [US1] Implémenter le wrapper de messagerie dans src/shared/chrome/runtime.ts (sendMessage/onMessage typés) + tests unitaires dans tests/unit/runtime.test.ts
- [X] T014 [US1] Implémenter l'orchestration dans src/background/service-worker.ts : au message « ensure-current-verse » → si currentCycle.verse est null : tirer un verset (BookIndex → livre pondéré → chapitre → extraction), écrire currentCycle, répondre ; sinon répondre le verset existant (FR-002 : le clic réaffiche sans consommer de tirage) (dépend de T010–T013)
- [X] T015 [P] [US1] Créer VerseView.svelte dans src/popup/components/ (texte du verset, référence « livre chapitre:verset », traduction — FR-009) + tests composant dans tests/component/VerseView.test.ts
- [X] T016 [P] [US1] Créer ErrorView.svelte dans src/popup/components/ (message clair + bouton « Réessayer », jamais d'écran vide — FR-011) + tests composant dans tests/component/ErrorView.test.ts
- [X] T017 [US1] Créer le store du verset courant dans src/popup/lib/verse.svelte.ts : lecture de currentCycle au montage, demande au service worker si null, états loading/erreur — per contracts/ui-behavior.md (dépend de T013, T015, T016)
- [X] T018 [US1] Câbler src/popup/App.svelte (bascule VerseView ↔ ErrorView, « Réessayer » relance la demande — ui-behavior.md) et valider les scénarios 1, 2 et 6 de quickstart.md

**Checkpoint**: MVP fonctionnel — verset à la demande, réaffichage au clic, erreur gracieuse hors connexion

---

## Phase 4: User Story 2 - Affichage automatique à intervalle régulier (Priority: P2)

**Goal**: À chaque échéance de l'intervalle X, la fenêtre s'ouvre automatiquement avec un nouveau verset (FR-003 activation, FR-005, SC-005, edge case « sortie de veille »)

**Independent Test**: Scénarios 4 et 7 de quickstart.md — auto activé + intervalle 1 min → le popup s'ouvre seul ; après veille prolongée → un seul verset, reprise au prochain cycle. En dev, l'activation se fait via la console du service worker (l'UI des réglages arrive avec l'US3).

### Tests for User Story 2

- [X] T019 [P] [US2] Tests unitaires des réglages dans tests/unit/settings.test.ts : défauts (autoDisplayEnabled=false, intervalMinutes=25, translationId='fra_lsg') ; validation de l'intervalle « entier, 1 ≤ x ≤ 1440 » avec refus de 0, négatif, > 1440 (FR-004/FR-008) — RED d'abord
- [X] T020 [P] [US2] Tests unitaires de l'alarme dans tests/unit/alarms.test.ts : création avec periodInMinutes=intervalMinutes, suppression à la désactivation, re-création si absente au démarrage du service worker — per data-model.md (Alarm)

### Implementation for User Story 2

- [X] T021 [P] [US2] Implémenter les réglages dans src/shared/settings/defaults.ts (défauts ci-dessus) et src/shared/settings/validate.ts (contraintes verbatim data-model.md : « entier, 1 ≤ x ≤ 1440 »)
- [X] T022 [P] [US2] Implémenter le wrapper alarms dans src/shared/chrome/alarms.ts : alarme nommée « verse-interval », create/clear/ensure
- [X] T023 [P] [US2] Implémenter le wrapper action dans src/shared/chrome/action.ts : openPopup() avec échec non bloquant (journaliser et continuer — research.md §4)
- [ ] T024 [US2] Étendre src/background/service-worker.ts : garantir l'alarme à onStartup/onInstalled si autoDisplayEnabled ; réagir à storage.onChanged sur settings (recréer/supprimer l'alarme) ; à onAlarm → appeler openPopup() sans condition PUIS tirer un nouveau verset et écrire currentCycle ; en cas d'échec du tirage, le popup affiche ErrorView si aucun verset n'est en cours, sinon l'ancien verset reste (dégradation gracieuse — FR-011, contracts/ui-behavior.md) (dépend de T012, T014, T021–T023) ; valider les scénarios 4, 7 et 8 de quickstart.md

**Checkpoint**: Le pomodoro biblique bat — ouverture automatique à chaque échéance, comportement correct après veille

---

## Phase 5: User Story 3 - Réglages simples et persistants (Priority: P3)

**Goal**: L'utilisateur ajuste activation et intervalle de façon évidente ; les réglages persistent après redémarrage (FR-003, FR-004, FR-006, FR-007, FR-008, SC-003, SC-004)

**Independent Test**: Scénarios 3 et 5 de quickstart.md — activer l'affichage auto, fixer 1 min, redémarrer Chrome → réglages conservés ; saisir 0 puis 1500 → refus avec message, dernière valeur valide conservée

### Implementation for User Story 3

- [ ] T025 [P] [US3] Créer le store réglages dans src/popup/lib/settings.svelte.ts : chargement avec application des défauts si absent, écriture au changement, synchronisation via onChanged — per contracts/storage-schema.md + tests unitaires dans tests/unit/settings-store.test.ts
- [ ] T026 [US3] Créer SettingsView.svelte dans src/popup/components/ + tests composant dans tests/component/SettingsView.test.ts : interrupteur autoDisplayEnabled (état initial false — FR-003), champ intervalle en minutes (défaut 25 — FR-004, bornes 1..1440), saisie invalide refusée avec message compréhensible et dernière valeur valide conservée (FR-008), application immédiate au prochain cycle (dépend de T021, T025)
- [ ] T027 [US3] Ajouter la navigation réglages dans src/popup/App.svelte (bouton engrenage ; afficher un verset ≤ 1 interaction, accéder aux réglages ≤ 2 — FR-007/SC-003) et valider les scénarios 3 et 5 de quickstart.md (persistance après redémarrage — FR-006/SC-004)

**Checkpoint**: Expérience complète — les trois stories fonctionnent indépendamment

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Améliorations transversales aux trois stories

- [ ] T028 Exécuter les portes qualité définies dans package.json (npm run check, npm run test, npm run build) ; corriger tout échec dans les fichiers concernés (constitution — Development Workflow : CI rouge bloque)
- [ ] T029 Exécuter les 8 scénarios de validation de specs/001-biblical-pomodoro/quickstart.md dans Chrome ≥ 127 (dist/ chargé non empaqueté) et consigner les résultats (SC-001 à SC-005)
- [ ] T030 Mettre à jour la documentation des contextes concernés : docs/context/001-verse-display.md, docs/context/001-auto-display.md, docs/context/001-settings.md (statut, décisions d'implémentation) et docs/context/index.md si un statut change (règle projet)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Aucune dépendance — démarrage immédiat
- **Foundational (Phase 2)**: Dépend de Phase 1 — BLOQUE toutes les user stories
- **User Stories (Phases 3–5)**: Dépendent de Phase 2
  - US1 (P1) puis US2 (P2) puis US3 (P3) en séquentiel, ou en parallèle si capacités
  - US2 réutilise l'orchestration du service worker de l'US1 (T014)
  - US3 réutilise defaults/validate de l'US2 (T021)
- **Polish (Phase 6)**: Dépend de la complétion des stories retenues

### User Story Dependencies

- **US1 (P1)**: Démarre après Phase 2 — aucune dépendance aux autres stories
- **US2 (P2)**: Démarre après Phase 2 — s'intègre à US1 (T014) mais testable seule (activation via console du service worker en dev)
- **US3 (P3)**: Démarre après Phase 2 — s'appuie sur T021 (defaults/validate) mais testable seule (persistance observable via l'UI et le redémarrage)

### Within Each User Story

- Tests d'abord (RED) → fonctions pures → client/wrappers → orchestration → UI
- T010–T011 avant T014 ; T021–T023 avant T024 ; T025–T026 avant T027

### Parallel Opportunities

- T002 ∥ T003 (Phase 1) ; T007 ∥ T008 ∥ T009 (tests US1) ; T010 ∥ T011 ∥ T013 ∥ T015 ∥ T016
- T019 ∥ T020 (tests US2) ; T021 ∥ T022 ∥ T023
- Une fois la Phase 2 terminée, les trois stories peuvent avancer en parallèle (équipe) — US2/US3 intègrent ensuite les tâches US1/US2 qu'elles consomment

---

## Parallel Example: User Story 1

```bash
# Lancer ensemble les tests US1 (fichiers différents) :
Task: "Tests de contrat du client API dans tests/unit/api.test.ts"        # T007
Task: "Tests unitaires de l'extraction dans tests/unit/extract.test.ts"  # T008
Task: "Tests du tirage pondéré dans tests/unit/random.test.ts"            # T009

# Puis les modules indépendants ensemble :
Task: "Extraction de verset dans src/shared/bible/extract.ts"            # T010
Task: "Tirage pondéré dans src/shared/bible/random.ts"                    # T011
Task: "Wrapper runtime dans src/shared/chrome/runtime.ts"                 # T013
Task: "VerseView.svelte dans src/popup/components/"                       # T015
Task: "ErrorView.svelte dans src/popup/components/"                       # T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Compléter Phase 1 (Setup) et Phase 2 (Foundational)
2. Compléter Phase 3 (US1)
3. **STOP et VALIDER** : scénarios 1, 2, 6 de quickstart.md — verset à la demande
4. Démo possible : l'extension est utile dès ce point (valeur cœur de la spec)

### Incremental Delivery

1. Setup + Foundational → fondations prêtes
2. + US1 → MVP validé et démontrable
3. + US2 → le pomodoro bat (ouverture automatique)
4. + US3 → réglages persistants, expérience complète
5. Chaque story ajoute de la valeur sans casser les précédentes

### Parallel Team Strategy

1. L'équipe complète Setup + Foundational ensemble
2. Puis : développeur A → US1, développeur B → US2, développeur C → US3
3. US2/US3 s'intègrent aux tâches US1/US2 qu'elles consomment (T014, T021)

---

## Notes

- [P] = fichiers différents, pas de dépendance sur des tâches incomplètes
- [Story] rattache la tâche à sa user story (traçabilité spec ↔ tasks)
- Règle projet : cocher une tâche uniquement après implémentation ET vérification
- Valider chaque checkpoint de story indépendamment avant de continuer
- Committer après chaque tâche ou groupe logique

---

## Phase 7: Convergence

**Origine**: /speckit-converge (2026-10-23) — écarts entre l'état du code et spec/plan/tasks/constitution non couverts par les tâches existantes. T013–T030 restent le plan tracé ; cette phase ne couvre que les trous détectés.

- [X] T031 Créer le workflow CI .github/workflows/ci.yml (Node 20, npm ci, puis format check + lint + type check + tests + build sur chaque push/PR) et ajouter les scripts npm `lint` et `format` manquants dans package.json — le dépôt n'a aucun CI alors que la Constitution l'exige (« CI MUST run format check, lint, type check, and tests on every PR » ; principe IV : « CI enforces these gates ») per Constitution Development Workflow (missing) — CRITICAL
- [ ] T032 Ajouter la vérification « bundle du popup < 300 Ko gzippé » aux portes qualité (mesurer après npm run build, compléter T028) per plan.md Performance Goals (missing)
- [ ] T033 Trancher l'« invitation à prendre une pause » et la documenter dans contracts/ui-behavior.md (option A : l'ouverture automatique du popup EST l'invitation, aucun libellé ; option B : libellé dédié dans VerseView → aligner T015) per spec.md clarification 2026-10-20 (partial)
- [ ] T034 Supprimer le bloc résiduel « SYNC IMPACT REPORT » (matériau temporaire committé malgré sa note « remove before committing ») de .specify/memory/constitution.md per Constitution Governance (unrequested)
