# Data Model — Minuteur Pomodoro

**Feature**: 002-pomodoro-timer · **Date**: 2026-10-24

Entités dérivées de la spec (FR-001..FR-014) et de
[research.md](research.md). Le détail des clés de stockage est dans
[contracts/storage-schema.md](contracts/storage-schema.md), celui des
messages dans [contracts/runtime-messages.md](contracts/runtime-messages.md).
Les entités Verse, CurrentCycle et BookIndex de la feature 001 sont
inchangées (voir
[../001-biblical-pomodoro/data-model.md](../001-biblical-pomodoro/data-model.md)).

## PomodoroState (État du minuteur)

La situation du minuteur à un instant donné. Clé `pomodoroState` — seul le
service worker écrit ; le popup lit (message réconcilié puis `onChanged`).

| Champ | Type | Description |
| --- | --- | --- |
| `status` | `"focus" \| "break" \| "longBreak"` | Phase courante (FR-002) |
| `repetition` | number | Répétition courante du cycle, 1 à X (FR-003) |
| `running` | boolean | `true` = lecture (défaut), `false` = suspendu (FR-004) |
| `phaseEndsAt` | number \| null | Epoch ms de fin de la phase — défini ssi `running` |
| `phaseRemainingMs` | number \| null | Temps restant figé — défini ssi `!running` (FR-004) |

**Invariants** : `running ⇔ phaseEndsAt !== null` ;
`!running ⇔ phaseRemainingMs !== null`. `repetition` désigne le numéro du
focus (et de la pause qui le suit) dans le cycle courant.

### Machine à états

```text
(installation) ──────────────> focus (rep 1, lecture)
focus [rep < X] ──fin du décompte──> break (rep inchangée)      [auto, FR-006]
focus [rep ≥ X] ──fin du décompte──> longBreak (rep inchangée)  [auto, FR-006]
break ────────next────────────> focus (rep + 1, lecture)        [FR-005]
longBreak ────next────────────> focus (rep 1, lecture) — nouveau cycle [FR-005]
toute phase ───pause──────────> suspendu (phaseRemainingMs)     [FR-004]
suspendu ──────play───────────> même phase, même position (lecture) [FR-004]
```

Aucune transition directe break → focus ou longBreak → focus autre que
`next` (FR-001). La fin du décompte d'une pause ne change PAS le statut :
l'état légal est « attente de next » (FR-005/FR-007).

### Transitions pures (`shared/pomodoro/state.ts`)

Toutes prennent l'état courant, les réglages et `now` (epoch ms), rendent
le nouvel état — aucune I/O, testables sans Chrome (constitution IV) :

| Fonction | Rôle |
| --- | --- |
| `initialPomodoroState(settings, now)` | focus, répétition 1, lecture, `phaseEndsAt = now + focusMinutes` |
| `advanceAfterFocusEnd(state, settings, now)` | break si `repetition < X`, sinon longBreak ; lecture ; nouvelle échéance selon la phase |
| `startNextFocus(state, settings, now)` | focus, `repetition + 1` depuis break, `1` depuis longBreak ; lecture (l'action next relance le décompte, edge case spec) |
| `suspendPomodoro(state, now)` | `phaseRemainingMs = max(0, phaseEndsAt - now)`, `running = false` |
| `resumePomodoro(state, now)` | `phaseEndsAt = now + phaseRemainingMs`, `running = true` ; reste à 0 en pause → état « attente de next », aucune alarme |
| `reconcilePomodoro(state, settings, now)` | lecture : si focus échué → `advanceAfterFocusEnd` ; si pause échue → état inchangé (attente de next) |

Règle de comparaison : fin de focus → longue pause si et seulement si
`repetition >= settings.repetitionsBeforeLongBreak` (robuste à un
changement de X en cours de cycle — research.md §6).

## Settings (extension)

La forme 001 est étendue de quatre champs. Champs 001 inchangés
(`autoDisplayEnabled`, `intervalMinutes`, `translationId`).

| Champ | Type | Défaut | Validation |
| --- | --- | --- | --- |
| `focusMinutes` | number | `25` | entier, 1 ≤ x ≤ 1440 (FR-009/FR-011) |
| `breakMinutes` | number | `5` | entier, 1 ≤ x ≤ 1440 (FR-009/FR-011) |
| `longBreakMinutes` | number | `15` | entier, 1 ≤ x ≤ 1440 (FR-009/FR-011) |
| `repetitionsBeforeLongBreak` | number | `4` | entier, 1 ≤ x ≤ 10 (FR-009/FR-011) |

**Migration** : les installations 001 n'ont pas ces champs —
`readSettings(stored)` (`shared/settings/defaults.ts`) fusionne
`{ ...DEFAULT_SETTINGS, ...stored }` à chaque lecture, partout (popup et
service worker). Toute valeur invalide est refusée à la saisie avec un
message compréhensible et la dernière valeur valide conservée (FR-011,
pattern 001 FR-008).

## Alarm (Minuteur pomodoro) — état dérivé

| Attribut | Valeur |
| --- | --- |
| Nom | `pomodoro-phase` |
| Type | one-shot, `{ when: phaseEndsAt }` |

Cycle de vie : créée à l'initialisation, à chaque transition de phase et à
la reprise ; supprimée à la suspension et par `next` depuis une pause à
décompte terminé (aucune phase ne tourne alors). Jamais ajustée à l'écriture
des réglages (FR-012 — research.md §6). L'alarme `verse-interval` de la
feature 001 coexistte sans interaction (hypothèse spec).

## Messages popup ↔ service worker

Quatre types kebab-case, réponse = `PomodoroState` : détail et règles dans
[contracts/runtime-messages.md](contracts/runtime-messages.md). Le verset
affiché à la fin de chaque focus (FR-006) réutilise l'entité `CurrentCycle`
de 001 — tirage neuf, dégradation gracieuse inchangée (FR-014).
