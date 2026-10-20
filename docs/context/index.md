# Index de la documentation des contextes

Ce fichier est le point d'entrée de la documentation du projet **daily-bible**.
Il indexe les contextes : un contexte décrit une **fonctionnalité précise** de
l'application — pas une feature entière. Une feature peut donc donner lieu à
plusieurs contextes (ex. : affichage d'un verset, minuteur automatique,
réglages).

## Liste des contextes

| Contexte | Feature | Description | Statut | Dernière mise à jour |
| -------- | ------- | ----------- | ----- | -------------------- |
| [001-verse-display](001-verse-display.md) | 001-biblical-pomodoro | Affichage d'un verset complet au clic sur l'icône, sans configuration | brouillon | 2026-10-20 |
| [001-auto-display](001-auto-display.md) | 001-biblical-pomodoro | Ouverture automatique du popup à intervalle régulier (pomodoro) | brouillon | 2026-10-20 |
| [001-settings](001-settings.md) | 001-biblical-pomodoro | Réglages (activation, intervalle) et leur persistance | brouillon | 2026-10-20 |

## Conventions

### Granularité

- Un contexte = une fonctionnalité précise (une user story, un comportement
  observable par l'utilisateur).
- Une feature = plusieurs contextes potentiels, tous rattachés à la même
  spec Spec Kit.
- Les décisions transversales à la feature (stack, structure) vivent dans
  `specs/<feature>/plan.md` ; chaque contexte ne mentionne que les décisions
  qui le concernent.

### Nommage des fichiers

- Un fichier par fonctionnalité : `docs/context/<num-feature>-<fonctionnalite>.md`.
- Le préfixe est le numéro de la feature Spec Kit associée
  (`specs/<num-feature>-<nom>/`), pour regrouper les contextes d'une même
  feature.
- Nommage en `kebab-case`, court et explicite.

### Statuts

- `brouillon` — documentation en cours de rédaction.
- `actif` — fonctionnalité spécifiée ou implémentée, documentation à jour.
- `obsolète` — fonctionnalité retirée ; documentation conservée pour
  l'historique.

### Mise à jour de cet index

Toute création, modification ou suppression d'un contexte s'accompagne de la
mise à jour de la ligne correspondante dans le tableau ci-dessus, avec la
date au format `YYYY-MM-DD`.

## Structure attendue d'une documentation de contexte

Chaque fichier `docs/context/<num-feature>-<fonctionnalite>.md` contient au
minimum :

1. **Titre** — nom de la fonctionnalité.
2. **Description** — comportement attendu, vu par l'utilisateur.
3. **Feature et spécification liées** — feature d'origine et lien vers
   `.spec.md` (user story correspondante).
4. **Décisions techniques** — choix d'implémentation et justifications.
5. **Points d'attention** — contraintes, effets de bord, dépendances.
