# Feature Specification: Minuteur Pomodoro

**Feature Branch**: `002-pomodoro-timer`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Un système de pomodoro permet d'être concentré pendant un focus-time suivi ensuite d'un break-time. Cette séquence se répète X fois avant d'avoir un long-break-time à la fin. Ces valeurs doivent être paramétrables dans les paramètres. Le statut en cours doit être affiché dans la page VerseView : on doit voir dans quel état (focus, pause ou longue pause) on est, pour la pause ou le focus la progression sur les X fois, avec une progress bar. On doit aussi avoir un bouton play/pause, qui est en play par défaut."

**Terminologie** : « pause » désigne ci-dessous la phase courte de récupération
(break) ; le bouton « play/pause » est un contrôle de suspension / reprise du
décompte (ce n'est pas un indicateur de statut) ; le bouton « next » passe à
la phase focus suivante depuis une pause ou une longue pause.

## Clarifications

### Session 2026-10-24

- Q: Le bouton play/pause représente-t-il le statut courant ? → A: Non —
  c'est un contrôle qui suspend ou reprend le décompte, dans n'importe quelle
  phase (focus, pause, longue pause) ; le statut est affiché séparément.
- Q: Comment passe-t-on de la pause au focus suivant ? → A: Jamais
  automatiquement — un bouton « next » démarre le focus suivant (ou un
  nouveau cycle après la longue pause) ; le popup se rouvre s'il a été fermé
  entre temps.
- Q: Quelle est la relation entre le pomodoro et l'affichage des versets
  (ancien FR-012) ? → A: À la fin de chaque focus, le popup s'ouvre
  automatiquement avec un verset neuf et le statut passe en pause (ou en
  longue pause après le X-ième focus).
- Interprétation retenue pour le « repop » : le popup se rouvre
  automatiquement quand le décompte de la pause (ou longue pause) atteint
  zéro, pour présenter le bouton next ; le bouton reste aussi accessible à
  tout moment en ouvrant simplement le popup. À confirmer en planification si
  nécessaire.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Voir l'état du pomodoro (Priority: P1)

En tant qu'utilisateur, je veux voir dans la page VerseView l'état actuel de
mon pomodoro (focus, pause ou longue pause) et la progression dans le cycle
sur les X répétitions avec une barre de progression, pour suivre ma séance
sans effort.

**Why this priority**: c'est la valeur cœur de la feature — sans affichage du
statut, le minuteur n'a aucune utilité.

**Independent Test**: ouvrir la page VerseView et vérifier le statut affiché
et la barre de progression.

**Acceptance Scenarios**:

1. **Given** le pomodoro en phase focus (répétition 2 sur X = 4), **When**
   j'ouvre VerseView, **Then** je vois le statut « Focus » et la barre de
   progression indique la répétition 2 sur 4.
2. **Given** le pomodoro en phase pause (break), **When** j'ouvre VerseView,
   **Then** je vois le statut « Pause » et la progression sur les X
   répétitions.
3. **Given** le pomodoro en phase longue pause, **When** j'ouvre VerseView,
   **Then** je vois le statut « Longue pause ».

---

### User Story 2 - Fin de focus : verset et passage automatique en pause (Priority: P2)

En tant qu'utilisateur, je veux qu'à la fin de chaque focus le popup s'ouvre
automatiquement avec un verset neuf et que le statut passe en pause (ou en
longue pause après le X-ième focus), pour être invité à récupérer.

**Why this priority**: c'est ce qui fait le « pomodoro biblique » — le rythme
focus→pause est automatique et l'affichage du verset marque la pause.

**Independent Test**: régler des durées au minimum, laisser un focus se
terminer et observer l'ouverture du popup avec le verset et le changement de
statut.

**Acceptance Scenarios**:

1. **Given** un focus terminé et la répétition courante inférieure à X,
   **When** la durée du focus est écoulée, **Then** le popup s'ouvre
   automatiquement avec un verset neuf et le statut passe en « Pause ».
2. **Given** le X-ième focus terminé, **When** sa durée est écoulée,
   **Then** le popup s'ouvre automatiquement avec un verset neuf et le statut
   passe en « Longue pause ».
3. **Given** le verset impossible à récupérer à la fin d'un focus,
   **When** la durée du focus est écoulée, **Then** le popup s'ouvre quand
   même, le statut passe quand même en pause, et un message clair propose de
   réessayer (comportement repris de la feature 001).

---

### User Story 3 - Reprendre le focus avec le bouton next (Priority: P3)

En tant qu'utilisateur, je veux un bouton « next » dans VerseView qui
démarre le focus suivant depuis la pause (ou un nouveau cycle depuis la
longue pause), sans jamais de transition automatique, pour reprendre le
travail quand je le décide.

**Why this priority**: sans ce bouton, le cycle est bloqué en pause ; mais il
suppose l'entrée en pause (US2) pour être utile.

**Independent Test**: être en phase pause (popup ouvert), presser next et
vérifier le démarrage du focus suivant en lecture.

**Acceptance Scenarios**:

1. **Given** le statut « Pause » (popup ouvert), **When** je presse next,
   **Then** le focus suivant démarre (répétition suivante) et le minuteur
   est en lecture.
2. **Given** le statut « Longue pause », **When** je presse next, **Then**
   un nouveau cycle démarre (focus, répétition 1) et le minuteur est en
   lecture.
3. **Given** le popup fermé pendant la pause, **When** le décompte de la
   pause atteint zéro, **Then** le popup se rouvre automatiquement et
   présente le bouton next ; aucune transition automatique vers le focus
   n'a lieu.
4. **Given** le statut « Pause » avec du temps de décompte restant,
   **When** je presse next, **Then** le focus suivant démarre immédiatement
   (le reste de la pause est ignoré).

---

### User Story 4 - Suspendre et reprendre le décompte (Priority: P4)

En tant qu'utilisateur, je veux un bouton play/pause qui suspende ou reprenne
le décompte, quelle que soit la phase (focus, pause ou longue pause), pour
gérer les imprévus.

**Why this priority**: confort de contrôle ; le cycle fonctionne sans lui,
mais il ne peut pas être interrompu.

**Independent Test**: presser play/pause dans chaque phase et vérifier que le
décompte se fige puis reprend à la position exacte.

**Acceptance Scenarios**:

1. **Given** le minuteur en lecture dans n'importe quelle phase, **When**
   je presse pause, **Then** le décompte se fige ; **When** je presse play,
   **Then** le décompte reprend à la position exacte où il s'était arrêté.
2. **Given** le minuteur suspendu, **When** je ferme puis rouvre le popup,
   **Then** l'état « suspendu » et la position exacte sont conservés.

---

### User Story 5 - Configurer les durées du pomodoro (Priority: P5)

En tant qu'utilisateur, je veux régler dans les paramètres la durée du focus,
de la pause, de la longue pause et le nombre X de répétitions, pour adapter
le pomodoro à mon rythme.

**Why this priority**: confort de configuration ; les valeurs par défaut
(25 / 5 / 15 / X = 4) rendent la feature utilisable sans aucun réglage.

**Independent Test**: modifier chaque valeur dans les paramètres et vérifier
que le cycle suivant l'utilise.

**Acceptance Scenarios**:

1. **Given** les paramètres ouverts, **When** je change une durée ou X,
   **Then** la nouvelle valeur s'applique à partir de la phase suivante sans
   perdre l'état courant du cycle.
2. **Given** des réglages enregistrés, **When** le navigateur est
   redémarré, **Then** tous les réglages du pomodoro sont conservés.
3. **Given** les paramètres ouverts, **When** je saisis une valeur invalide,
   **Then** la saisie est refusée avec un message clair et la dernière valeur
   valide est conservée.

---

### Edge Cases

- Popup fermé pendant une phase : le minuteur continue en arrière-plan ; à
  la réouverture de VerseView, le statut affiché correspond au temps
  réellement écoulé.
- Fin de pause sans action : la phase reste « Pause » (décompte à zéro), en
  attente du bouton next ; aucun passage automatique en focus.
- Verset impossible à récupérer à la fin d'un focus : le statut passe quand
  même en pause, message clair et action « Réessayer » (repris de la
  feature 001), l'ancien verset reste affiché.
- Redémarrage du navigateur : le pomodoro repart sur un nouveau cycle (focus,
  répétition 1, en lecture), indépendamment de l'état précédent.
- Mise en veille du navigateur pendant plusieurs heures : au réveil, le
  pomodoro se positionne directement sur la phase correspondant au temps
  écoulé, sans rafale de transitions ; si le focus était écoulé, le statut
  est « Pause » en attente de next.
- Minuteur suspendu (bouton pause) puis popup fermé puis rouvert : l'état
  « suspendu » et la position exacte dans la phase sont conservés.
- Minuteur suspendu pendant une pause puis next pressé : le focus suivant
  démarre en lecture (l'action next relance le décompte).
- X = 1 : le cycle est focus → longue pause (aucune pause courte) ; next
  démarre un nouveau cycle ; la barre de progression reste cohérente.
- Le bouton next n'est pas proposé pendant une phase focus (passer un focus
  en cours est hors périmètre).
- Valeur invalide (0, négative, non entière, hors bornes) : saisie refusée
  avec un message clair, dernière valeur valide conservée.
- Pendant la longue pause, le statut reste visible même si aucune progression
  sur X n'est requise à ce moment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT enchaîner le cycle : X répétitions focus puis
  pause, suivies d'une longue pause, puis un nouveau cycle. Les transitions
  focus → pause et focus → longue pause sont automatiques ; les transitions
  pause → focus et longue pause → focus ne sont JAMAIS automatiques (action
  next requise).
- **FR-002**: La page VerseView DOIT afficher en permanence le statut courant
  du pomodoro : focus, pause (break) ou longue pause.
- **FR-003**: Pendant les phases focus et pause, la page VerseView DOIT
  afficher la progression sur les X répétitions du cycle via une barre de
  progression indiquant la répétition en cours et celles déjà accomplies.
- **FR-004**: La page VerseView DOIT fournir un bouton play/pause, contrôle
  de suspension / reprise du décompte disponible dans toute phase ; le
  minuteur est en lecture par défaut ; le bouton n'est pas l'indicateur du
  statut.
- **FR-005**: La page VerseView DOIT fournir un bouton next pendant les
  phases pause et longue pause : il démarre le focus suivant (ou un nouveau
  cycle après la longue pause) et le minuteur repart en lecture.
- **FR-006**: À la fin de chaque focus, le popup DOIT s'ouvrir automatiquement
  avec un verset neuf et le statut DOIT passer en pause (ou en longue pause
  après le X-ième focus).
- **FR-007**: Si le popup est fermé, il DOIT se rouvrir automatiquement quand
  le décompte de la pause (ou longue pause) atteint zéro, pour présenter le
  bouton next ; le bouton next reste aussi accessible à tout moment en
  ouvrant le popup.
- **FR-008**: Le minuteur DOIT continuer à fonctionner en arrière-plan
  lorsque le popup de l'extension est fermé.
- **FR-009**: L'utilisateur DOIT pouvoir configurer dans les paramètres : la
  durée du focus, la durée de la pause, la durée de la longue pause et le
  nombre X de répétitions. Valeurs par défaut avant tout réglage : focus
  25 minutes, pause 5 minutes, longue pause 15 minutes, X = 4.
- **FR-010**: Les réglages du pomodoro DOIVENT être conservés entre les
  sessions de navigation (persistance identique aux réglages existants).
- **FR-011**: Le système DOIT refuser toute valeur invalide (0, négative,
  non entière, hors bornes) avec un message compréhensible, en conservant la
  dernière valeur valide.
- **FR-012**: Un changement de réglage DOIT s'appliquer sans perdre l'état
  courant : la phase en cours garde sa durée, les nouvelles valeurs
  s'appliquent à partir de la phase suivante.
- **FR-013**: À un redémarrage du navigateur, le pomodoro DOIT repartir sur
  un nouveau cycle (focus, répétition 1, en lecture).
- **FR-014**: Un échec de récupération du verset à la fin d'un focus NE DOIT
  PAS bloquer la transition de phase : le popup s'ouvre, le statut change,
  et un message clair avec une action « Réessayer » est proposé.

### Key Entities *(include if feature involves data)*

- **Phase de pomodoro** : unité du cycle ; attributs : type (focus, pause,
  longue pause), durée configurée.
- **Cycle de pomodoro** : séquence complète — X répétitions focus/pause
  suivies d'une longue pause ; attribut : compteur de répétition courante
  (1 à X).
- **État du minuteur** : situation à un instant donné ; attributs : phase
  courante, répétition courante, lecture ou suspension, position dans la
  phase (figée si suspendu).
- **Réglages du pomodoro** : préférences de l'utilisateur ; attributs :
  durée focus, durée pause, durée longue pause, nombre X ; persistants.
- **Verset** (entité existante de la feature 001) : un verset neuf est
  affiché à la fin de chaque focus ; le comportement en cas d'échec et à la
  réouverture manuelle est repris de la feature 001.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le statut affiché dans VerseView correspond à la phase réelle
  du minuteur à tout moment (vérifié en test avec des durées au minimum).
- **SC-002**: À la fin de chaque focus, le popup s'ouvre avec un verset neuf
  dans 100 % des cas ; en cas d'indisponibilité de l'API, le message et
  l'action « Réessayer » apparaissent et la transition de phase a lieu quand
  même.
- **SC-003**: Depuis une pause ou une longue pause, le focus suivant démarre
  en 1 interaction (next) ; aucune transition automatique vers un focus
  n'est observée.
- **SC-004**: La suspension / reprise du décompte se fait en 1 interaction
  dans toute phase, sans perte de position (écart nul après reprise).
- **SC-005**: La barre de progression indique correctement la position dans
  le cycle (répétition courante sur X) dans 100 % des cas observés.
- **SC-006**: 100 % des réglages du pomodoro sont conservés après
  redémarrage du navigateur.
- **SC-007**: Le minuteur reste exact pendant que le popup est fermé : à la
  réouverture, la phase et la progression correspondent au temps réellement
  écoulé.

## Assumptions

- Le « repop » du popup (FR-007) se produit quand le décompte de la
  pause / longue pause atteint zéro ; le bouton next reste accessible à tout
  moment en ouvrant le popup. Interprétation de la clarification du
  2026-10-24, à confirmer en planification si nécessaire.
- Le verset affiché à la fin d'un focus est un tirage neuf (cohérent avec la
  feature 001 : nouveau verset à chaque échéance) ; l'ouverture manuelle du
  popup pendant la pause réaffiche le verset courant.
- L'affichage automatique à intervalle de la feature 001 reste inchangé et
  indépendant du pomodoro (hors périmètre).
- Le minuteur fonctionne en arrière-plan du navigateur ; la page VerseView
  est une vue sur son état, pas le minuteur lui-même.
- Après un redémarrage du navigateur, le pomodoro repart sur un nouveau
  cycle plutôt que de restaurer un minuteur en cours (choix de simplicité).
- Bornes de validation : durées entières en minutes, 1 à 1440 (cohérent avec
  l'intervalle existant) ; X entier, 1 à 10.
- Le pomodoro est en lecture par défaut dès la première utilisation ; aucun
  démarrage explicite n'est requis.
- Hors périmètre : notifications sonores ou système, statistiques de
  sessions, historique des cycles, modes de minuterie alternatifs, passer un
  focus en cours.
- Périmètre v1 : Chrome desktop ≥ 127 uniquement, comme la feature 001.
