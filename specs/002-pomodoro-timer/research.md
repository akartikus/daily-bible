# Research — Minuteur Pomodoro

**Feature**: 002-pomodoro-timer · **Date**: 2026-10-24

Décisions consolidées à partir de la documentation officielle Chrome
(sources vérifiées le 2026-10-24, liens en fin de document) et des
mécanismes déjà validés par la feature 001
([../001-biblical-pomodoro/research.md](../001-biblical-pomodoro/research.md)).

## 1. Mécanisme du minuteur — alarmes one-shot + échéances persistées

**Decision**: l'état du pomodoro (`status`, `repetition`, `running`,
`phaseEndsAt` en epoch ms) vit dans `chrome.storage.local` (clé
`pomodoroState`). Chaque phase est déclenchée par une alarme one-shot
`chrome.alarms.create("pomodoro-phase", { when: phaseEndsAt })`. La
suspension supprime l'alarme ; la reprise et chaque transition la
recréent avec la nouvelle échéance.

**Rationale**: le service worker MV3 est éphémère (tué après ~30 s
d'inactivité) — un `setTimeout` ou une mémoire en cours de module serait
perdue. Les alarmes persistent indépendamment du cycle de vie du service
worker et `{ when }` prend directement l'échéance epoch ms déjà stockée :
aucune conversion, aucune dérive entre l'état affiché et l'état réel
(SC-001/SC-007). Les durées étant en minutes (≥ 1), la période minimale de
30 s en production n'est jamais contraignante ; en extension non
empaquetée il n'y a aucune limite — des phases d'1 minute restent
testables manuellement (même approche que le quickstart 001).

**Alternatives considered**: alarme périodique (sémantique fausse — les
phases sont des one-shots séquencés, pas un rythme fixe) ; `setTimeout`
dans le service worker (tué) ; minuteur piloté par le popup (le popup se
ferme à la perte de focus — contredit FR-008) ; calcul du temps restant à
chaque ouverture de popup sans alarme (aucune transition automatique
possible, contredit FR-001/FR-006).

## 2. Suspension / reprise — temps restant figé

**Decision**: suspendre stocke `phaseRemainingMs = max(0, phaseEndsAt - now)`
et met `phaseEndsAt` à `null` ; reprendre recalcule
`phaseEndsAt = now + phaseRemainingMs`. Invariant : `running ⇔ phaseEndsAt`
défini, `!running ⇔ phaseRemainingMs` défini (SC-004 : reprise sans perte).

**Rationale**: figer le temps restant est plus simple que d'accumuler les
durées de suspension, et le `max(0, …)` rend le cas limite « suspendre
pendant la pause à décompte terminé » inoffensif : reprendre avec un reste
nul en phase pause ne recrée AUCUNE alarme — l'état reste « en attente du
bouton next », déjà l'état légal après la fin du décompte (FR-005).

**Alternatives considered**: accumuler les durées de pause (deux champs à
maintenir en cohérence) ; interdire la suspension pendant la pause
(contredit FR-004 « dans toute phase »).

## 3. (Re)démarrage — reset au démarrage du navigateur, init défensive

**Decision**: `chrome.runtime.onStartup` remet le pomodoro sur un nouveau
cycle (focus, répétition 1, lecture — FR-013) et recrée l'alarme ;
`chrome.runtime.onInstalled` initialise l'état seulement s'il est absent
(l'installation ne doit pas écraser, la mise à jour ne doit pas couper un
cycle en cours) ; toute commande pomodoro reçue alors que l'état est absent
l'initialise aussi (défense en profondeur).

**Rationale**: les alarmes ne sont pas garanties à travers un redémarrage
du navigateur — la recommandation officielle est de les recréer au
démarrage du service worker ; ici FR-013 remet de toute façon le cycle à
zéro, ce qui rend le recréation triviale. `onStartup` ne se déclenche
qu'au démarrage du profil, PAS à chaque réveil du service worker : le
minuteur n'est donc jamais remis à zéro par l'éphémérité MV3 (FR-008).

**Alternatives considered**: restaurer le minuteur en cours après
redémarrage (écarté par la spec, FR-013) ; reset à chaque réveil du
service worker (casserait le cycle en permanence).

## 4. Écriture unique + réconciliation à la lecture

**Decision**: seul le service worker écrit `pomodoroState` (même règle que
`currentCycle` en 001). Le popup commande via messages typés
(`pomodoro-get-state`, `pomodoro-pause`, `pomodoro-resume`,
`pomodoro-next` — voir [contracts/runtime-messages.md](contracts/runtime-messages.md))
et observe ensuite `storage.onChanged`. Avant de répondre à
`pomodoro-get-state`, le service worker réconcilie : si une phase focus
est échue sans que l'alarme n'ait encore tiré, la transition de fin de
focus est exécutée immédiatement ; si une pause est échue, l'état est déjà
légal (attente de next) et est retourné tel quel.

**Rationale**: Chrome peut différer une alarme au-delà de son échéance. Sans
réconciliation, le popup afficherait un focus échue comme courant —
violation de SC-001. La réconciliation centralisée dans le service worker
garantit un seul point de vérité et reste testable comme fonction pure.

**Alternatives considered**: laisser le popup dériver l'affichage depuis
`phaseEndsAt` (n'applique aucune transition — le verset et la pause ne
seraient pas déclenchés) ; chaque lecteur réconcilie de son côté (duplique
la logique de transition, risque de divergence).

## 5. Alarmes manquées (veille) — comportement déjà tranché en 001

**Decision**: aucune mesure spécifique. La documentation `chrome.alarms`
garantit qu'une alarme manquée pendant la veille se déclenche au plus une
fois au réveil — pas de rafale.

**Rationale**: l'edge case « mise en veille » de la spec s'applique : au
réveil, si le focus était échu, la transition pause (+ verset) a lieu une
fois ; si le décompte d'une pause était échue, le popup se rouvre une
fois avec next et rien ne passe automatiquement en focus. Le modèle
« échéance persistée + alarme one-shot » rend ce comportement naturel,
sans code dédié.

**Alternatives considered**: rattrapage de toutes les phases manquées
(contre-productif : les seules transitions automatiques sont focus →
pause ; au-delà, le système attend de toute façon next).

## 6. Réaction aux changements de réglages — rien à recréer en cours de phase

**Decision**: aucun listener n'ajuste l'alarme pomodoro à l'écriture des
réglages. Chaque transition relit les réglages à frais au moment où elle
calcule la phase suivante. Fin de focus → longue pause si et seulement si
`repetition >= settings.repetitionsBeforeLongBreak`.

**Rationale**: FR-012 exige que la phase en cours garde sa durée ; lire les
réglages au moment de chaque transition applique donc les nouvelles
valeurs exactement « à partir de la phase suivante », sans état
supplémentaire. La comparaison par `>=` reste correcte si X est réduit en
cours de cycle (ex. répétition 4 sur X passé à 2 → longue pause au
prochain focus terminé).

**Alternatives considered**: recalculer/rescheduler l'alarme courante à
chaque écriture (contredit FR-012 et duplique la logique de transition).

## 7. Progression affichée — par répétition, pas de décompte

**Decision**: la page VerseView affiche le statut (Focus / Pause /
Longue pause), la progression sur les X répétitions (barre à X segments,
texte `n / X`) et les deux boutons. Aucun décompte du temps restant, aucun
ticker local d'aucune seconde.

**Rationale**: la spec (FR-002/FR-003) demande le statut et la progression
sur les X répétitions — pas le temps restant. S'en tenir à cela supprime
toute horloge locale dans le popup : les mises à jour arrivent par push
`storage.onChanged` (réactivité < 100 ms) et le popup ne peut jamais
diverger du service worker. Moins de code, un seul point de vérité.

**Alternatives considered**: décompte minute par minute dans le popup
(personne ne l'a demandé — YAGNI) ; barre continue de progression du
temps de phase (la spec parle de progression sur les X répétitions).

## Références (vérifiées le 2026-10-24)

- Chrome Extensions — `browser.alarms` (one-shot `when`, période minimale
  30 s en production, aucune limite en non empaqueté, alarmes manquées
  déclenchées au plus une fois, recréation au démarrage recommandée) :
  https://developer.chrome.com/docs/extensions/reference/api/alarms
- Chrome Extensions — `browser.storage` (onChanged, zones, quotas) :
  https://developer.chrome.com/docs/extensions/reference/api/storage
- Chrome Extensions — `browser.runtime` (onStartup = démarrage du profil,
  onInstalled = installation/mise à jour, messagerie) :
  https://developer.chrome.com/docs/extensions/reference/api/runtime
- Chrome Extensions — `browser.action` (openPopup, Chrome 127+, rejet non
  bloquant) :
  https://developer.chrome.com/docs/extensions/reference/api/action
- Mécanismes réutilisés de la feature 001 :
  [../001-biblical-pomodoro/research.md](../001-biblical-pomodoro/research.md)
