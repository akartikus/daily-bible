# Data Model — Internationalisation et refonte graphique

**Feature**: 003-i18n-ui-redesign · **Date**: 2026-10-31

Entités dérivées de la spec (FR-001..FR-011) et de
[research.md](research.md). Le détail des clés de stockage est dans
[contracts/i18n.md](contracts/i18n.md#stockage), celui des clés de
traduction dans [contracts/i18n.md](contracts/i18n.md#catalogue). Les entités
Verse, CurrentCycle, PomodoroState et Alarm des features 001/002 sont
inchangées (voir
[../002-pomodoro-timer/data-model.md](../002-pomodoro-timer/data-model.md)).

## UiLocale (Langue d'interface)

La langue d'affichage de l'extension. Valeurs possibles : `"fr" | "en"`.

| Attribut | Description |
| --- | --- |
| Source | `chrome.i18n.getUIanguage()` au chargement du popup (FR-004) |
| Résolution | préfixe `fr` (variantes régionales `fr-CA`, `fr-BE`… incluses) → `"fr"` ; toute autre valeur ou absence → `"en"` (fallback) |
| Persistance | aucune — dérivée à chaque ouverture du popup, jamais un réglage |

## Messages (Catalogue de textes)

L'ensemble des textes d'interface, par langue. Objet plat de clés
hiarchisées (`status.*`, `buttons.*`, `settings.*`, `errors.*`, `aria.*`)
vers chaînes et fonctions de mise en forme.

| Règle | Description |
| --- | --- |
| Type | `type Messages = typeof en` — `fr: Messages` garantit la complétude à la compilation |
| Couverture | chaque texte visible ou accessible (aria-label, title) de 001/002 existe dans les deux langues (FR-003) |
| Exclusions | contenu des versets (fourni par l'API), journaux développeur du service worker |
| Mise en forme | `repetition(current, total)` — fonction pure, pas de substitution de templates |

## Translation (Traduction biblique)

La traduction des versets associée à une locale. Table
`Record<UiLocale, { id, name }>` dans `src/shared/bible/draw.ts` — remplace
les constantes uniques `TRANSLATION_ID`/`TRANSLATION_NAME` (comportement de
tirage inchangé, [research.md §2](research.md)).

| Locale | id | name | Notes |
| --- | --- | --- | --- |
| `"fr"` | `"fra_lsg"` | Louis Segond 1910 | inchangé depuis 001 |
| `"en"` | `"eng_kjv"` | King James Version | vérifié sur `available_translations.json` (2026-10-31) : 66 livres / 1 189 chapitres / 31 102 versets |

Le verset tiré porte `translationId`/`translationName` (et des noms de
livres localisés) depuis la traduction de la locale : aucun mappage de noms
de livres côté extension.

## Settings (extension rétrécie)

La forme 002 moins un champ mort. Champs inchangés : `autoDisplayEnabled`,
`intervalMinutes`, `focusMinutes`, `breakMinutes`, `longBreakMinutes`,
`repetitionsBeforeLongBreak` (validations inchangées).

| Champ supprimé | Raison |
| --- | --- |
| `translationId` | jamais éditable en UI (001), jamais lu — la traduction est désormais dérivée de la locale (FR-004) |

**Migration** : `readSettings` fusionne les défauts sur la valeur stockée ;
une installation 001/002 avec `translationId` stocké voit simplement la
valeur ignorée (clé orpheline tolérée, aucun code de migration).

## Cache de l'index des livres (clé dérivée)

L'index `books.json` diffère entre traductions (comptages, langue des noms).
La clé de cache `bookIndex` devient `bookIndex:<translationId>`
(`bookIndex:fra_lsg`, `bookIndex:eng_kjv`) ; TTL 30 jours inchangé.
`StorageKey` est étendu en `"settings" | "currentCycle" | "pomodoroState" |
(`bookIndex:${string}`)` — la clé ne fait plus partie de l'union littérale
fermée.

## Bouton icône (entité UI)

Action cliquable représentée par une icône seule (Lucide via
`@lucide/svelte`).

| Attribut | Description |
| --- | --- |
| Icône | composant Lucide importé par icône (tree-shaké) |
| Libellé accessible | traduit par la locale (`aria-label` + `title`), obligatoire — FR-005 |
| Variantes shadcn | `Button` taille `icon`, variantes `outline`/`ghost` (discrétion, charte épurée) |
| Visibilité conditionnelle | inchangée (ex. next uniquement en pause/longue pause) |