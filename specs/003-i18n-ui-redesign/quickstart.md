# Quickstart — Internationalisation et refonte graphique

**Feature**: 003-i18n-ui-redesign · **Date**: 2026-10-31

Guide de validation de bout en bout. Formes de données :
[data-model.md](data-model.md) ; contrats :
[i18n.md](contracts/i18n.md), [ui-behavior.md](contracts/ui-behavior.md).

## Prérequis

- Node.js ≥ 20 et npm
- Google Chrome ≥ 127 (desktop) — **deux profils de langue** : un profil
  « Français » et un profil « English (United States) » (ou toute autre
  langue non française)
- Connexion internet (l'API des versets est distante)

## Installation

```bash
npm install
npm run build        # produit dist/
```

Charger l'extension : Chrome → `chrome://extensions` → mode Développeur →
« Charger l'extension non empaquetée » → sélectionner `dist/`.

Répéter le chargement dans **les deux profils de langue** (une installation
par profil, réglages indépendants).

## Tests

```bash
npm run test         # Vitest (unitaires + composants, aux deux locales)
npm run check        # svelte-check (complétude du catalogue garantie par le typage)
npm run lint         # ESLint
npm run format       # Prettier (vérification)
npm run build && npm run check:size   # bundle popup < 300 Ko gzippé
```

## Scénarios de validation

Le comportement des cycles reste celui du quickstart 002
([../002-pomodoro-timer/quickstart.md](../002-pomodoro-timer/quickstart.md)) ;
les scénarios ci-dessous vérifient langue et refonte par-dessus.

| # | Scénario | Étapes | Résultat attendu | Réf. spec |
| --- | --- | --- | --- | --- |
| 1 | Interface française | Profil « Français », ouvrir le popup | Tous les textes en français (statut « Focus », « répétition 1 / 4 », réglages, messages) ; aucun mélange | FR-001, FR-003 |
| 2 | Interface anglaise (fallback) | Profil « English (US) », ouvrir le popup | Tous les textes en anglais : « Focus », « repetition 1 / 4 », « Automatic display », « Interval (minutes) »… | FR-002, FR-003 |
| 3 | Fallback langue inconnue | Profil « Deutsch », ouvrir le popup | Interface entièrement en anglais | FR-002 |
| 4 | Verset suit la langue (fr) | Profil FR, déclencher un tirage (fin de focus ou « Réessayer ») | Verset en Louis Segond 1910, noms de livres français | FR-001 |
| 5 | Verset suit la langue (en) | Profil EN, déclencher un tirage | Verset en King James Version, noms de livres anglais (ex. « Genesis ») | FR-001 |
| 6 | Boutons épurés | Parcourir toutes les vues aux deux profils | Boutons = icônes seules discrètes, aucun texte de bouton visible ; chaque bouton survolé montre son action (title) | FR-005 |
| 7 | Libellés accessibles | Parcourir les boutons au clavier / lecteur d'écran | Chaque icône a un libellé traduit (ex. « Mettre en pause » / « Pause »), jamais vide | FR-005 |
| 8 | Paramètres deux colonnes | Ouvrir les réglages, comparer les lignes | Libellés alignés à gauche en colonne, champs alignés à droite, gouttière verticale identique sur toutes les lignes | FR-008 |
| 9 | Validation sans casse | Saisir 0 puis 11 répétitions | Message traduit sous le champ concerné, alignement des lignes intact, dernière valeur valide conservée | FR-009 |
| 10 | Charte cohérente | Comparer les 5 vues | Même palette sobre, même typographie, mêmes espacements de vue en vue | FR-010 |
| 11 | Persistance réglages | Régler focus 1 min dans le profil EN, redémarrer Chrome (même profil) | Réglages conservés (migration invisible : ancienne clé `translationId` ignorée), nouveau cycle | FR-010 (002) |
| 12 | Non-régression cycle | Refaire les scénarios 1–6 du quickstart 002 sur le profil FR | Comportement identique (statuts, verset à la fin du focus, next, suspension, repop) | FR-011 |

## Note de précision

La langue est résolue à l'ouverture du popup : changer la langue du
navigateur s'applique à la **prochaine** ouverture du popup, sans rechargement
à chaud (exigence de la spec, edge « changement de langue pendant une
session »). Les durées courtes (1/1/1 min) restent utilisables pour la
validation manuelle comme en 002.