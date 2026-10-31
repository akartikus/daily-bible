---
description: "Task list for internationalisation et refonte graphique implementation"
---

# Tasks: Internationalisation et refonte graphique

**Input**: Design documents from `/specs/003-i18n-ui-redesign/`

**Prerequisites**: spec.md ✅, plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: inclus (constitution IV) — chaque tâche embarque ses tests. Décision
utilisateur : les travaux réalisables ensemble sont **regroupés** — une tâche =
un module cohérent (implémentation + tests), pas de décomposition artificielle.

**Organization**: Tâches groupées par user story (US1 = P1 … US3 = P3 d'après
spec.md) pour permettre implémentation et validation indépendantes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, pas de dépendance sur des tâches incomplètes)
- **[Story]**: User story de rattachement (US1…US3)
- Chemins de fichiers exacts dans chaque description

## Path Conventions

- Projet unique : `src/` et `tests/` à la racine du dépôt (per plan.md)
- Stack existante : Svelte 5 + TypeScript strict + Vite/@crxjs + Tailwind CSS 4, Manifest V3
- Nouveaux paquets (plan.md) : `@lucide/svelte` ; shadcn-svelte (`bits-ui`, `tailwind-variants`, `tailwind-merge`, `clsx`, `tw-animate-css`)

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Installer le design system et les icônes — tout ce que US2/US3 consomment

- [X] T001 Installer le design system et les icônes : `@lucide/svelte` (imports par icône, tree-shaké) + init shadcn-svelte (`npx shadcn-svelte@latest init` → `components.json`, dépendances `bits-ui`/`tailwind-variants`/`tailwind-merge`/`clsx`/`tw-animate-css`) + `npx shadcn-svelte@latest add button input label switch` → sources copiées dans src/popup/components/ui/ + variables de thème (`:root`, `@theme inline`, `@custom-variant dark`, palette neutre du thème par défaut — research.md §4) dans src/popup/app.css ; vérifier `npm run check`, `npm run lint` et `npm run build` sur cette base (config eslint/svelte-check ajustée si les sources copiées l'exigent)

---

## Phase 2: Foundational (Prérequis bloquants)

**Purpose**: Infrastructure de langue partagée par TOUTES les user stories

**⚠️ CRITICAL**: Aucune user story ne peut commencer avant la fin de cette phase

- [ ] T002 [P] Créer le catalogue i18n src/shared/i18n/ : `en.ts` (source du type `Messages`), `fr.ts` (typé `Messages` — complétude garantie à la compilation), `index.ts` (`type UiLocale = "fr" | "en"`, `resolveUiLocale(language: string): UiLocale` — préfixe `fr` variantes régionales incluses → `"fr"`, tout le reste **y compris valeur absente** → `"en"` fallback ; `getMessages(locale): Messages`) avec TOUTES les clés de contracts/i18n.md (libellés FR/EN convenus verbatim dans le contrat) + étendre tests/mocks/chrome.ts avec `i18n.getUILanguage` (valeur pilotable par test) + tests unitaires dans tests/unit/i18n.test.ts (fr, fr-CA, fr-BE, en-US, en-GB, de, es, absent → en ; lecture du catalogue aux deux locales)

- [ ] T003 Faire suivre la traduction biblique à la locale — per data-model.md et contracts/i18n.md §Traductions : table `Record<UiLocale, { id, name }>` dans src/shared/bible/draw.ts (`fr → fra_lsg / Louis Segond 1910`, `en → eng_kjv / King James Version`, `translationForLocale(locale)` — remplace les constantes uniques `TRANSLATION_ID`/`TRANSLATION_NAME`) ; `BibleApiError` porte un **code** `"bible-unavailable"` (plus de texte FR codé dur) dans src/shared/bible/api.ts ; cache de l'index **préfixé par traduction** (`bookIndex:fra_lsg`, `bookIndex:eng_kjv` — l'index diffère entre traductions, TTL 30 jours inchangé) ; supprimer le champ mort `translationId` de src/shared/settings/defaults.ts (valeur stockée ignorée par `readSettings`, aucune migration) ; étendre `StorageKey` dans src/shared/chrome/storage.ts (`"settings" | "currentCycle" | "pomodoroState" | \`bookIndex:${string}\``) ; src/background/service-worker.ts et src/background/pomodoro.ts tirent via `translationForLocale(resolveUiLocale(chrome.i18n.getUILanguage()))` ; tests étendus dans tests/unit/draw.test.ts, tests/unit/api.test.ts, tests/unit/settings.test.ts, tests/unit/storage.test.ts et tests/unit/service-worker.test.ts (dépend de T002)

**Checkpoint**: Fondations prêtes — la langue se résout et le verset suit la locale

---

## Phase 3: User Story 1 - Interface dans la langue du navigateur (Priority: P1) 🎯 MVP

**Goal**: Tous les textes d'interface s'affichent en français (navigateur FR) ou en anglais (tout autre navigateur), sans mélange — FR-001/FR-002/FR-003/FR-004

**Independent Test**: Scénarios 1–3 (+4–5 pour le verset) de quickstart.md — deux profils de langue Chrome, aucun texte non traduit

### Implementation for User Story 1

- [ ] T004 [US1] Migrer tous les textes d'interface du popup vers le catalogue — per contracts/i18n.md (aucune chaîne hors catalogue, FR-003) : résoudre la locale au chargement de src/popup/App.svelte (`getMessages(resolveUiLocale(chrome.i18n.getUILanguage()))`, une fois par ouverture — un changement de langue navigateur s'applique à la prochaine ouverture) ; remplacer les textes codés en dur de App.svelte (`Chargement…`, `Réglages`, `Retour au verset`), src/popup/components/ErrorView.svelte (message + `Réessayer`), src/popup/components/SettingsView.svelte (libellés des 5 réglages + messages `Entrez un nombre entier entre 1 et 1440.` / `… entre 1 et 10.`), src/popup/components/PomodoroStatus.svelte (`Focus` / `Pause` / `Longue pause`, `répétition {n} / {X}`) ; migrer les getters/erreurs des stores (`statusLabel`, messages d'erreur) de src/popup/lib/pomodoro.svelte.ts et src/popup/lib/verse.svelte.ts vers des clés du catalogue (le code `BibleApiError` est résolu en texte à l'affichage) ; les journaux développeur du service worker restent hors catalogue ; tests mis à jour pour s'exécuter et affirmer aux **deux locales** (mock `getUILanguage` pilotable) : tests/component/App.test.ts, tests/component/PomodoroStatus.test.ts, tests/component/SettingsView.test.ts, tests/unit/pomodoro-store.test.ts, tests/unit/verse-store.test.ts (dépend de T002, T003)

**Checkpoint**: MVP validé — l'interface entière suit la langue du navigateur

---

## Phase 4: User Story 2 - Boutons épurés en icônes seules (Priority: P2)

**Goal**: Tous les boutons sont des icônes seules discrètes, cliquables, avec un libellé accessible traduit — FR-005

**Independent Test**: Scénarios 6–7 de quickstart.md — parcourir toutes les vues : aucun texte de bouton visible, chaque action identifiée au survol/lecteur d'écran

### Implementation for User Story 2

- [ ] T005 [US2] Remplacer tous les boutons par des icônes seules — per contracts/ui-behavior.md (mapping Lucide convenu verbatim) : `Button` shadcn-svelte taille `icon` variantes discrètes (`outline`/`ghost`) + icônes `@lucide/svelte` ; src/popup/components/PomodoroStatus.svelte (`Pause`/`Play` pour play/pause — action opposée à l'état, `SkipForward` pour next — visibilité inchangée en pause/longue pause), src/popup/App.svelte (`Settings` engrenage, `Undo2` retour au verset), src/popup/components/ErrorView.svelte (`RotateCcw` réessayer) ; chaque bouton porte `aria-label` + `title` traduits (jamais vide — `aria.pause`/`aria.resume`/`aria.next`/`aria.settings`/`settings.backToVerse`/`aria.retry`) ; la barre X segments reste un div custom stylé avec les tokens du thème (comportement inchangé) ; tests composant mis à jour (sélecteurs par nom accessible traduit, aux deux locales) dans tests/component/PomodoroStatus.test.ts, tests/component/App.test.ts (dépend de T001, T004)

**Checkpoint**: Tous les boutons sont des icônes épurées, accessibles et traduites

---

## Phase 5: User Story 3 - Paramètres deux colonnes et charte épurée (Priority: P3)

**Goal**: Les réglages en lignes libellé | champ alignées sur deux colonnes, et la charte épurée cohérente sur les 5 vues — FR-008/FR-009/FR-010

**Independent Test**: Scénarios 8–10 de quickstart.md — gouttière verticale identique sur toutes les lignes (y compris pendant une erreur), charte identique de vue en vue

### Implementation for User Story 3

- [ ] T006 [US3] Mettre les réglages en deux colonnes et appliquer la charte — per contracts/ui-behavior.md : src/popup/components/SettingsView.svelte — chaque réglage devient une ligne de grille partagée `grid-cols-[1fr_auto] items-center` : `Label` à gauche, `Input`/`Switch` à droite, gouttière verticale identique pour toutes les lignes ; le message d'erreur traduit s'affiche **sous le champ concerné** (colonne 2) sans décaler l'alignement des lignes suivantes ; comportement de validation inchangé (refus à la saisie, dernière valeur valide conservée) ; passe de charte sur les autres vues avec les tokens du thème (typographie/espacements de VerseView, état de chargement de App.svelte, conteneur de PomodoroStatus) — palette sobre, pas de couleur vive hors tokens (SC-006) ; tests composant étendus (alignement deux colonnes, erreurs localisées sans casse d'alignement) dans tests/component/SettingsView.test.ts et tests/component/App.test.ts (dépend de T004, T005)

**Checkpoint**: Expérience complète — les trois stories fonctionnent indépendamment

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Améliorations transversales aux trois stories

- [ ] T007 Exécuter les portes qualité de package.json : npm run check, npm run test, npm run lint, npm run format, npm run build, npm run check:size (bundle < 300 Ko gzippé — surveiller l'apport de `bits-ui`/Lucide) ; corriger tout échec dans les fichiers concernés (constitution — CI rouge bloque)

- [ ] T008 Valider les 12 scénarios de specs/003-i18n-ui-redesign/quickstart.md dans Chrome ≥ 127 avec **deux profils de langue** (FR + EN/autre, `dist/` chargé non empaqueté) et consigner les résultats dans docs/context/003-validation.md + mise à jour de docs/context/index.md (règle projet)

- [ ] T009 Mettre à jour la documentation : docs/context/003-i18n-ui-redesign.md (statut Actif, décisions finales), docs/context/index.md et docs/release-notes.md (une ligne courte par tâche terminée, style existant — règle projet)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 sans dépendance
- **Foundational (Phase 2)**: T002 sans dépendance ; T003 dépend de T002 (type `UiLocale`)
- **User Stories (Phases 3–5)**: Toutes dépendent de la Phase 2
  - US1 (T004) dépend de T002 + T003 — **ne dépend pas de T001** (migration de textes pure)
  - US2 (T005) dépend de T001 (design system) + T004 (clés aria du catalogue)
  - US3 (T006) dépend de T004 + T005 (mêmes fichiers SettingsView/PomodoroStatus — séquentiel)
- **Polish (Phase 6)**: Dépend des trois stories

### User Story Dependencies

- **US1 (P1)**: Après T002–T003 — MVP indépendant, aucune dépendance aux stories suivantes
- **US2 (P2)**: Après T001 + US1 — étend les mêmes composants en icônes
- **US3 (P3)**: Après US1 + US2 — mêmes fichiers, dernier par ordre de priorité

### Within Each User Story

- Tests écrits avec l'implémentation (tâches combinées — décision utilisateur)
- Comportement fonctionnel 001/002 inchangé et vérifié à chaque story (FR-011)
- Story complète et validée (scénarios quickstart) avant la suivante

### Parallel Opportunities

- T001 ∥ T002 (fichiers disjoints : paquets/CSS vs `shared/i18n/` + tests)
- Ensuite séquentiel : T003 → T004 → T005 → T006 (les stories partagent SettingsView/PomodoroStatus/App — la combinaison en tâches unitaires rend le flux linéaire par conception)

---

## Parallel Example: Phase 1–2

```bash
# Lancer ensemble les modules indépendants :
Task: "Design system shadcn-svelte + Lucide (T001)"   # paquets + src/popup/components/ui/ + app.css
Task: "Catalogue i18n + mock getUILanguage (T002)"    # src/shared/i18n/ + tests/unit/i18n.test.ts

# Puis :
Task: "Traductions bibliques suivent la locale (T003)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 ∥ T002 (setup + catalogue)
2. T003 (fondations langue)
3. T004 (US1)
4. **STOP et VALIDER** : scénarios 1–5 de quickstart.md sur deux profils de langue
5. Démo possible : l'extension entière parle la langue du navigateur

### Incremental Delivery

1. Setup + fondations → la langue se résout, le verset suit
2. + US1 → interface traduite (MVP)
3. + US2 → boutons épurés en icônes
4. + US3 → paramètres alignés, charte cohérente
5. Chaque story ajoute de la valeur sans casser les précédentes

---

## Notes

- Tâches **volontairement regroupées** (décision utilisateur) : une tâche = un module cohérent avec ses tests ; pas de tâche artificiellement découpée
- Règle projet : cocher une tâche uniquement après implémentation ET vérification
- Format des commits (règle projet) : `003-<numéro-de-tâche>: <message en anglais>` (ex. `003-T004: Translate all popup strings via i18n catalog`)
- Valider chaque checkpoint de story indépendamment avant de continuer
- Committer après chaque tâche ou groupe logique