# Contract — Messages popup ↔ service worker (002)

**Feature**: 002-pomodoro-timer · **Date**: 2026-10-24

Extension du canal existant (`chrome.runtime.sendMessage` /
`onMessage`, wrappers `shared/chrome/runtime.ts`). Types kebab-case comme
« ensure-current-verse » (001). Le service worker est l'unique écrivain de
`pomodoroState` : le popup commande, le service worker tranche.

## Types de message

| Message `popup → SW` | Réponse `SW → popup` | Effet |
| --- | --- | --- |
| `{ type: "pomodoro-get-state" }` | `PomodoroState` | Aucune écriture si l'état est à jour ; réconcilie sinon (règle ci-dessous) |
| `{ type: "pomodoro-pause" }` | `PomodoroState` | `suspendPomodoro` + suppression de l'alarme `pomodoro-phase` |
| `{ type: "pomodoro-resume" }` | `PomodoroState` | `resumePomodoro` + recréation de l'alarme (aucune alarme si pause à décompte terminé) |
| `{ type: "pomodoro-next" }` | `PomodoroState` | `startNextFocus` + recréation de l'alarme — valide UNIQUEMENT en break/longBreak |

Forme `PomodoroState` : voir [../data-model.md](../data-model.md). Ces
quatre commandes sont des opérations locales (aucun réseau) : la réponse
est TOUJOURS un `PomodoroState` — pas de chemin d'erreur. Si l'état est
absent du stockage, il est initialisé avant traitement (focus, répétition 1,
lecture).

## Règles

- **Réconciliation à la lecture** (`pomodoro-get-state`) : si un focus est
  échué sans que l'alarme n'ait encore tiré, le service worker exécute
  immédiatement la transition de fin de focus (pause/longue pause, ouverture
  du popup, tirage du verset dans `currentCycle`) puis répond avec le nouvel
  état ; si une pause est échue, l'état « attente de next » est légal et
  retourné tel quel (SC-001 — research.md §4).
- **`pomodoro-next` ignoré hors pause** : reçu en phase focus, il ne change
  rien et répond avec l'état courant — le bouton n'est pas proposé en focus
  (edge case spec), le service worker reste défensif.
- **L'action next relance le décompte** : `next` produit toujours un focus en
  lecture, même si le minuteur était suspendu pendant la pause (edge case
  spec).
- **`pomodoro-pause` / `pomodoro-resume` valides dans toute phase**
  (FR-004), y compris pendant une pause à décompte terminé (reste figé à 0 —
  aucune alarme à la reprise).
- Le message « ensure-current-verse » (001) est inchangé et indépendant.

## Alarme `pomodoro-phase` (déclencheur côté SW)

À l'échéance de l'alarme one-shot `pomodoro-phase`, le service worker lit
l'état :

- **status = focus** → `openPopup()` (non bloquant), tirage d'un verset neuf
  dans `currentCycle` (dégradation gracieuse FR-014 : en cas d'échec,
  l'ancien verset reste, la transition a lieu quand même), puis
  `advanceAfterFocusEnd` + nouvelle alarme.
- **status = break ou longBreak** → `openPopup()` seul (le « repop » de
  FR-007) : le bouton next est présenté, AUCUNE transition automatique
  (FR-005). Aucune nouvelle alarme.
- **état suspendu** → ignoré (aucune alarme ne devrait exister — défensif).
