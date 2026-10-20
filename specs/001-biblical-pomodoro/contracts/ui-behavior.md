# Contract — Comportement UI du popup

**Feature**: 001-biblical-pomodoro · **Date**: 2026-10-20

## Vues

| Vue | Déclencheur | Contenu |
| --- | --- | --- |
| VerseView | ouverture du popup (clic icône ou ouverture automatique) | texte du verset, référence (livre chapitre:verset), traduction |
| ErrorView | échec de récupération (FR-011) | message clair + bouton « Réessayer » |
| SettingsView | bouton engrenage dans le popup | activation de l'affichage auto, intervalle (minutes) |

## États de VerseView

```text
montage → lecture currentCycle
  ├─ verse présent  → affichage immédiat
  ├─ verse absent   → demande de tirage au service worker → loading → affichage
  └─ échec          → ErrorView (message + Réessayer)
```

## Interactions (FR-007 / SC-003)

- Afficher un verset : 1 interaction (clic sur l'icône).
- Accéder aux réglages : 2 interactions (clic icône → engrenage).
- Réessayer après erreur : 1 interaction supplémentaire (bouton).

## Réglages (SettingsView)

- Activation de l'affichage automatique : interrupteur, état initial
  `false` (FR-003).
- Intervalle : champ numérique en minutes, défaut 25 (FR-004) ; bornes
  1..1440 ; toute saisie invalide est refusée avec un message
  compréhensible et la dernière valeur valide conservée (FR-008).
- Application immédiate à la validation : le nouvel intervalle s'applique
  au prochain cycle, l'alarme est recréée (scénario 1 de la story 3).

## Ouverture automatique (affichage auto activé)

À chaque échéance de l'alarme `verse-interval`, le service worker appelle
d'abord `chrome.action.openPopup()` sans condition, puis tire un nouveau
verset et l'écrit dans `currentCycle`. Si l'appel `openPopup()` échoue
(popup déjà ouvert…), le verset reste disponible au clic suivant — aucun
blocage. Si le tirage échoue (FR-011) : le popup affiche ErrorView avec
« Réessayer » lorsqu'aucun verset n'est en cours ; si un verset précédent
existe, il reste affiché (dégradation gracieuse) et un nouveau tirage aura
lieu à la prochaine échéance.

## Hors périmètre v1

Badge sur l'icône, choix de traduction dans l'UI, mode hors ligne,
versets thématiques (calendrier liturgique).
