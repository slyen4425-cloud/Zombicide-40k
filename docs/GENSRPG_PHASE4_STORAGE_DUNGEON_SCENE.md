# GenSrpG — Phase 4 Storage — Dungeon Scene

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-dungeon-scene-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-dungeon-scene-2026-09-20`

Base exacte :
`1caefc7bf572215ec1c62ad24d94b21bd42cbae4`
(`checkpoint/gensrpg-phase4-storage-next-audit-10-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Périmètre unique

Migrer uniquement le transport JSON de :
`gensrpg_dungeon_scene_v1`.

Propriétaire :
`dungeonMj72_2Script`.

Accès ciblés :
- 1 lecture JSON directe ;
- 1 écriture JSON directe ;
- aucun `removeItem`.

Source exacte :
- `index.html` : `8 174 580` octets ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

Cible déterministe :
- taille : `8 174 580` octets ;
- blob : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

## Autorité conservée

Dungeon MJ reste propriétaire :
- du contenu des éléments de scène ;
- de la validation tableau ;
- des IDs ;
- des salles ;
- des coffres ;
- du rendu après sauvegarde ;
- des limites de `try/catch` historiques.

Core Storage ne possède que le transport JSON.

## Contrat de lecture

Historique :
`JSON.parse(localStorage.getItem(GENS_DUNGEON_SCENE_KEY)||"[]")`

À préserver : absence/chaîne vide/JSON invalide/erreur de lecture -> `[]`, puis non-tableau -> `[]`.

Cible :
`GensStorageV1.readJson(localStorage,GENS_DUNGEON_SCENE_KEY,[])`
sous le même `try/catch`, avec normalisation tableau inchangée.

## Contrat d'écriture

Historique :
`localStorage.setItem(GENS_DUNGEON_SCENE_KEY,JSON.stringify(a||[]))`

Cible :
`GensStorageV1.writeJson(localStorage,GENS_DUNGEON_SCENE_KEY,a||[])`

À préserver :
- erreur de sérialisation/stockage non avalée ;
- `renderDungeonMasterScene()` appelé seulement après écriture réussie ;
- erreur de rendu toujours capturée localement.

## TDD

Tests dédiés :
- `tests/gens_phase4_storage_dungeon_scene_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_dungeon_scene_owner_v1.test.cjs`.

Avant raccord : parité GREEN, owner guard RED.
Après raccord : parité GREEN, owner guard GREEN.

## Interdits

- aucun autre stockage Dungeon ;
- aucun changement élément de scène/coffre/room/rendu ;
- aucun Pending Trap/Special Branch/Economy Session ;
- aucun gameplay-by-profile/runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.
