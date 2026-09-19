# GenSrpG — Phase 4 — Service Core stockage JSON

Date : 2026-09-19

Branche :
`work/gensrpg-phase4-core-storage-service-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-core-storage-service-2026-09-19`

Base :
`151e714c1373748ee6a42a03a8ec7fb44aded8c9`
(`checkpoint/gensrpg-phase4-storage-builder-audit-green-2026-09-19`)

## Service

Fichier :
`assets/gensrpg/core/storage-v1.js`

API :
- `readJson(key, fallback, backend?)`
- `writeJson(key, value, backend?)`
- `remove(key, backend?)`

## Frontière

Le service possède uniquement la mécanique JSON/Storage.

Il ne contient :
- aucune clé `gensrpg_*` ;
- aucun schéma métier ;
- aucun normalizer Room/Graph ;
- aucune migration de format ;
- aucun DOM, observer, listener, timer ou réseau.

## Sémantique verrouillée

`readJson()` :
- clé absente -> fallback fourni par le consommateur ;
- JSON invalide -> fallback ;
- JSON `null` -> fallback ;
- erreur de lecture/backend indisponible -> fallback.

`writeJson()` :
- sérialise avec `JSON.stringify(value)` ;
- écrit la clé exacte ;
- retourne la valeur d'origine ;
- ne masque pas une erreur de `setItem`.

`remove()` :
- supprime uniquement la clé demandée.

Un backend compatible Storage peut être injecté pour les tests ; sinon le service utilise `globalThis.localStorage`.

## Production

Le premier jalon reste volontairement hors production :
- absent de `index.html` ;
- absent de `preview.html` ;
- absent de la liste Pages ;
- absent du RuntimeBootstrap.

Le graphe de production reste à 66 fichiers atteignables.

Inventaire physique :
- baseline Phase 2 : 72 JS ;
- Phase 3 : 8 entrypoints inertes ;
- Phase 4 : resolver d'assets + service stockage = 2 services ;
- total physique : 82 JS.

## Validation fonctionnelle

SHA fonctionnel :
`5ea2c49c67977d84bd7d41d09d857377640e1a66`

Runs :
- Architecture + navigateur complet `35464902327` — SUCCESS ;
- Firefox `35464902315` — SUCCESS ;
- Tactical Dock `35464902325` — SUCCESS.

## Suite

Le premier raccord doit être `DungeonRoomCreator100` dans un lot séparé.

Invariants :
- conserver `gensrpg_dungeon_custom_rooms_v1` ;
- conserver `normalizeRoom()` comme autorité métier ;
- conserver le format JSON actuel ;
- aucun changement de schéma/migration pendant ce raccord.
