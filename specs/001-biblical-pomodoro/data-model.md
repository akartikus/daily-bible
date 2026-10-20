# Data Model — Pomodoro Biblique

**Feature**: 001-biblical-pomodoro · **Date**: 2026-10-20

Entités dérivées de la spec (FR-001..FR-011) et de [research.md](research.md).
Le détail des clés de stockage est dans
[contracts/storage-schema.md](contracts/storage-schema.md).

## Verse (Verset)

Un passage biblique affichable.

| Champ | Type | Description |
| --- | --- | --- |
| `bookId` | string | ID du livre dans l'API (ex. `GEN`) |
| `bookName` | string | Nom commun du livre (ex. `Genèse`) |
| `chapterNumber` | number | Numéro du chapitre |
| `verseNumber` | number | Numéro du verset |
| `text` | string | Texte du verset (chaînes concaténées, notes exclues) |
| `translationId` | string | `fra_lsg` (v1) |
| `translationName` | string | `Louis Segond 1910` |
| `fetchedAt` | number | Epoch ms de la récupération |

Identité naturelle : `(translationId, bookId, chapterNumber, verseNumber)`.
Règle d'extraction : le texte concatène les chaînes et les
`FormattedText.text` du `content` du verset, en ignorant les références de
notes et les sauts de ligne internes. FR-009 : la référence complète
(livre, chapitre, verset) et la traduction sont affichées avec le texte.

## Settings (Réglages)

| Champ | Type | Défaut | Validation |
| --- | --- | --- | --- |
| `autoDisplayEnabled` | boolean | `false` | opt-in explicite (FR-003) |
| `intervalMinutes` | number | `25` | entier, 1 ≤ x ≤ 1440 (FR-004/FR-008) |
| `translationId` | string | `'fra_lsg'` | constante en v1, non exposée dans l'UI |

Règles : toute valeur d'intervalle invalide est refusée avec un message
compréhensible et la dernière valeur valide est conservée (edge case spec).
Persistance : `chrome.storage.local`, clé `settings` (FR-006/SC-004).

## CurrentCycle (Verset en cours)

État du cycle courant du pomodoro.

| Champ | Type | Description |
| --- | --- | --- |
| `verse` | Verse \| null | Verset du cycle courant (`null` avant le premier affichage) |
| `startedAt` | number | Epoch ms de l'entrée en vigueur du verset |

Transitions d'état :

```text
(null) --clic icône (premier usage)--> verse
(null) --échéance alarme------------> verse
verse  --échéance alarme------------> nouveau verse (tirage aléatoire)
verse  --clic icône-----------------> verse (réaffichage, AUCUNE transition)
```

Règles : le clic manuel ne consomme pas de tirage et n'affecte pas le
minuteur (clarification du 2026-10-20) ; seul le service worker écrit cette
entité.

## BookIndex (Cache de l'index des livres)

| Champ | Type | Description |
| --- | --- | --- |
| `translationId` | string | `fra_lsg` |
| `books` | BookSummary[] | 66 entrées |
| `fetchedAt` | number | Epoch ms |

`BookSummary` : `{ id, commonName, numberOfChapters, totalNumberOfVerses }`
(extrait de `books.json`). Alimente le tirage pondéré (research.md §2).
Invalidation : re-téléchargé si absent ou si `fetchedAt` date de plus de
30 jours (données statiques).

## Alarm (Minuteur) — état dérivé

| Attribut | Valeur |
| --- | --- |
| Nom | `verse-interval` |
| `periodInMinutes` | `settings.intervalMinutes` |

Cycle de vie : créée/recréée à l'activation de l'affichage automatique et à
chaque changement d'intervalle ; supprimée à la désactivation ; vérifiée et
recréée si absente à chaque démarrage du service worker (recommandation
officielle `chrome.alarms`). L'alarme n'est PAS remise à zéro par un clic
manuel (rythme fixe).
