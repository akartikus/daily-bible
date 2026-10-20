# Research — Pomodoro Biblique

**Feature**: 001-biblical-pomodoro · **Date**: 2026-10-20

Décisions consolidées à partir de la documentation officielle Chrome et de
la référence de la Free Use Bible API (sources vérifiées le 2026-10-20,
liens en fin de document).

## 1. Source des versets — Free Use Bible API

**Decision**: consommer les endpoints JSON publics de
`https://bible.helloao.org/` :
`GET /api/available_translations.json`,
`GET /api/{translation}/books.json`,
`GET /api/{translation}/{book}/{chapter}.json`.

**Rationale**: gratuite, sans clé ni compte, sans limite d'usage publiée ;
autorise explicitement cache et stockage. La traduction française par défaut
est confirmée disponible : **Louis Segond 1910, ID `fra_lsg`** (domaine
public, 66 livres, 1 189 chapitres, 31 170 versets). Le contenu d'un
chapitre est une liste typée (`heading`, `line_break`, `verse`,
`hebrew_subtitle`) ; un verset porte un `number` et un `content` (chaînes,
texte formaté, références de notes).

**Alternatives considered**: API.Bible / YouVersion (clé + accord éditeur
requis) ; Bible Brain (clé à discrétion) ; Bible embarquée dans l'extension
(contredit la spec : connexion requise, FR-010).

## 2. Tirage aléatoire côté client

**Decision**: l'API n'expose pas d'endpoint « verset aléatoire » — le tirage
est fait par l'extension : (1) récupérer `books.json` (mis en cache),
(2) tirer un livre pondéré par `totalNumberOfVerses`, (3) tirer un chapitre
uniforme, (4) récupérer le chapitre, (5) tirer un verset uniforme.

**Rationale**: la pondération par versets approxime l'uniformité sur les
31 170 versets (FR-002) sans requête supplémentaire ; toutes les
métadonnées nécessaires sont déjà dans `books.json`.

**Alternatives considered**: livre uniforme (biais fort — Psaumes auraient
le même poids qu'Abdias) ; télécharger `complete.json` (~30 Mo, hors
périmètre v1) ; index global pré-calculé des versets (exigerait de
télécharger les 1 189 chapitres).

## 3. Minuteur — `chrome.alarms`

**Decision**: alarme périodique nommée `verse-interval`,
`periodInMinutes = settings.intervalMinutes` (défaut 25). L'alarme est
(re)créée à l'activation de l'affichage automatique et à chaque changement
d'intervalle, supprimée à la désactivation, et vérifiée/recréée si absente
à chaque démarrage du service worker.

**Rationale**: `chrome.alarms` persiste indépendamment du cycle de vie du
service worker (éphémère en MV3). Comportement documenté après mise en
veille : les alarmes manquées se déclenchent au plus une fois, puis
l'alarme périodique reprend à partir du réveil — exactement l'edge case
« sortie de veille » de la spec. Période minimale 30 s en production
(aucune limite en extension non empaquetée — utile pour les tests).

**Alternatives considered**: `setTimeout` dans le service worker (tué après
~30 s d'inactivité) ; garder une fenêtre ouverte en permanence (intrusif) ;
`persistAcrossSessions` (Chrome ≥ 150 uniquement — la recréation au
démarrage du SW est la recommandation officielle multi-versions).

## 4. Ouverture automatique du popup — `chrome.action.openPopup()`

**Decision**: appeler `chrome.action.openPopup()` depuis le service worker
à chaque échéance de l'alarme. `minimum_chrome_version: "127"`. La promesse
peut rejeter (popup déjà ouvert, plein écran…) : l'échec est journalisé et
non bloquant — le verset reste disponible au clic sur l'icône.

**Rationale**: disponible sans geste utilisateur depuis Chrome 127 (entre
118 et 126 : extensions installées par politique uniquement). C'est le
mécanisme le moins intrusif réalisant la décision clarifiée « la fenêtre
s'ouvre automatiquement pour inviter à la pause ».

**Alternatives considered**: notification du navigateur (écartée en
clarification du 2026-10-20) ; ouverture d'un onglet (intrusive, non
demandée).

## 5. Stockage — `chrome.storage.local`

**Decision**: interpréter « local storage » comme `chrome.storage.local`
(zone de stockage locale de l'extension) : réglages, verset courant, cache
de l'index des livres.

**Rationale**: disponible dans tous les contextes de l'extension (service
worker inclus), persiste après redémarrage du navigateur (FR-006/SC-004),
survit au nettoyage de l'historique, quota 10 Mo. Le `window.localStorage`
du Web est explicitement déconseillé pour les extensions : inaccessible
depuis le service worker et perdu au nettoyage des données de navigation.

**Alternatives considered**: `window.localStorage` (écarté ci-dessus) ;
`chrome.storage.sync` (quota ~100 Ko, synchronisation inutile en périmètre
mono-poste) ; IndexedDB (surdimensionné pour trois clés).

## 6. Stack UI — Svelte 5 + Vite + @crxjs/vite-plugin + Tailwind CSS 4

**Decision**: TypeScript strict, Svelte 5 (runes), Vite avec
@crxjs/vite-plugin (manifeste MV3 + HMR), Tailwind CSS 4 via
@tailwindcss/vite, ESLint + Prettier + svelte-check.

**Rationale**: choix explicite de l'utilisateur (Svelte, MV3, Tailwind) ;
@crxjs/vite-plugin est l'outillage standard d'une extension Vite : manifeste
typé, points d'entrée service worker/popup, rechargement à chaud.

**Alternatives considered**: webpack (plus lourd, HMR inférieur) ; React ou
vanilla JS (non demandés) ; Tailwind v3 via PostCSS (ancienne génération).

## 7. Accès réseau — `host_permissions`

**Decision**: déclarer `host_permissions: ["https://bible.helloao.org/*"]`.

**Rationale**: autorise les requêtes depuis le service worker et le popup
sans dépendre des en-têtes CORS du serveur (en MV3, le service worker est
soumis au CORS sauf permission d'hôte explicite).

**Alternatives considered**: s'appuyer sur le CORS du serveur (non
documenté pour ce cas d'usage — risqué).

## Références (vérifiées le 2026-10-20)

- Free Use Bible API — Getting Started :
  https://bible.helloao.org/docs/guide/getting-started.html
- Free Use Bible API — Standard Format (structure des chapitres) :
  https://bible.helloao.org/docs/reference/translations/standard.html
- Free Use Bible API — traductions disponibles (fra_lsg confirmé) :
  https://bible.helloao.org/api/available_translations.json
- Chrome Extensions — `browser.action` (openPopup, Chrome 127+) :
  https://developer.chrome.com/docs/extensions/reference/api/action
- Chrome Extensions — `browser.alarms` (période minimale, veille,
  persistance) :
  https://developer.chrome.com/docs/extensions/reference/api/alarms
- Chrome Extensions — `browser.storage` (zones, quotas, Web Storage
  déconseillé) :
  https://developer.chrome.com/docs/extensions/reference/api/storage
