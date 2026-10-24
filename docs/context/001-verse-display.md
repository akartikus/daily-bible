# Contexte : Affichage d'un verset à la demande (US1)

## Statut
**Actif** — Implémenté, testé, validé

## Décisions d'implémentation

### Architecture
- **API externe** : Free Use Bible API (bible.helloao.org) — traduction Louis Segond 1910 (fra_lsg)
- **Cache** : BookIndex mis en cache dans chrome.storage.local avec invalidation 30 jours
- **Tirage aléatoire** : Livre pondéré par nombre total de versets, chapitre et verset uniformes
- **Service worker** : Orchestration centralisée, état éphémère (MV3)

### Composants
- `VerseView.svelte` — Affichage texte + référence + traduction
- `ErrorView.svelte` — Message d'erreur + bouton « Réessayer »
- `verse.svelte.ts` — Store Svelte 5 (runes) pour le verset courant

### Flux de données
1. Clic sur l'icône → message `ensure-current-verse` au service worker
2. Service worker vérifie `currentCycle.verse`
3. Si null : tirage (BookIndex → livre pondéré → chapitre → extraction), écriture currentCycle, réponse
4. Si présent : réponse immédiate (pas de nouveau tirage — FR-002)
5. Popup affiche VerseView ou ErrorView selon le résultat

### Gestion d'erreurs
- Timeout API : 10 secondes
- Erreurs réseau/HTTP/JSON mappées vers type d'erreur utilisateur
- Hors connexion : ErrorView avec « Réessayer » (FR-011)
- Jamais d'écran vide

### Tests
- 90 tests unitaires + composants passent
- Scénarios quickstart 1, 2, 6 validés

### Performance
- Verset affiché < 3 s après clic (SC-001)
- Tirage aléatoire < 100 ms hors réseau
- Bundle popup : 13.76 kB gzippé (cible < 300 kB)