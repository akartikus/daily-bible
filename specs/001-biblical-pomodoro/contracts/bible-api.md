# Contract — Free Use Bible API (client)

**Feature**: 001-biblical-pomodoro · **Date**: 2026-10-20

L'extension est cliente d'une API publique existante. Contrat de
consommation unilatéral : le projet n'expose aucun endpoint.

## Base

`https://bible.helloao.org/` — JSON statique, sans authentification ni clé.
Accès croisé autorisé via `host_permissions`
(voir [storage-schema.md](storage-schema.md)).

## Endpoints consommés

### 1. Index des traductions

`GET /api/available_translations.json`

Utilisé uniquement en diagnostic (vérifier la disponibilité de `fra_lsg`).
Non appelé dans le parcours nominal.

### 2. Livres d'une traduction

`GET /api/fra_lsg/books.json`

Réponse (extrait — champs consommés) :

```json
{
  "translation": { "id": "fra_lsg", "name": "Louis Segond 1910" },
  "books": [
    {
      "id": "GEN",
      "commonName": "Genèse",
      "numberOfChapters": 50,
      "totalNumberOfVerses": 1533
    }
  ]
}
```

Consommation : alimente le cache `BookIndex` (voir
[../data-model.md](../data-model.md)), validité 30 jours.

### 3. Chapitre

`GET /api/fra_lsg/{bookId}/{chapter}.json`

Réponse (extrait — champs consommés) :

```json
{
  "translation": { "id": "fra_lsg" },
  "book": { "id": "GEN", "commonName": "Genèse" },
  "numberOfVerses": 31,
  "chapter": {
    "number": 1,
    "content": [
      { "type": "heading", "content": ["Création du ciel et de la terre"] },
      { "type": "line_break" },
      { "type": "verse", "number": 1, "content": ["Au commencement, Dieu créa…"] }
    ]
  }
}
```

Règle d'extraction : les versets sont les éléments `content` de type
`verse` ; le texte concatène les chaînes et les `FormattedText.text`,
ignore les `VerseFootnoteReference` et les `InlineLineBreak`.

## Règles transversales

- Timeout : 10 s par requête (FR-011, edge case « connexion lente ») ;
  au-delà : message utilisateur avec action « Réessayer ».
- Erreurs réseau, HTTP non 200 ou JSON invalide : même message utilisateur
  (FR-011) — jamais d'écran vide ni de plantage.
- Lecture seule : aucune donnée n'est envoyée à l'API.
- L'API autorise cache et stockage : le cache `BookIndex` est conforme à
  ses conditions d'utilisation.
