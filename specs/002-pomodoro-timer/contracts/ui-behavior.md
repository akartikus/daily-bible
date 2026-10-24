# Contract — Comportement UI du popup (additif 002)

**Feature**: 002-pomodoro-timer · **Date**: 2026-10-24

Additif au contrat 001
([../../001-biblical-pomodoro/contracts/ui-behavior.md](../../001-biblical-pomodoro/contracts/ui-behavior.md)).
Vue VerseView et ErrorView inchangées ; le composant `PomodoroStatus` est
rendu par `App.svelte` dans la vue verset, AU-DESSUS du contenu (verset,
erreur, chargement) — le statut reste donc visible en toutes circonstances
dans cette vue (FR-002 « en permanence »).

## PomodoroStatus (vue verset)

| Élément | Comportement |
| --- | --- |
| Statut | Libellé du statut courant : « Focus », « Pause », « Longue pause » (FR-002) |
| Barre de progression | X segments (un par répétition) ; segments accomplis remplis, segment courant distinct, texte `répétition n / X` ; pleine pendant la longue pause ; X = 1 → un seul segment (FR-003, edge case spec) |
| Bouton play/pause | Propose l'action opposée à l'état courant : « pause » quand le décompte est en lecture (défaut), « play » quand il est suspendu (FR-004). Contrôle uniquement — ce n'est pas un indicateur de statut |
| Bouton next | Visible UNIQUEMENT en statut Pause ou Longue pause (FR-005) ; démarre le focus suivant en lecture |

Aucun décompte du temps restant n'est affiché (la spec demande le statut et
la progression sur les X répétitions — research.md §7). Les mises à jour
arrivent par push `storage.onChanged` ; en cas d'échec du premier contact
avec le service worker, un message d'erreur minimal remplace le bloc — pas
d'écran vide.

## Interactions (SC-003/SC-004)

- Suspendre ou reprendre le décompte : 1 interaction, dans toute phase.
- Passer au focus suivant depuis une pause : 1 interaction (next).
- Aucune interaction ne passe jamais automatiquement en focus.

## Ouvertures automatiques du popup

| Événement | Comportement |
| --- | --- |
| Fin d'un focus (répétition < X) | Popup ouvert automatiquement avec un verset neuf ; statut « Pause » ; décompte de la pause lancé (FR-006) |
| Fin du X-ième focus | Idem avec statut « Longue pause » (FR-006) |
| Fin du décompte d'une pause / longue pause | Le popup se rouvre s'il est fermé (« repop ») et présente le bouton next ; AUCUNE transition automatique (FR-005/FR-007) |
| Échec du tirage du verset à la fin d'un focus | Popup ouvert quand même, statut changé quand même ; ancien verset conservé, sinon ErrorView avec « Réessayer » (FR-014, reprise de la dégradation gracieuse 001) |

## SettingsView (champs ajoutés)

Quatre champs numériques sur le modèle du champ « Intervalle » existant
(validation à la saisie, refus avec message, dernière valeur valide
conservée — FR-011) :

| Champ | Bornes | Défaut |
| --- | --- | --- |
| Focus (minutes) | 1..1440 | 25 |
| Pause (minutes) | 1..1440 | 5 |
| Longue pause (minutes) | 1..1440 | 15 |
| Répétitions avant longue pause | 1..10 | 4 |

Messages d'erreur : « Entrez un nombre entier entre 1 et 1440. » pour les
durées, « Entrez un nombre entier entre 1 et 10. » pour les répétitions.
Application : la phase en cours garde sa durée, les nouvelles valeurs
s'appliquent à partir de la phase suivante (FR-012).

## Coexistence avec l'affichage automatique 001

L'alarme `verse-interval` (affichage auto à intervalle) continue de
fonctionner indépendamment du pomodoro (hypothèse spec) : les deux peuvent
ouvrir le popup, à des rythmes indépendants. Aucun arbitrage en v1.

## Hors périmètre v1

Décompte affiché du temps restant, skip d'un focus en cours, notifications
sonores ou système, statistiques de sessions, historique des cycles,
arbitrage des ouvertures popup pomodoro/interval.
