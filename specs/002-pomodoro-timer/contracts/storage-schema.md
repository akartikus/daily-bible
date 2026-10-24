# Contract — Schéma de stockage `chrome.storage.local` (additif 002)

**Feature**: 002-pomodoro-timer · **Date**: 2026-10-24

Additif au contrat 001
([../../001-biblical-pomodoro/contracts/storage-schema.md](../../001-biblical-pomodoro/contracts/storage-schema.md)) :
une nouvelle clé, une forme `settings` étendue. Zone : `chrome.storage.local`
(quota 10 Mo). Formes détaillées : [../data-model.md](../data-model.md).

## Clés

| Clé | Type | Écrivain | Lecteurs |
| --- | --- | --- | --- |
| `settings` | Settings (étendu) | popup (SettingsView) | service worker, popup |
| `pomodoroState` | PomodoroState | service worker (unique) | service worker, popup (via `onChanged`) |
| `currentCycle` | CurrentCycle (001) | service worker (unique) | popup |
| `bookIndex` | BookIndex (001) | service worker | service worker |

## Règles d'accès

- `pomodoroState` : seul le service worker écrit — transitions d'alarme,
  initialisation au démarrage, actions reçues par message. Le popup ne
  lit JAMAIS cette clé directement pour s'afficher : il demande l'état au
  service worker (`pomodoro-get-state`, réconcilié —
  [runtime-messages.md](runtime-messages.md)) puis observe `onChanged`.
- `settings` : la vue Réglages écrit ; toute lecture passe par
  `readSettings(stored) = { ...DEFAULT_SETTINGS, ...stored }` — les
  installations 001 sans champs pomodoro reçoivent les défauts (25 / 5 / 15 /
  X = 4). Aucune réaction du service worker à l'écriture : chaque
  transition relit les réglages à frais (FR-012 — research.md §6).
- `currentCycle` : inchangé — le service worker y écrit le verset neuf à la
  fin de chaque focus (FR-006), en plus de l'échéance `verse-interval`
  existante.

## Alarmes (état dérivé, pas stocké)

| Nom | Type | Propriétaire |
| --- | --- | --- |
| `verse-interval` (001) | périodique | inchangé — affichage auto à intervalle |
| `pomodoro-phase` (002) | one-shot `{ when }` | service worker pomodoro |

Les deux alarmes coexistent sans interaction (hypothèse spec :
l'affichage automatique 001 reste indépendant).

## Migration / compatibilité

- Installation 001 existante : `settings` sans champs pomodoro → défauts
  appliqués par `readSettings` ; `pomodoroState` absent → initialisé au
  premier contact (focus, répétition 1, lecture).
- Toute clé inconnue reste ignorée à la lecture. Aucun retrait de champ en
  v1 ; tout changement de forme passera par une tâche explicite dans
  `tasks.md`.
