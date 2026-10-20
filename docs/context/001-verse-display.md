# Affichage d'un verset à la demande

## Description

Un clic sur l'icône de l'extension affiche un verset biblique complet
(texte, référence, traduction) en moins de 3 secondes sur une connexion
standard, sans aucune configuration préalable. Un clic suivant réaffiche le
verset en cours, sans consommer un nouveau tirage.

## Feature et spécification liées

- Feature : 001-biblical-pomodoro
- [specs/001-biblical-pomodoro/spec.md](../../specs/001-biblical-pomodoro/spec.md) — User Story 1 (P1)

## Décisions techniques

- **Source des versets** : API publique
  [Free Use Bible API](https://bible.helloao.org/) — gratuite, sans clé ni
  compte ; endpoints `books.json` et `{book}/{chapter}.json`.
- **Traduction** : Louis Segond 1910, ID `fra_lsg` (domaine public,
  31 170 versets).
- **Tirage aléatoire** : côté client — livre pondéré par
  `totalNumberOfVerses`, chapitre et verset uniformes.
- **Extraction du texte** : concaténation des chaînes et
  `FormattedText.text`, références de notes exclues.
- **Stack UI** : Svelte 5 + TypeScript strict + Tailwind CSS 4, popup
  Manifest V3.
- **Verset courant** : persisté dans `chrome.storage.local` (clé
  `currentCycle`), écrit par le service worker uniquement.

## Points d'attention

- Connexion internet requise ; timeout 10 s par requête, puis message clair
  + action « Réessayer ».
- Jamais d'écran vide : toute erreur de récupération est gracieuse (FR-011).
- Le clic manuel ne remet pas le minuteur à zéro et n'affecte pas le tirage
  (rythme fixe).
