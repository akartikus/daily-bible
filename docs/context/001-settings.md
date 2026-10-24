# Contexte : Réglages simples et persistants (US3)

## Statut
**Actif** — Implémenté, testé, validé

## Décisions d'implémentation

### Architecture
- **Store Svelte 5** : `settings.svelte.ts` avec runes (`$state`, `$derived`, `$effect`)
- **Persistance** : `chrome.storage.local` via wrapper typé (`src/shared/chrome/storage.ts`)
- **Synchronisation** : Écoute `storage.onChanged` pour mise à jour multi-onglet/fenêtre
- **Défauts** : Appliqués au chargement si clé absente

### Réglages
| Clé | Défaut | Contraintes |
|-----|--------|-------------|
| `autoDisplayEnabled` | `false` | booléen |
| `intervalMinutes` | `25` | entier, 1 ≤ x ≤ 1440 |
| `translationId` | `fra_lsg` | fixe v1 (Louis Segond 1910) |

### Validation
- `isValidIntervalMinutes(x)` : entier, 1 ≤ x ≤ 1440
- Rejet : 0, négatifs, > 1440, non-entiers, non-numériques
- Message d'erreur compréhensible, dernière valeur valide conservée (FR-008)

### UI (SettingsView.svelte)
- Interrupteur pour `autoDisplayEnabled` (état initial false)
- Champ numérique pour `intervalMinutes` (bornes 1–1440)
- Application immédiate : écriture storage → recréation alarme si auto activé
- Navigation : bouton engrenage dans VerseView (≤ 2 interactions — FR-007/SC-003)

### Persistance
- Redémarrage Chrome : réglages conservés (FR-006/SC-004)
- Synchronisation via `storage.onChanged` entre popup et service worker

### Tests
- Tests unitaires : settings.test.ts (défauts + validation intervalle), settings-store.test.ts
- Tests composant : SettingsView.test.ts
- 90 tests passent
- Scénarios quickstart 3 et 5 validés manuellement dans Chrome ≥ 127 (2026-10-24)