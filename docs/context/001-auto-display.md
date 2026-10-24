# Contexte : Affichage automatique à intervalle régulier (US2)

## Statut
**Actif** — Implémenté, testé, validé

## Décisions d'implémentation

### Architecture
- **chrome.alarms** : Alarme nommée `verse-interval`, période = `intervalMinutes`
- **chrome.action.openPopup()** : Ouverture automatique du popup (Chrome ≥ 127)
- **Réglages** : `autoDisplayEnabled` (défaut false), `intervalMinutes` (défaut 25, bornes 1–1440)

### Comportement
1. Au démarrage/installation : si `autoDisplayEnabled`, créer/garantir l'alarme
2. Sur `storage.onChanged` pour settings : recréer ou supprimer l'alarme selon `autoDisplayEnabled`
3. À chaque échéance (`onAlarm`) :
   - Appeler `openPopup()` sans condition
   - Tirer un nouveau verset
   - Écrire dans `currentCycle`
4. Si `openPopup()` échoue (popup déjà ouvert) : non bloquant, verset disponible au clic suivant
5. Si tirage échoue : ErrorView si aucun verset en cours, sinon ancien verset conservé (dégradation gracieuse)

### Gestion veille / sortie de veille
- `chrome.alarms` gère nativement la mise en veille
- À la reprise : une seule échéance déclenchée, puis reprise cycle normal (scénario 7 quickstart)

### Tests
- Tests unitaires : settings (défauts + validation), alarms (création/suppression/garantie)
- 90 tests passent
- Scénarios quickstart 4, 7, 8 validés (activation via console service worker en dev)

### Contraintes
- `chrome.alarms` période min 30 s en production (1 min testable en dev non empaqueté)
- `openPopup()` peut rejeter — échec non bloquant (journaliser et continuer)