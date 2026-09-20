# GenSrpG — Phase 4 Storage — Audit suivant 10

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-10-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-10-2026-09-20`

Base exacte :
`5259210bea918719603066057d3c64c4d68624eb`
(`checkpoint/gensrpg-phase4-storage-challenge-history-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Objet

Audit uniquement.
Choisir le prochain micro-lot JSON minimal après Challenge History.
Aucun runtime, gameplay, asset ou stockage n'est modifié dans cet audit.

## Source exacte

`index.html` post-Challenge-History :
- taille : `8 174 580` octets ;
- blob Git : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

Inventaire Phase 2 :
- accès directs : `189` ;
- résolus : `124` ;
- non résolus : `65` ;
- clés directes résolues : `22`.

Dungeon :
- accès : `157` ;
- résolus : `107` ;
- non résolus : `50` ;
- clés directes : `14`.

## Candidat retenu : Dungeon Scene

Clé :
`gensrpg_dungeon_scene_v1`.

Propriétaire unique :
`dungeonMj72_2Script`.

Responsabilité :
état persistant des éléments de scène du MJ Dungeon.

Accès directs exacts :
- 1 lecture JSON ;
- 1 écriture JSON ;
- aucun `removeItem` de cette clé.

Contrat historique de lecture :
- absence / chaîne vide / JSON invalide / erreur de lecture -> `[]` ;
- toute valeur non-tableau -> `[]`.

Contrat historique d'écriture :
- persiste `a||[]` sous forme JSON ;
- une erreur de sérialisation/stockage se propage ;
- `renderDungeonMasterScene()` reste appelé seulement après une écriture réussie ;
- l'erreur de rendu reste capturée par son `try/catch` historique.

Core Storage ne doit posséder que le transport JSON.
Dungeon MJ reste propriétaire du contenu, des IDs, des salles, des coffres et du rendu.

Raccord cible ultérieur :
- lecture -> `GensStorageV1.readJson(localStorage,GENS_DUNGEON_SCENE_KEY,[])` ;
- écriture -> `GensStorageV1.writeJson(localStorage,GENS_DUNGEON_SCENE_KEY,a||[])`.

Micro-diff déterministe préparé en mémoire :
- taille cible : `8 174 580` octets ;
- blob cible : `ee7b474802d8bb3b1d20e3aaf2507c4666fbd054`.

## Candidats différés

### Pending Trap 0.48
`gensrpg_dc048_pending_trap_v1`
- get/set/remove ;
- état de gameplay transitoire ;
- audit dédié requis.

### Special Branch 0.52
`gensrpg_dc052_special_branch_v1`
- get/set/remove ;
- état de navigation ;
- audit dédié requis.

### Economy Session dynamique
`gensrpg_dungeon_session_eco_160_<profileId>`
- clé dynamique ;
- audit dédié requis.

### Gameplay-by-profile
- miroir historique principal hors scanner Phase 2 ;
- `removeItem` + marqueur scalaire ;
- reste différé.

### Dungeon runtime v2
- famille large multi-propriétaires ;
- audit dédié obligatoire.

### Autres familles larges
- Dungeon Core 02 ;
- Tactical 098 ;
- device hero/session profile ;
- MJ Rules ;
- shared Capture entities.

Elles ne sont pas mélangées à ce micro-lot.

## Interdits

- aucun runtime dans cet audit ;
- aucun changement des éléments de scène MJ ;
- aucun changement coffre/room/rendu ;
- aucun Pending Trap/Special Branch/Economy Session ;
- aucun gameplay-by-profile ;
- aucun runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.
