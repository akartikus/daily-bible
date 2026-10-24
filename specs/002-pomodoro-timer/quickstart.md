# Quickstart — Minuteur Pomodoro

**Feature**: 002-pomodoro-timer · **Date**: 2026-10-24

Guide de validation de bout en bout. Formes de données :
[data-model.md](data-model.md) ; contrats :
[runtime-messages.md](contracts/runtime-messages.md),
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
npm run check        # svelte-check
npm run lint         # ESLint
npm run format       # Prettier (vérification)
```

## Scénarios de validation

Durées conseillées pour la validation manuelle : focus 1 min, pause 1 min,
longue pause 1 min (en extension non empaquetée, `chrome.alarms` n'a pas
de période minimale — même approche que le quickstart 001). Si un scénario
exige d'inspecter l'état : console du service worker dans
`chrome://extensions` → `chrome.storage.local.get()`.

| # | Scénario | Étapes | Résultat attendu | Réf. spec |
| --- | --- | --- | --- | --- |
| 1 | Statut au premier usage | Installer, ouvrir le popup | « Focus », barre « répétition 1 / 4 », bouton proposant pause (lecture par défaut) | FR-002/FR-003/FR-004 |
| 2 | Fin de focus → verset + pause | Focus 1 min, attendre l'échéance | Le popup s'ouvre avec un verset neuf, statut « Pause », barre inchangée | FR-006, SC-002 |
| 3 | Next reprend le focus | Pendant la pause, presser next | Statut « Focus », barre « répétition 2 / 4 », décompte relancé | FR-005, SC-003 |
| 4 | X-ième focus → longue pause | Régler X = 1, laisser finir le focus | Popup + verset neuf, statut « Longue pause », barre pleine ; next → nouveau cycle « répétition 1 / 1 » | FR-001, FR-006 |
| 5 | Suspension fidèle | Suspendre en cours de focus, fermer le popup, rouvrir | État suspendu conservé (bouton play proposé) ; reprendre : la fin du focus est décalée d'autant | FR-004, SC-004 |
| 6 | Repop fin de pause | Pendant la pause, fermer le popup, attendre la fin du décompte | Le popup se rouvre avec le bouton next ; aucun passage automatique en focus | FR-007, SC-003 |
| 7 | Redémarrage Chrome | Redémarrer le navigateur, rouvrir le popup | Nouveau cycle (« Focus », répétition 1, lecture) ; réglages conservés | FR-013/FR-010, SC-006 |
| 8 | Valeurs invalides | Saisir 0, 1500, puis 11 répétitions | Refus avec message ; dernières valeurs valides conservées | FR-011 |
| 9 | Échec API à la fin du focus | Couper le réseau avant la fin d'un focus | Popup ouvert, statut passé en pause quand même ; ancien verset conservé ou ErrorView + « Réessayer » | FR-014, SC-002 |

## Note de précision

`chrome.alarms` peut différer une échéance au-delà de sa date prévue
(économie d'énergie) : les scénarios 2, 4 et 6 acceptent un retard
grossier d'une trentaine de secondes, comme SC-005 en 001. Aucun rattrapage
en rafale ne doit survenir après une mise en veille (un seul
déclenchement — edge case spec).
