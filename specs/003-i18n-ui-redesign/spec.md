---
description: "Feature specification for internationalisation and UI redesign"
---

# Feature Specification: Internationalisation et refonte graphique

**Feature Branch**: `003-i18n-ui-redesign`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "on doit internationaliser l'extension, suivant la langue de navigateur, on doit avoir soit FR soit EN, si on a une langue inconue on aura EN en fallback, on doit aussi faire une refonte graphique de l'application, les boutons doivent etre epurés et discret juste des icones clickacle. Dans les paramettres on alignera correctement les labels et les inputs proprements dans deux colonnes. On veux une charte graphique epuré et simple."

**Terminologie** : « langue de l'interface » désigne les textes de l'application
(statuts, boutons, libellés des paramètres, messages) ; « contenu biblique »
désigne le texte du verset affiché, fourni par la traduction choisie.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interface dans la langue du navigateur (Priority: P1)

En tant qu'utilisateur, je veux que l'interface s'affiche dans la langue de mon
navigateur — français si mon navigateur est en français, anglais dans tout autre
cas — pour comprendre l'application sans barrière linguistique.

**Why this priority**: c'est la demande première (« on doit
internationaliser l'extension ») ; sans elle, un utilisateur non francophone ne
comprend ni les statuts ni les paramètres.

**Independent Test**: régler le navigateur en anglais (ou toute autre langue),
ouvrir le popup et vérifier que tous les textes d'interface sont en anglais ;
régler le navigateur en français et vérifier que tous les textes sont en
français.

**Acceptance Scenarios**:

1. **Given** un navigateur dont la langue est le français (`fr` ou variante
   régionale `fr-CA`, `fr-BE`, …), **When** j'ouvre le popup, **Then** tous les
   textes d'interface s'affichent en français.
2. **Given** un navigateur dont la langue est l'anglais (`en-US`, `en-GB`, …),
   **When** j'ouvre le popup, **Then** tous les textes d'interface s'affichent
   en anglais.
3. **Given** un navigateur dans une langue non prise en charge (`de`, `es`,
   `ja`, …), **When** j'ouvre le popup, **Then** tous les textes s'affichent en
   anglais (fallback).
4. **Given** l'interface ouverte, **When** je navigue entre les vues (verset,
   erreur, paramètres) et que l'état du pomodoro change, **Then** les textes
   restent dans la même langue, sans mélange français/anglais.

---

### User Story 2 - Boutons épurés en icônes seules (Priority: P2)

En tant qu'utilisateur, je veux des boutons épurés et discrets — des icônes
seules, cliquables, sans texte visible — pour une interface visuellement
silencieuse.

**Why this priority**: refonte demandée explicitement ; elle transforme l'apparence
de toutes les vues mais ne bloque pas l'usage de l'application.

**Independent Test**: ouvrir chaque vue (verset avec pomodoro actif, en pause,
suspendu ; erreur ; paramètres) et vérifier que chaque bouton est une icône
seule, discrète, cliquable et identifiable par un libellé accessible.

**Acceptance Scenarios**:

1. **Given** le pomodoro en lecture dans la vue verset, **When** je regarde le
   bouton de contrôle du décompte, **Then** je vois une icône seule proposant
   l'action opposée à l'état (icône pause en lecture, icône lecture si
   suspendu), sans texte visible.
2. **Given** le pomodoro en pause ou longue pause, **When** je regarde la rangée
   de contrôles, **Then** le bouton next apparaît comme une icône seule ;
   il n'apparaît pas pendant un focus.
3. **Given** n'importe quel bouton de l'application, **When** je le survole ou
   qu'un lecteur d'écran le parcourt, **Then** son action est décrite par un
   libellé accessible dans la langue de l'interface (icône seule = libellé
   obligatoire pour l'accessibilité).
4. **Given** l'en-tête de la vue verset, **When** je cherche l'accès aux
   paramètres, **Then** il est proposé par une icône seule (engrenage) ;
   le retour au verset depuis les paramètres est aussi une icône seule.
5. **Given** la vue d'erreur, **When** le tirage du verset a échoué, **Then**
   l'action « Réessayer » est proposée par une icône seule cliquable.

---

### User Story 3 - Paramètres en deux colonnes et charte épurée (Priority: P3)

En tant qu'utilisateur, je veux des paramètres lisibles — chaque libellé et son
champ alignés sur deux colonnes — et une charte graphique épurée et simple
appliquée à toute l'application, pour une expérience nette et cohérente.

**Why this priority**: confort de lecture et cohérence visuelle ; l'application
reste fonctionnelle sans cette refonte.

**Independent Test**: ouvrir les paramètres et vérifier l'alignement en deux
colonnes de chaque ligne de réglage ; comparer toutes les vues et vérifier la
cohérence de la charte (palette réduite, typographie sobre, espacements
réguliers).

**Acceptance Scenarios**:

1. **Given** la vue paramètres, **When** je la consulte, **Then** chaque réglage
   est présenté sur une ligne à deux colonnes : le libellé aligné à gauche, le
   champ aligné à droite, l'alignement identique pour toutes les lignes.
2. **Given** la vue paramètres, **When** un réglage est refusé (valeur
   invalide), **Then** le message d'erreur s'affiche à côté du champ concerné,
   dans la langue de l'interface, sans casser l'alignement.
3. **Given** n'importe quelle vue (verset, erreur, chargement, statut pomodoro,
   paramètres), **When** je les compare, **Then** la même charte s'applique :
   palette de couleurs réduite, typographie sobre, espacements réguliers.
4. **Given** la vue verset, **When** le statut pomodoro est affiché avec X = 10,
   **Then** la barre de progression reste nette et lisible (segments réguliers)
   dans la charte épurée.

---

### Edge Cases

- Langue du navigateur absente ou non détectable → anglais (fallback).
- Variante régionale de la langue (`fr-CA`, `en-AU`) → langue de base
  correspondante (`fr`, `en`).
- Chaîne de texte absente dans la langue demandée → texte anglais affiché
  (jamais de libellé vide ou de code brut visible à l'utilisateur).
- Libellé accessible (infobulle / lecture d'écran) absent sur une icône seule →
  interdit : chaque icône garde son libellé traduit.
- Message d'erreur long (validation d'un champ) → l'alignement deux colonnes
  des paramètres reste intact.
- Changement de la langue du navigateur pendant une session → la nouvelle
  langue s'applique à la prochaine ouverture du popup ; aucun mélange dans un
  même affichage.
- Comportement fonctionnel des features 001 et 002 (cycle pomodoro, alarmes,
  persistance, dégradation gracieuse) : inchangé — la refonte est purement
  visuelle et linguistique.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'interface DOIT s'afficher en français lorsque la langue du
  navigateur est le français (préfixe `fr`, variantes régionales incluses).
- **FR-002**: L'interface DOIT s'afficher en anglais pour toute autre langue du
  navigateur (anglais natif et langues non prises en charge — fallback EN).
- **FR-003**: Tous les textes d'interface DOIVENT exister en français et en
  anglais : statuts du pomodoro (Focus / Pause / Longue pause et leurs
  équivalents anglais), texte de répétition (`répétition n / X`), libellés et
  messages des paramètres (noms des champs, messages de validation),
  boutons (pause, lecture, next, réglages, retour, réessayer), messages
  d'erreur, texte de chargement, libellés accessibles des icônes.
- **FR-004**: La langue DOIT être déduite du navigateur à l'ouverture de
  l'interface, sans réglage manuel ni préférence persistée.
- **FR-005**: Chaque bouton DOIT être une icône seule, épurée et discrète,
  cliquable, sans texte visible ; son action DOIT rester identifiable par un
  libellé accessible dans la langue de l'interface.
- **FR-006**: Le bouton de contrôle du décompte DOIT proposer l'action opposée à
  l'état courant (icône pause pendant la lecture, icône lecture pendant une
  suspension), dans toute phase — le comportement de la feature 002 est
  inchangé.
- **FR-007**: Le bouton next DOIT apparaître uniquement pendant une pause ou une
  longue pause (icône seule) — le comportement de la feature 002 est inchangé.
- **FR-008**: La vue paramètres DOIT présenter chaque réglage sur une ligne à
  deux colonnes : libellé à gauche, champ à droite, alignement identique pour
  toutes les lignes.
- **FR-009**: Une erreur de validation dans un champ DOIT s'afficher dans la
  langue de l'interface, à côté du champ concerné, sans rompre l'alignement ;
  la dernière valeur valide reste conservée (comportement 001/002 inchangé).
- **FR-010**: Toutes les vues DOIVENT suivre une charte graphique épurée et
  simple : palette de couleurs réduite, typographie sobre, espacements
  réguliers — cohérente de vue en vue.
- **FR-011**: La refonte NE DOIT PAS modifier le comportement des features 001
  et 002 : les transitions, la persistance, l'affichage automatique et la
  dégradation gracieuse restent identiques.

### Key Entities *(include if feature involves data)*

- **Langue d'interface** : `fr` ou `en`, dérivée de la langue du navigateur au
  démarrage ; non persistée, non réglable.
- **Catalogue de textes** : l'ensemble des libellés d'interface, par langue
  (statuts, boutons, champs, messages, libellés accessibles) ; complet pour
  `fr` et `en`.
- **Charte graphique** : palette réduite, échelle typographique, espacements —
  appliquée à toutes les vues du popup.
- **Bouton icône** : action cliquable représentée par une icône seule ;
  attributs : icône, libellé accessible traduit, condition de visibilité.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des textes visibles de l'interface sont en français pour un
  navigateur français, en anglais pour tout autre navigateur — aucun mélange
  de langues dans un même affichage.
- **SC-002**: Un navigateur dans une langue non prise en charge affiche
  l'interface en anglais dans 100 % des cas.
- **SC-003**: 100 % des boutons sont des icônes seules, chacune dotée d'un
  libellé accessible traduit ; aucune action n'est représentée par du texte
  visible.
- **SC-004**: Dans la vue paramètres, 100 % des réglages sont alignés sur deux
  colonnes, identiques de ligne en ligne, y compris pendant une erreur de
  validation.
- **SC-005**: Aucune régression fonctionnelle des features 001 et 002 : la
  suite de tests existante passe et les scénarios des quickstarts 001/002
  restent conformes.
- **SC-006**: La charte graphique est identique d'une vue à l'autre (palette,
  typographie, espacements) sur les 5 vues du popup.

## Assumptions

- La langue détectée est celle de l'interface du navigateur (préférence
  linguistique du profil), pas celle du système d'exploitation.
- Les variantes régionales se ramènent à la langue de base (`fr-CA` → `fr`,
  `en-GB` → `en`).
- Aucun réglage manuel de langue : choix explicite de suivre le navigateur.
- Une icône seule sans libellé accessible est considérée comme un défaut
  d'accessibilité, pas comme un style.
- Hors périmètre : langues autres que FR/EN, sélecteur de langue manuel,
  refonte du contenu des versets (texte biblique), notifications système,
  nouveaux réglages.
- Le contenu biblique suit la langue de l'interface (décision de
  planification, research.md §2) : français → Louis Segond 1910 (inchangé),
  anglais → King James Version ; « refonte du contenu des versets »
  (présentation, mise en page du texte biblique) reste hors périmètre.
- La charte graphique est tranchée en planification : design system au thème
  neutre épuré et bibliothèque d'icônes cohérente (détails dans research.md §3–4).