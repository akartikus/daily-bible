# Réglages et persistance

## Description

L'utilisateur active ou désactive l'affichage automatique et définit
l'intervalle en minutes (défaut 25). Les réglages s'appliquent au prochain
cycle et sont conservés après un redémarrage du navigateur.

## Feature et spécification liées

- Feature : 001-biblical-pomodoro
- [specs/001-biblical-pomodoro/spec.md](../../specs/001-biblical-pomodoro/spec.md) — User Story 3 (P3)

## Décisions techniques

- **Stockage** : `chrome.storage.local`, clé `settings` — disponible dans le
  service worker, persiste après redémarrage.
- **Défauts** : `autoDisplayEnabled = false`, `intervalMinutes = 25`,
  `translationId = 'fra_lsg'`.
- **Validation** : intervalle entier, 1 ≤ x ≤ 1440 ; toute saisie invalide
  est refusée avec un message compréhensible et la dernière valeur valide
  conservée.
- **Application** : le service worker observe `storage.onChanged` et
  recrée/supprime l'alarme en conséquence.

## Points d'attention

- Budget d'interactions : afficher un verset ≤ 1, accéder aux réglages ≤ 2
  depuis l'icône.
- `window.localStorage` écarté : indisponible dans le service worker MV3.
