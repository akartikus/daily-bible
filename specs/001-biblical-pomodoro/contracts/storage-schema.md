# Contract — Schéma de stockage `chrome.storage.local`

**Feature**: 001-biblical-pomodoro · **Date**: 2026-10-20

Zone : `chrome.storage.local` (quota 10 Mo). Permission manifest :
`storage`. Formes détaillées des valeurs :
[../data-model.md](../data-model.md).

## Clés

| Clé | Type | Écrivain | Lecteurs |
| --- | --- | --- | --- |
| `settings` | Settings | popup (SettingsView) | service worker, popup |
| `currentCycle` | CurrentCycle | service worker | popup |
| `bookIndex` | BookIndex | service worker | service worker |

## Règles d'accès

- `settings` : écrite par la vue Réglages ; le service worker réagit via
  `chrome.storage.onChanged` (recrée ou supprime l'alarme `verse-interval`
  selon `autoDisplayEnabled` et `intervalMinutes`).
- `currentCycle` : seul le service worker écrit (tirage à l'échéance de
  l'alarme ou à l'initialisation au premier usage) ; le popup lit au
  montage et observe `onChanged` pendant son ouverture.
- `bookIndex` : cache privé du service worker.
- Valeurs par défaut : si `settings` est absent, `defaults.ts` s'applique
  (25 min, affichage auto désactivé, `fra_lsg`) — expérience
  « zéro réglage » (SC-002).

## Migration / compatibilité

v1 : les trois clés existent dès la première version ; toute clé inconnue
est ignorée à la lecture. Aucune migration prévue en v1 ; tout changement
de forme passera par une tâche explicite dans `tasks.md`.
