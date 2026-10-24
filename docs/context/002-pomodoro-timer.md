# Contexte : Minuteur Pomodoro (002)

## Statut
**Planifié (tâches générées)** — Spec clarifiée, plan et tasks.md prêts ;
prochaine étape : `/speckit-implement`.

## Périmètre (specs/002-pomodoro-timer/spec.md)

- Cycle : X répétitions focus/pause puis longue pause, puis nouveau cycle.
- Transitions automatiques : uniquement focus → pause et focus → longue
  pause. À la fin de chaque focus, le popup s'ouvre avec un verset neuf.
- Retour au focus uniquement via le bouton « next » (jamais automatique) ;
  le popup se rouvre quand le décompte de la pause atteint zéro.
- Bouton play/pause : contrôle de suspension / reprise du décompte dans
  toute phase (ce n'est pas un indicateur de statut).
- Affichage VerseView : statut (focus / pause / longue pause), progression
  sur les X répétitions (barre). Pas de décompte du temps restant.
- Réglages persistants : durées focus / pause / longue pause et X.
  Défauts : 25 / 5 / 15 min, X = 4.

## Décisions d'implémentation (specs/002-pomodoro-timer/plan.md)

- Minuteur dans le service worker : état persisté `pomodoroState`
  (`chrome.storage.local`, échéances en epoch ms), alarme one-shot
  `pomodoro-phase` (`{ when: phaseEndsAt }`).
- Transitions pures dans `shared/pomodoro/state.ts` (testables sans
  Chrome) ; orchestration `background/pomodoro.ts` (seul écrivain) ;
  composant `PomodoroStatus.svelte` ; store `pomodoro.svelte.ts`.
- Popup commande par messages (`pomodoro-get-state`, `-pause`, `-resume`,
  `-next`) ; l'état lu est réconcilié par le service worker.
- `drawRandomVerse` extrait vers `shared/bible/draw.ts` pour être réutilisé
  à la fin de chaque focus.
- `settings` étendu (4 champs) avec fusion des défauts à la lecture
  (`readSettings`) — migration invisible des installations 001.
- Suspension : `phaseRemainingMs` figé à la pause, recalcul de `phaseEndsAt`
  à la reprise. Redémarrage navigateur : nouveau cycle (onStartup).
- L'affichage automatique à intervalle de la feature 001 reste inchangé et
  indépendant.
