# Contract — Comportement UI (additif 003)

**Feature**: 003-i18n-ui-redesign · **Date**: 2026-10-31

Additif au contrat 002
([../002-pomodoro-timer/contracts/ui-behavior.md](../002-pomodoro-timer/contracts/ui-behavior.md)).
Les comportements fonctionnels (cycle, alarmes, suspension, dégradation
gracieuse) sont inchangés — la refonte est visuelle et linguistique.
La langue et le catalogue sont dans [i18n.md](i18n.md).

## Charte graphique (FR-010)

| Élément | Règle |
| --- | --- |
| Design system | shadcn-svelte (sources copiées dans `src/popup/components/ui/`), thème neutre par défaut adapté — charte épurée et simple |
| Feuille de thème | variables `:root` / `@theme inline` / `@custom-variant dark` dans `src/popup/app.css` (Tailwind v4, déjà en place) |
| Palette | tokens du thème (background/foreground/muted/destructive/accent) — pas de couleur vive hors tokens |
| Typographie | échelle du thème, texte sobre (pas de titres décoratifs ajoutés) |
| Espacements | gouttières régulières du thème, identiques de vue en vue |
| Cohérence | les 5 vues (verset, erreur, chargement, statut pomodoro, paramètres) partagent la même charte (SC-006) |

## Boutons (FR-005)

| Règle | Description |
| --- | --- |
| Forme | icône seule cliquable — aucun texte visible sur un bouton (SC-003) |
| Icônes | Lucide via `@lucide/svelte`, import par icône (tree-shaké) |
| Libellé accessible | traduit par la locale, `aria-label` + `title` — obligatoire, jamais vide |
| Style | `Button` shadcn-svelte taille `icon`, variantes discrètes (`outline`/`ghost`) |
| Exceptions de texte | aucun — les textes d'action ne sont visibles nulle part sur un bouton ; `settings.backToVerse` reste un bouton icône (retour) |

Correspondance des boutons existants (comportement inchangé) :

| Bouton | Icône Lucide | Libellé accessible |
| --- | --- | --- |
| play/pause (lecture) | `Pause` | `aria.pause` |
| play/pause (suspendu) | `Play` | `aria.resume` |
| next | `SkipForward` | `aria.next` |
| réglages (engrenage) | `Settings` | `aria.settings` |
| retour au verset | `Undo2` | `settings.backToVerse` |
| réessayer (erreur) | `RotateCcw` | `aria.retry` |

La barre de progression à X segments reste un div custom stylé avec les
tokens du thème (accomplis remplis, courant distinct, pleine en longue
pause, X = 1 → un segment) — inchangée fonctionnellement (FR-003).

## Paramètres — deux colonnes (FR-008, FR-009)

| Règle | Description |
| --- | --- |
| Structure | chaque réglage = une ligne de grille `grid-cols-[1fr_auto] items-center` partagée : `Label` à gauche, champ (`Input`/`Switch`) à droite |
| Alignement | gouttière verticale identique pour toutes les lignes (libellés alignés entre eux, champs alignés en colonne droite) |
| Validation | message d'erreur traduit sous le champ concerné (colonne 2), sans décaler l'alignement des lignes suivantes |
| Comportement | refus à la saisie avec message, dernière valeur valide conservée — inchangé (001/002) |

## Ouverture automatique du popup

Inchangée ([../002-pomodoro-timer/contracts/ui-behavior.md](../002-pomodoro-timer/contracts/ui-behavior.md)) :
fin de focus → popup + verset neuf + statut en pause/longue pause ; fin de
pause → repop, aucune transition automatique vers le focus.

## Hors périmètre v1

Sélecteur de langue en UI (la langue suit le navigateur, FR-004), thème
clair/sombre commutable, paramètre de traduction biblique manuel (dérivé de
la locale), nouveaux réglages quelconques.