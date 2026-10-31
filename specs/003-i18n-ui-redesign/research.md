# Research — Internationalisation et refonte graphique

**Feature**: 003-i18n-ui-redesign · **Date**: 2026-10-31

Décisions consolidées à partir des documentations officielles shadcn-svelte,
Lucide et Chrome Extensions (sources vérifiées le 2026-10-31, liens en fin de
document), de l'API des versets (vérifiée en direct le 2026-10-31) et des
mécanismes déjà validés par les features 001/002.

## 1. Mécanisme d'internationalisation — catalogue TS typé + langue du navigateur

**Decision**: un catalogue de textes typé dans `src/shared/i18n/`
(`en.ts`, `fr.ts`, `index.ts`). La langue se déduit du navigateur via
`chrome.i18n.getUIanguage()` (API Chrome, aucune permission) ramenée à
`"fr" | "en"` : préfixe `fr` (variantes régionales incluses) → `"fr"`, tout le
reste → `"en"` (fallback). Le type `Messages` est déduit de `en.ts` et `fr.ts`
est typé `Messages` : une clé manquante en français est une erreur de
compilation, l'edge « chaîne absente → texte anglais » est garanti par
structure et non par du code de fallback.

**Rationale**: cohérent avec le style typé existant (`StorageKey`,
`PomodoroRequest`) ; usage synchrone dans les composants Svelte (pas d'await
au rendu) ; testable comme fonction pure (`resolveUiLocale`) et via le mock
Chrome existant ; la langue est fixe pour la durée d'ouverture du popup (la
spec exige la nouvelle langue « à la prochaine ouverture », pas de
rechargement à chaud).

**Alternatives considered**: `_locales/{en,fr}/messages.json` +
`chrome.i18n.getMessage` + `default_locale` dans le manifeste (mécanisme
plateforme, mais clés en chaînes magiques sans typage, placeholders
`$N$` moins lisibles, et la complétude FR/EN ne serait plus vérifiée à la
compilation) ; une librairie i18n tierce (svelte-i18n — surdimensionnée pour
deux locales fixes, contredit la constitution III).

## 2. Langue du verset — suit la langue de l'interface (résout NEEDS CLARIFICATION)

**Decision**: la traduction biblique suit la langue de l'interface :
`fr` → Louis Segond 1910 (`fra_lsg`, inchangé), `en` → King James Version
(`eng_kjv`). Vérifié sur `GET /api/available_translations.json` (2026-10-31) :
`eng_kjv` — « King James (Authorized) Version », langue `eng`, domaine public,
66 livres / 1 189 chapitres / 31 102 versets, mêmes endpoints JSON que
`fra_lsg`. La table locale→traduction vit dans `src/shared/bible/draw.ts`
(qui remplace ses constantes uniques `TRANSLATION_ID`/`TRANSLATION_NAME` par
cette table) ; le champ réglage `settings.translationId` (non éditable en UI,
jamais lu) devient mort et est supprimé.

**Rationale**: « on doit avoir soit FR soit EN » porte sur l'extension
entière — le verset est le contenu cœur, un anglophone ne lit pas Louis
Segond ; les noms de livres arrivent localisés avec la traduction (ex.
« Genesis » pour `eng_kjjv`), aucun mappage supplémentaire ; zéro nouvelle
intégration (mêmes endpoints, même `BibleApiError`, même cache 30 jours —
la clé de cache devient par traduction). KJV est l'équivalent classique
public-domain de Louis Segond.

**Alternatives considered**: verset toujours en Louis Segond, seule
l'habillage traduite (expérience mixte pour un anglophone — contredit
« soit FR soit EN ») ; World English Bible (`ENGWEBP`, anglais moderne)
au lieu de la KJV (choix d'ergonomie valable, KJV retenue comme
contrepartie historique de la Segond — à revoir si la lisibilité moderne
devient une demande).

## 3. Icônes — `@lucide/svelte` (lucide.dev)

**Decision**: le paquet officiel `@lucide/svelte`, imports par icône
(`import Pause from "@lucide/svelte/icons/pause"`) — tree-shakable, rend un
SVG inline, props `size`/`color`/`strokeWidth`, conçu pour Svelte 5.
Remplace les trois SVG copiés à la main dans `PomodoroStatus.svelte` et
équipe les autres actions : `Settings` (engrenage), `RotateCcw` (Réessayer),
`SkipForward` (next), `Pause`/`Play` (play/pause). Les boutons icône seule
gardent un libellé accessible traduit (`aria-label` + `title`) — exigé par
la spec FR-005 (icône sans libellé accessible = défaut d'accessibilité).

**Rationale**: demande explicite « lucide.dev » ; paquet officiel maintenu
par l'équipe Lucide (docs Svelte dédiées), licence ISC, 1500+ icônes
cohérentes en style stroke 2.

**Alternatives considered**: SVG inline copiés (statu quo — duplication
et incohérence visuelle) ; `svelte-lucide` tiers (paquet communautaire non
officiel, API Props moins idiomatique Svelte 5).

## 4. Design system — shadcn-svelte (shadcn-svelte.com)

**Decision**: adopter shadcn-svelte (portage Svelte de shadcn/ui, bâti sur
Bits UI + Tailwind CSS) via son CLI
(`npx shadcn-svelte@latest init` puis `add button input label switch`) qui
copie les sources des composants dans le projet (composants possédés, pas
de dépendance noire) et installe `bits-ui`, `tailwind-variants`,
`tailwind-merge`, `clsx`, `tw-animate-css`. Compatible Tailwind v4 déjà en
place : la feuille `src/popup/app.css` reçoit les variables du thème
(`:root` / `@theme inline` / `@custom-variant dark`) ; la charte épurée est
la palette neutre du thème par défaut, adaptée (radius/contrast) sans
couleurs vives supplémentaires. Les composants arrivent dans
`src/popup/components/ui/` (alias `components.json`), à côté des vues
existantes. Composants requis : `Button` (variante `outline`/`ghost`, taille
`icon`), `Input`, `Label`, `Switch` — la barre à X segments reste un div
custom stylé avec les tokens du thème (aucun composant Progress standard
n'est segmenté).

**Rationale**: demande explicite « shadcn-svelte.com » ; documentation
officielle confirmant la prise en charge Tailwind v4 (`@import
"tailwindcss"` + `@custom-variant dark`, guide de migration dédié) ;
composants copiés = customisables et lisibles dans le dépôt ; accessibilité
(WAI-ARIA) fournie par Bits UI — cohérente avec l'exigence de libellés
accessibles.

**Alternatives considered**: réécrire les styles à la main (contredit la
demande explicite) ; Flowbite/Skeleton Svelte (moins épurés, pas la
demande). En cas d'échec du CLI dans l'environnement, installation manuelle
documentée (copie des sources + mêmes dépendances).

## 5. Paramètres en deux colonnes — grille libellé | champ

**Decision**: chaque réglage de `SettingsView` devient une ligne de grille
`grid-cols-[1fr_auto] items-center gap-*` (une seule définition partagée) :
libellé à gauche (`Label`), champ à droite (`Input` ou `Switch`), gouttière
verticale alignée pour toutes les lignes. Le message d'erreur de validation
s'affiche sous le champ concerné en `grid-column: 2` sans décaler
l'alignement des lignes suivantes.

**Rationale**: FR-008 exige « libellé à gauche, champ à droite, alignement
identique pour toutes les lignes » ; une grille CSS unique par ligne donne
l'alignement par construction, y compris pendant une erreur (FR de 001/002
conservés : refus à la saisie, dernière valeur valide conservée).

**Alternatives considered**: flexbox `justify-between` par ligne (aligne
les bords mais pas les largeurs de champ entre lignes) ; tableau HTML
(sémantique inadaptée à un formulaire).

## Références (vérifiées le 2026-10-31)

- shadcn-svelte — installation Vite, `components.json`, composants
  `button`/`input`/`label`/`switch`, thème Tailwind v4 :
  https://shadcn-svelte.com/docs/installation/vite
  https://shadcn-svelte.com/docs/components/button
  https://shadcn-svelte.com/docs/migration/tailwind-v4
- Lucide — guide Svelte officiel (`@lucide/svelte`, imports par icône,
  props) : https://lucide.dev/guide/packages/svelte
- Chrome Extensions — `chrome.i18n.getUIanguage` (langue de l'interface du
  navigateur, aucune permission) :
  https://developer.chrome.com/docs/extensions/reference/api/i18n
- API des versets — traductions disponibles (endpoints inchangés,
  `eng_kjv` présent) : https://bible.helloao.org/api/available_translations.json
- Mécanismes réutilisés des features 001/002 :
  [../002-pomodoro-timer/research.md](../002-pomodoro-timer/research.md)