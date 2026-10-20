# Quickstart — Pomodoro Biblique

**Feature**: 001-biblical-pomodoro · **Date**: 2026-10-20

Guide de validation de bout en bout. Formes de données :
[data-model.md](data-model.md) ; contrats : [bible-api.md](contracts/bible-api.md),
[storage-schema.md](contracts/storage-schema.md),
[ui-behavior.md](contracts/ui-behavior.md).

## Prérequis

- Node.js ≥ 20 et npm
- Google Chrome ≥ 127 (desktop)
- Connexion internet (l'API des versets est distante)

## Installation

```bash
npm install
npm run build        # produit dist/
```

Charger l'extension : Chrome → `chrome://extensions` → mode Développeur →
« Charger l'extension non empaquetée » → sélectionner `dist/`.

Développement : `npm run dev` (rechargement à chaud via @crxjs).

## Tests

```bash
npm run test         # Vitest (unitaires + composants)
npm run check        # svelte-check + ESLint
```

## Scénarios de validation

| # | Scénario | Étapes | Résultat attendu | Réf. spec |
| --- | --- | --- | --- | --- |
| 1 | Verset à la demande | Cliquer sur l'icône (extension fraîchement installée) | Verset complet (texte + référence + traduction) affiché en < 3 s | FR-001, SC-001/SC-002 |
| 2 | Réaffichage au clic | Cliquer à nouveau sur l'icône | Même verset réaffiché (pas de nouveau tirage) | FR-002 |
| 3 | Réglages persistants | Activer l'affichage auto, fixer 1 min, redémarrer Chrome, rouvrir les réglages | Interrupteur activé, intervalle 1 min conservés | FR-003/FR-004/FR-006, SC-004 |
| 4 | Affichage automatique | Auto activé, intervalle 1 min ; attendre l'échéance | Le popup s'ouvre seul avec un nouveau verset | FR-005 |
| 5 | Intervalle invalide | Saisir 0, puis 1500 | Refus avec message ; dernière valeur valide conservée | FR-008 |
| 6 | Hors connexion | Couper le réseau, cliquer sur l'icône | Message clair + « Réessayer » ; pas de plantage | FR-011 |
| 7 | Sortie de veille | Auto activé (1 min), mettre la machine en veille 5 min, réveiller | Un seul verset affiché ; le cycle reprend à la prochaine échéance | Edge case spec |
| 8 | Échec à l'échéance auto | Auto activé (1 min), couper le réseau avant l'échéance | Le popup s'ouvre : ErrorView + « Réessayer » si aucun verset en cours, sinon ancien verset affiché ; pas de plantage | FR-011 |

Note : en extension non empaquetée, `chrome.alarms` n'a pas de période
minimale — l'intervalle de 1 minute des scénarios 3 à 5 et 8 est donc
testable en développement.
