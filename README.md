# Daily Bible — Pomodoro Biblique

Extension Chrome qui affiche un verset biblique à chaque clic sur l'icône,
et ouvre automatiquement la fenêtre à intervalle régulier — un « pomodoro
biblique » qui invite à prendre une pause.

## Fonctionnalités

- **Verset à la demande** — un clic sur l'icône affiche un verset complet
  (texte, référence, traduction), tiré au hasard, sans aucune configuration.
- **Ouverture automatique** — à chaque échéance de l'intervalle défini
  (défaut 25 minutes), la fenêtre s'ouvre seule avec un nouveau verset ;
  activation explicite, rythme fixe non remis à zéro par un clic manuel.
- **Réglages persistants** — activation et intervalle, conservés après
  redémarrage du navigateur ; toute saisie invalide est refusée avec un
  message clair.

## Stack

Svelte 5 · TypeScript strict · Vite + [@crxjs/vite-plugin] · Tailwind CSS 4 ·
Manifest V3 · Vitest + @testing-library/svelte

Les versets proviennent de la [Free Use Bible API] — gratuite, sans clé ni
compte. Traduction par défaut : **Louis Segond 1910** (`fra_lsg`, domaine
public).

## Prérequis

- Node.js ≥ 20 et npm
- Google Chrome ≥ 127 (desktop)
- Connexion internet (l'API des versets est distante)

## Démarrage

```bash
npm install
npm run dev         # développement avec rechargement à chaud (@crxjs)
npm run build       # produit dist/
npm run test        # Vitest (tests unitaires + composants)
npm run check       # svelte-check + ESLint
```

Charger l'extension : Chrome → `chrome://extensions` → mode Développeur →
« Charger l'extension non empaquetée » → sélectionner `dist/`.

Le guide de validation complet (8 scénarios de bout en bout) est dans
[specs/001-biblical-pomodoro/quickstart.md](specs/001-biblical-pomodoro/quickstart.md).

## Structure du dépôt

```text
src/                 # code de l'extension
├── manifest.ts      # manifeste MV3 (via @crxjs/vite-plugin)
├── background/      # service worker (alarme, tirage, openPopup)
├── popup/           # interface (Svelte) : verset, réglages
└── shared/          # logique pure : client API, tirage, wrappers Chrome
tests/               # tests unitaires et composants
specs/               # artefacts Spec Kit de la feature 001
└── 001-biblical-pomodoro/
    ├── spec.md      # spécification (user stories, FR, SC)
    ├── plan.md     # plan d'implémentation
    ├── tasks.md    # tâches d'implémentation
    └── …           # research, data-model, contracts, quickstart
docs/context/        # documentation par fonctionnalité
```

## Documentation

- [docs/context/index.md](docs/context/index.md) — index des contextes
  (une fonctionnalité = un fichier) :
  [001-verse-display](docs/context/001-verse-display.md) ·
  [001-auto-display](docs/context/001-auto-display.md) ·
  [001-settings](docs/context/001-settings.md)
- [specs/001-biblical-pomodoro/spec.md](specs/001-biblical-pomodoro/spec.md) —
  spécification fonctionnelle de référence

## Statut

Feature `001-biblical-pomodoro` : spécifiée, planifiée et tâches générées
([specs/001-biblical-pomodoro/tasks.md](specs/001-biblical-pomodoro/tasks.md)) —
implémentation en cours de démarrage.

[@crxjs/vite-plugin]: https://crxjs.dev/vite-plugin
[Free Use Bible API]: https://bible.helloao.org/