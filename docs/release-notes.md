# Notes de version

Ce que chaque tâche a apporté, en une ligne courte.

## Installation

- T001 : le projet est créé.
- T002 : l'extension est déclarée pour Chrome (127 minimum).
- T003 : les outils de vérification du code sont en place.
- T004 : la fenêtre de l'extension a son apparence de base et se construit.
- T005 : imitation des fonctions de Chrome pour les tests.
- T006 : les données de l'extension sont sauvegardées sur l'ordinateur.
- T031 : chaque envoi de code est vérifié automatiquement.

## Verset à la demande

- T007 : le service de versets est vérifié par des tests.
- T008 : la lecture du texte d'un verset est vérifiée par des tests.
- T009 : le choix au hasard est vérifié par des tests.
- T010 : le texte d'un verset est extrait proprement.
- T011 : le verset est tiré au hasard ; les grands livres sortent plus souvent.
- T012 : les versets viennent du service en ligne, avec une copie locale de 30 jours.
- T013 : la fenêtre et le moteur de l'extension se parlent.
- T014 : un clic sur l'icône affiche un verset ; un nouveau clic réaffiche le même.
- T015 : le verset s'affiche avec sa référence et sa traduction.
- T016 : en cas d'erreur, un message clair et un bouton « Réessayer ».
- T017 : la fenêtre garde le verset courant à jour.
- T018 : la fenêtre s'assemble : verset ou message d'erreur.

## Affichage automatique

- T019 : les réglages par défaut sont vérifiés par des tests.
- T020 : le minuteur est vérifié par des tests.
- T021 : réglages par défaut : affichage auto désactivé, 25 minutes, Louis Segond.
- T022 : le minuteur est créé, supprimé ou retrouvé selon les réglages.
- T023 : la fenêtre s'ouvre seule ; un échec ne bloque rien.
- T024 : à chaque échéance, la fenêtre s'ouvre avec un verset neuf ; en cas d'échec, l'ancien verset reste.

## Réglages

- T025 : la fenêtre garde les réglages à jour.
- T026 : écran de réglages : interrupteur d'affichage auto et intervalle en minutes ; une saisie impossible est refusée avec un message.
- T027 : un bouton engrenage ouvre les réglages ; les réglages survivent au redémarrage de Chrome.

## Finitions / Qualité

- T028 : toutes les portes qualité passent (types, tests, lint, format, build, taille du bundle).
- T029 : les huit parcours de validation manuelle passent dans Chrome.
- T030 : la documentation des contextes est à jour (verset, auto, réglages).
- T032 : la taille du bundle (< 300 Ko gzippé) est vérifiée à chaque construction.
- T033 : l'ouverture auto du popup est l'invitation à la pause (pas de libellé dédié).
- T034 : le bloc temporaire « SYNC IMPACT REPORT » est retiré de la constitution.
