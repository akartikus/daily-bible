# Contexte : Validation manuelle Chrome (T024)

## Statut
**Actif** — Les 9 scénarios du guide de validation ont été validés manuellement dans Google Chrome ≥ 127 le 2026-10-26.

## Périmètre

- Feature : `002-pomodoro-timer`
- Build : extension `dist/` chargée non empaquetée
- Navigateur : Google Chrome desktop ≥ 127
- Guide : [quickstart.md](../../specs/002-pomodoro-timer/quickstart.md)
- Durées de validation : focus 1 min, pause 1 min, longue pause 1 min

## Résultats

| # | Scénario | Résultat |
|---|----------|----------|
| 1 | Statut au premier usage | Conforme |
| 2 | Fin de focus → verset + pause | Conforme |
| 3 | Next reprend le focus | Conforme |
| 4 | X-ième focus → longue pause | Conforme |
| 5 | Suspension fidèle | Conforme |
| 6 | Repop fin de pause | Conforme |
| 7 | Redémarrage Chrome | Conforme |
| 8 | Valeurs invalides | Conforme |
| 9 | Échec API à la fin du focus | Conforme |

Résultat global : **9 scénarios sur 9 conformes** dans Chrome. Les critères `SC-001` à `SC-007` sont validés.

## Vérifications complémentaires

- 176 tests unitaires et composants passent.
- Les contrôles de types, de style, de format et de build passent.
- Le bundle du popup respecte la limite de 300 Ko gzippés (17,43 Ko).

## Portée

Cette validation porte sur Chrome desktop, seule plateforme prévue pour la version 1. Firefox, Edge, le mobile et les autres plateformes restent hors périmètre.