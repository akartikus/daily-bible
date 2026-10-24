# Contexte : Validation manuelle Chrome (T029)

## Statut
**Actif** — Les 8 scénarios du guide de validation ont été validés manuellement dans Google Chrome ≥ 127 le 2026-10-24.

## Périmètre

- Feature : `001-biblical-pomodoro`
- Build : extension `dist/` chargée non empaquetée
- Navigateur : Google Chrome desktop ≥ 127
- Guide : [quickstart.md](../../specs/001-biblical-pomodoro/quickstart.md)

## Résultats

| # | Scénario | Résultat |
|---|----------|----------|
| 1 | Verset à la demande | Conforme |
| 2 | Réaffichage au clic | Conforme |
| 3 | Réglages persistants | Conforme |
| 4 | Affichage automatique | Conforme |
| 5 | Intervalle invalide | Conforme |
| 6 | Hors connexion | Conforme |
| 7 | Sortie de veille | Conforme |
| 8 | Échec à l'échéance automatique | Conforme |

Résultat global : **8 scénarios sur 8 conformes** dans Chrome. Les critères `SC-001` à `SC-005` sont validés.

## Vérifications complémentaires

- 90 tests unitaires et composants passent.
- Les contrôles de types, de style, de format et de build passent.
- Le bundle du popup respecte la limite de 300 Ko gzippés.

## Portée

Cette validation porte sur Chrome desktop, seule plateforme prévue pour la version 1. Firefox, Edge, le mobile et les autres plateformes restent hors périmètre.
