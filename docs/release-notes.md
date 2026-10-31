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

## Minuteur Pomodoro

- T001 : l'état du minuteur peut être sauvegardé.
- T002 : les tests savent simuler une alarme unique.
- T003 : les réglages du minuteur sont préparés pour la migration.
- T004 : les changements de phase sont vérifiés par des tests.
- T005 : le tirage d'un verset est réutilisable.
- T006 : le cycle focus, pause et longue pause est calculé sans interface.
- T007 : l'alarme du minuteur est créée pour une date précise.
- T008 : le démarrage du minuteur est vérifié par des tests.
- T009 : le minuteur tourne dans le moteur de l'extension, même fenêtre fermée.
- T010 : la fenêtre garde l'état du minuteur à jour.
- T011 : le statut et la barre du cycle s'affichent.
- T012 : le statut du minuteur reste visible au-dessus du verset, de l'erreur et du chargement.
- T013 : la fin d'un focus est vérifiée par des tests.
- T014 : à la fin d'un focus, la fenêtre s'ouvre avec un verset neuf et la pause démarre seule.
- T015 : le bouton « next » est vérifié par des tests.
- T016 : la fin d'une pause rouvre la fenêtre, sans jamais passer au focus tout seul.
- T017 : le bouton « next » apparaît en pause et lance le focus suivant.
- T018 : la suspension et la reprise sont vérifiées par des tests.
- T019 : les demandes de pause et de reprise figent ou relancent le décompte.
- T020 : le bouton play/pause propose l'action opposée à l'état du minuteur.
- T021 : les durées du minuteur se règlent ; une valeur impossible est refusée avec un message.
- T022 : un changement de durée s'applique à partir de la phase suivante, jamais en cours de phase.
- T023 : toutes les portes qualité passent (types, tests, lint, format, build, taille du bundle).
- T024 : les neuf parcours de validation manuelle passent dans Chrome.
- T025 : la documentation des contextes est à jour (minuteur pomodoro).

## Internationalisation et refonte graphique

- T001 : les composants d'interface et les icônes sont installés ; la charte graphique de base est en place.
- T002 : tous les textes de l'extension existent en français et en anglais ; la langue suit celle du navigateur (français) ou l'anglais sinon.

## Finitions / Qualité

- T028 : toutes les portes qualité passent (types, tests, lint, format, build, taille du bundle).
- T029 : les huit parcours de validation manuelle passent dans Chrome.
- T030 : la documentation des contextes est à jour (verset, auto, réglages).
- T032 : la taille du bundle (< 300 Ko gzippé) est vérifiée à chaque construction.
- T033 : l'ouverture auto du popup est l'invitation à la pause (pas de libellé dédié).
- T034 : le bloc temporaire « SYNC IMPACT REPORT » est retiré de la constitution.
