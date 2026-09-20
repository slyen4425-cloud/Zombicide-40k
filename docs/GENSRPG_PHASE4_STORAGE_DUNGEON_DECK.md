# GenSrpG — Phase 4 Storage — Dungeon Deck

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-dungeon-deck-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-dungeon-deck-2026-09-20`

Base exacte :
`b5c5b49a1b619b502b6a27764d9494852c0865cc`
(`checkpoint/gensrpg-phase4-storage-next-audit-3-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Périmètre

Famille unique :
`gensrpg_dungeon_deck_v1`

État source exact :
- `index.html` : 8 174 618 octets ;
- blob : `5d2b0a6da51fd70bd36f087cb9ab82a1af308226`;
- 1 lecture JSON directe ;
- 2 écritures JSON directes ;
- aucun `gensrpg_dungeon_runtime_v2` dans le bloc.

## Propriétaire

Dungeon reste propriétaire :
- de `remaining` ;
- de `createdAt` ;
- de `dungeonSession` ;
- de l'initialisation du deck ;
- des quantités configurées ;
- de la consommation des objets ;
- du reshuffle lorsque le deck est épuisé ;
- du choix du loot.

Core Storage ne possède que le transport JSON.

## Contrat historique

Lecture :
`JSON.parse(localStorage.getItem(DUNGEON_DECK_KEY) || "null")`
avec erreur avalée.

Si le résultat est absent ou sans `remaining`, Dungeon construit :
`{remaining:{},createdAt:Date.now()}`.

Les nouveaux objets absents sont ajoutés à partir de `loadDeckConfig()`.
Cette complétion n'est persistée que si nécessaire.

Écritures :
- complétion du deck ;
- `dungeonSaveDeckState(ds)`.

Les deux writers avalent historiquement les erreurs de sérialisation/stockage.

## Micro-diff prévu

- 1 lecture -> `GensStorageV1.readJson(localStorage,DUNGEON_DECK_KEY,null)` ;
- 2 écritures -> `GensStorageV1.writeJson(localStorage,DUNGEON_DECK_KEY,ds)` ;
- les `try/catch` des deux writers sont conservés.

Aucun autre code du bloc Deck ne doit changer.

Résultat déterministe du micro-diff :
- taille : `8 174 603` octets ;
- blob : `739ca52610308d085ecf2635c5bc748f70c79a11`.

## Tests

- `tests/gens_phase4_storage_dungeon_deck_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_dungeon_deck_owner_v1.test.cjs`.

Ils verrouillent :
- parité lecture sur absence, JSON invalide, primitives et objets ;
- parité écriture ;
- erreurs de sérialisation et quota avalées ;
- Dungeon toujours propriétaire du schéma et des quantités ;
- 0 accès directs au stockage pour cette clé après raccord ;
- exactement 1 lecture Core + 2 écritures Core ;
- blob final exact.

## Hors périmètre

- `gensrpg_dungeon_runtime_v2` ;
- Economy ;
- Manual MJ Effects ;
- Challenge Library ;
- Stats ;
- Tactical ;
- Capture ;
- valeurs de loot/rareté/quantité ;
- dette Fouiller authored ;
- tout changement de schéma.

## Validation

Aucun checkpoint GREEN avant :
- parité + owner guard GREEN ;
- manifeste Phase 2 avancé de 3 accès seulement ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.
