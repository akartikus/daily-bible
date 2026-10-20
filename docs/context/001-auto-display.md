# Ouverture automatique à intervalle régulier (pomodoro)

## Description

Lorsque l'affichage automatique est activé, la fenêtre de l'extension s'ouvre
seule à chaque échéance de l'intervalle défini (défaut 25 minutes) et montre
un nouveau verset — le pomodoro biblique invite explicitement à prendre une
pause.

## Feature et spécification liées

- Feature : 001-biblical-pomodoro
- [specs/001-biblical-pomodoro/spec.md](../../specs/001-biblical-pomodoro/spec.md) — User Story 2 (P2)

## Décisions techniques

- **Minuteur** : `chrome.alarms`, alarme nommée `verse-interval`,
  `periodInMinutes = intervalMinutes` ; rythme fixe, non remis à zéro par un
  clic manuel.
- **Ouverture du popup** : `chrome.action.openPopup()` depuis le service
  worker — nécessite Chrome ≥ 127 (`minimum_chrome_version`).
- **Activation** : opt-in explicite, désactivée par défaut à l'installation.
- **Persistance du minuteur** : alarme revérifiée/recréée à chaque démarrage
  du service worker (MV3 éphémère, aucun état en mémoire).

## Points d'attention

- `openPopup()` peut rejeter (popup déjà ouvert…) — échec non bloquant, le
  verset reste disponible au clic suivant.
- Sortie de veille : un seul verset s'affiche (les alarmes manquées se
  déclenchent au plus une fois), reprise à la prochaine échéance.
- Période minimale 30 s en production ; aucune limite en extension non
  empaquetée (utile pour tester en dev).
