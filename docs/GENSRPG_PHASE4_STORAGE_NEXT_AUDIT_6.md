# GenSrpG — Phase 4 Storage — Audit suivant 6

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-6-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-6-2026-09-20`

Base exacte :
`d5cc8d0321e3f2a0b0de81c5d5eef018074870c8`
(`checkpoint/gensrpg-phase4-storage-manual-mj-effects-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Objet

Audit uniquement.
Choisir le prochain micro-lot JSON minimal après Manual MJ Effects.
Aucun runtime, gameplay, asset ou stockage n'est modifié dans cet audit.

## Source exacte

`index.html` post-Manual-MJ :
- taille : `8 174 580` octets ;
- blob Git : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

La copie locale exacte a été vérifiée avant inspection.

## Inventaire de départ

- accès directs : `198` ;
- résolus : `133` ;
- non résolus : `65` ;
- clés directes résolues : `25`.

Dungeon :
- accès : `166` ;
- résolus : `116` ;
- non résolus : `50` ;
- clés directes : `17`.

## Candidats inspectés

### `gensrpg_dungeon_economy_rules_160` — RETENU

Propriétaire :
`dungeonEconomy160`.

Sous-responsabilité isolée :
- constantes de règles MJ Economy ;
- 1 lecture JSON directe via `DUNGEON_ECO_RULES_160` ;
- 1 écriture JSON directe via `DUNGEON_ECO_RULES_160`.

Contrat historique :
- valeurs par défaut créées par Dungeon ;
- lecture JSON fusionnée par `Object.assign` ;
- absence / chaîne vide / JSON invalide / erreur lecture -> valeurs par défaut ;
- primitives ou tableaux JSON restent fusionnés selon la sémantique native `Object.assign` ;
- writer sérialise `r || dungeonEconomyRules160()` ;
- erreurs de sérialisation/stockage propagées.

La frontière avec les autres stockages du même bloc est nette :
- `gensrpg_dungeon_session_eco_160_<profileId>` reste dynamique et hors périmètre ;
- `key(heroId)` pour l'inventaire héros reste hors périmètre ;
- aucune modification de loot, coffre, marchand, UI ou récompense.

Raccord cible ultérieur :
- lecture -> `GensStorageV1.readJson(localStorage,DUNGEON_ECO_RULES_160,{})` sous le `try/catch` historique ;
- écriture -> `GensStorageV1.writeJson(localStorage,DUNGEON_ECO_RULES_160,r||dungeonEconomyRules160())`.

Micro-diff déterministe préparé localement :
- taille cible : `8 174 580` octets ;
- blob cible : `16deeb169abbc31a7db04161902e9381fd6888ad`.

### `gensrpg_rpg_gameplay_by_profile_v1` — différé

Toujours un miroir historique avec logique de compatibilité/effacement et seed Monster Capture.
Audit dédié requis.

### `gensrpg_challenge_library_v1` — différé

Toujours partagé entre plusieurs générations/lecteurs Dungeon.
Audit dédié requis.

### `gensrpg_dungeon_runtime_v2` — différé

Famille large, multi-propriétaires et multi-sources.
Audit dédié obligatoire ; aucun raccord global depuis un lot stockage minimal.

## Décision

Le prochain micro-lot devra traiter uniquement :
`gensrpg_dungeon_economy_rules_160`.

Le même bloc `dungeonEconomy160` ne sera pas migré globalement :
les stockages de session dynamique et d'inventaire héros restent directs et intacts.

## Interdits maintenus

- aucun `gensrpg_dungeon_session_eco_160_<profileId>` ;
- aucun `key(heroId)` ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun Challenge / Gameplay-by-profile ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun changement loot/coffre/marchand/UI/gameplay ;
- aucune migration de schéma ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.
