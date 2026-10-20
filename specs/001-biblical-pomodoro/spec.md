# Feature Specification: Pomodoro Biblique

**Feature Branch**: `001-biblical-pomodoro`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Une extension Chrome user friendly avec une interface simple et épurée qui permet d'afficher un verset biblique à chaque fois qu'on clique dessus ou tous les X temps définis, comme un pomodoro biblique."

## Clarifications

### Session 2026-10-20

- Q: Comment le verset affiché doit-il être choisi à chaque affichage ? → A: Tirage aléatoire parmi tous les versets de la traduction choisie (v1) ; des versets thématiques selon la période du calendrier sont envisagés comme évolution future, hors périmètre v1.
- Q: Sous quelle forme un verset doit-il apparaître lorsqu'il s'affiche automatiquement à l'échéance de l'intervalle ? → A: La fenêtre de l'extension s'ouvre automatiquement et affiche le verset complet — le pomodoro invite explicitement à prendre une pause (remplace l'hypothèse initiale « notification du navigateur »).
- Q: Quel intervalle X par défaut proposer à un nouvel utilisateur qui n'a encore rien réglé ? → A: 25 minutes (standard pomodoro).
- Q: Un affichage manuel (clic sur l'icône) doit-il remettre le minuteur automatique à zéro ? → A: Non — le minuteur suit un rythme fixe ; le clic manuel réaffiche simplement le verset en cours (celui du cycle X courant), sans consommer un nouveau tirage.
- Q: À l'installation, l'affichage automatique est-il activé ou désactivé par défaut ? → A: Désactivé — l'utilisateur l'active explicitement dans les réglages.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Afficher un verset à la demande (Priority: P1)

En tant qu'utilisateur, je veux obtenir un verset biblique en un seul clic
sur l'icône de l'extension, sans aucune configuration, pour recevoir une
inspiration immédiate.

**Why this priority**: c'est la valeur cœur du produit et le MVP complet :
aucun réglage n'est nécessaire, et toutes les autres capacités s'appuient sur
celle-ci.

**Independent Test**: peut être testée seule en cliquant sur l'icône de
l'extension et en vérifiant qu'un verset complet s'affiche.

**Acceptance Scenarios**:

1. **Given** l'extension installée et jamais configurée, **When**
   l'utilisateur clique sur l'icône, **Then** un verset s'affiche en moins
   de 3 secondes sur une connexion standard, avec son texte et sa
   référence.
2. **Given** un verset déjà affiché (cycle en cours), **When**
   l'utilisateur clique à nouveau, **Then** le verset en cours du cycle
   est réaffiché (le verset change à la prochaine échéance de
   l'intervalle, pas au clic).
3. **Given** aucune connexion internet, **When** l'utilisateur clique,
   **Then** un message clair indique que les versets nécessitent une
   connexion et propose de réessayer ; l'extension ne plante pas.

---

### User Story 2 - Affichage automatique à intervalle régulier (Priority: P2)

En tant qu'utilisateur, je veux définir un intervalle de temps X pour qu'un
verset s'affiche automatiquement toutes les X minutes, comme un pomodoro
biblique qui rythme ma journée.

**Why this priority**: c'est le différenciateur du produit, mais il suppose
des réglages ; l'extension reste utile (story 1) sans cette capacité.

**Independent Test**: activable seule en activant l'affichage automatique
puis en réglant un intervalle court, et en observant l'affichage
automatique, sans dépendre d'aucune autre story.

**Acceptance Scenarios**:

1. **Given** l'affichage automatique activé avec un intervalle X, **When**
   X minutes s'écoulent, **Then** la fenêtre de l'extension s'ouvre
   automatiquement et affiche un verset complet, sans action de
   l'utilisateur.
2. **Given** l'affichage automatique désactivé, **When** X minutes
   s'écoulent, **Then** aucun verset ne s'affiche automatiquement.
3. **Given** l'extension fraîchement installée (jamais configurée),
   **When** l'intervalle par défaut s'écoule, **Then** aucun verset ne
   s'affiche automatiquement tant que l'utilisateur n'a pas activé
   l'affichage automatique.

---

### User Story 3 - Réglages simples et persistants (Priority: P3)

En tant qu'utilisateur, je veux ajuster mes réglages (intervalle,
activation) de façon évidente, et les retrouver après un redémarrage du
navigateur.

**Why this priority**: nécessaire pour un usage durable, mais l'expérience de
base fonctionne sans ; c'est un confort de configuration.

**Independent Test**: testable seule en modifiant chaque réglage et en
vérifiant sa persistance après redémarrage du navigateur.

**Acceptance Scenarios**:

1. **Given** les réglages ouverts, **When** l'utilisateur change
   l'intervalle, **Then** le nouvel intervalle s'applique au prochain cycle.
2. **Given** des réglages enregistrés, **When** le navigateur est
   redémarré, **Then** tous les réglages sont conservés.

---

### Edge Cases

- Que se passe-t-il si l'utilisateur saisit un intervalle invalide (0,
  négatif, ou supérieur à 24 heures) ? La saisie est refusée avec un message
  clair ; la dernière valeur valide est conservée.
- Comment le système réagit-il si l'API de versets est indisponible ou
  renvoie une erreur ? Un message gracieux s'affiche, avec une action pour
  réessayer ; l'extension ne plante pas.
- Que se passe-t-il si la connexion est lente et que l'API tarde à
  répondre ? Un délai d'attente maximal est respecté, puis un message
  clair invite à réessayer.
- Que se passe-t-il si le navigateur sort de veille après plusieurs heures ?
  Un seul verset s'affiche (pas de rafale de versets en retard) et le
  minuteur reprend à la prochaine échéance prévue.
- Que se passe-t-il si aucun verset n'est disponible (sélection vide) ?
  Un message explicite s'affiche plutôt qu'un écran vide.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher un verset biblique (texte +
  référence) lorsque l'utilisateur clique sur l'icône de l'extension.
- **FR-002**: Le système DOIT sélectionner un nouveau verset par tirage
  aléatoire parmi tous les versets de la traduction choisie à chaque
  échéance de l'intervalle ; un clic manuel réaffiche le verset en cours du
  cycle courant, sans consommer un nouveau tirage ni affecter le minuteur.
  Au premier usage (aucun verset en cours), le clic initialise le verset du
  cycle courant.
- **FR-003**: L'utilisateur DOIT pouvoir activer et désactiver l'affichage
  automatique ; l'affichage automatique est désactivé par défaut à
  l'installation et n'est actif qu'après activation explicite.
- **FR-004**: L'utilisateur DOIT pouvoir définir l'intervalle d'affichage X ;
  la valeur par défaut, avant tout réglage, est de 25 minutes (standard
  pomodoro).
- **FR-005**: Le système DOIT afficher un verset automatiquement à chaque
  échéance de l'intervalle lorsque l'affichage automatique est actif.
- **FR-006**: Le système DOIT conserver les réglages de l'utilisateur entre
  les sessions de navigation.
- **FR-007**: L'interface DOIT être simple et épurée : afficher un verset
  demande au plus 1 interaction, accéder aux réglages au plus 2.
- **FR-008**: Le système DOIT refuser tout intervalle invalide (0, négatif,
  supérieur à 24 h) avec un message compréhensible.
- **FR-009**: Chaque verset affiché DOIT inclure sa référence complète
  (livre, chapitre, verset) et sa traduction.
- **FR-010**: Le système DOIT obtenir les versets auprès de l'API publique
  existante Free Use Bible API (https://bible.helloao.org/), gratuite, sans
  clé ni compte.
- **FR-011**: Le système DOIT afficher un message clair et proposer de
  réessayer lorsque les versets ne peuvent pas être récupérés (connexion
  indisponible, erreur ou lenteur de l'API), sans plantage.

### Key Entities *(include if feature involves data)*

- **Verset** : un passage biblique affichable ; attributs : texte,
  référence (livre, chapitre, verset), traduction.
- **Réglages** : préférences de l'utilisateur ; attributs : intervalle
  d'affichage, activation de l'affichage automatique, traduction choisie.
- **API publique de versets** : service externe existant (Free Use Bible
  API, https://bible.helloao.org/) consommé par l'extension ; fournit les
  versets avec leur référence et leur traduction ; gratuit, sans clé ni
  compte, sans limite d'usage publiée.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur une connexion standard, un verset s'affiche en moins de
  3 secondes après le clic (perçu comme instantané).
- **SC-002**: 100 % des utilisateurs obtiennent un verset sans aucune
  configuration préalable (expérience « zéro réglage »).
- **SC-003**: Toute fonctionnalité est accessible en 2 interactions maximum
  depuis l'icône de l'extension.
- **SC-004**: Les réglages sont conservés à 100 % après redémarrage du
  navigateur.
- **SC-005**: L'affichage automatique se déclenche à 5 secondes près de
  l'intervalle défini.

## Assumptions

- Public cible : utilisateurs francophones sur Chrome desktop.
- Traduction par défaut : Louis Segond 1910 (domaine public), pour éviter
  toute dépendance de licence ; sa disponibilité exacte dans l'API sera
  confirmée à la planification (l'API expose de nombreuses traductions,
  dont des françaises) ; d'autres traductions sont hors périmètre v1.
- Les versets nécessitent une connexion internet : ils sont obtenus auprès
  de l'API publique existante Free Use Bible API (https://bible.helloao.org/)
  — gratuite, sans clé ni compte, sans limite d'usage publiée, cache et
  stockage autorisés par ses conditions ; le mode hors ligne reste hors
  périmètre v1.
- L'API est une dépendance externe, pas un livrable de cette feature ; en
  cas d'indisponibilité ou de changement de l'API, le comportement de secours
  défini par FR-011 s'applique.
- L'affichage automatique ouvre automatiquement la fenêtre de l'extension
  affichant le verset complet : le pomodoro invite explicitement à prendre
  une pause (décision clarifiée le 2026-10-20, remplace l'hypothèse initiale
  « notification du navigateur »).
- « Cliquer dessus » signifie cliquer sur l'icône de l'extension dans la
  barre d'outils Chrome.
- Périmètre v1 : Chrome desktop uniquement (pas Firefox, Edge, ni mobile).
- Versets thématiques selon la période du calendrier (avent, carême, etc.) :
  évolution future envisagée, hors périmètre v1.