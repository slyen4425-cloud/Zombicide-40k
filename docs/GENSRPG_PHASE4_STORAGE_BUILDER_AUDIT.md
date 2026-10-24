# GenSrpG — Phase 4 — Audit stockage / migrations — Builders

Date : 2026-09-19

Branche :
`work/gensrpg-phase4-storage-migrations-audit-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-migrations-audit-2026-09-19`

Base :
`9467429b7f195a24ec138cded7231f60b47ba5a4`
(`checkpoint/gensrpg-phase4-asset-resolver-complete-green-2026-09-19`)

## Pourquoi commencer par Builders

La cartographie Phase 2 recense 221 accès directs au stockage, dont 74 dynamiques. Le runtime Dungeon `gensrpg_dungeon_runtime_v2` possède de très nombreux consommateurs et ne constitue pas un premier déplacement sûr.

Le sous-périmètre Builders est beaucoup plus petit et ses responsabilités sont lisibles.

## Clés réelles

Trois clés sont utilisées :

1. `gensrpg_dungeon_custom_rooms_v1`
   - propriétaire : `DungeonRoomCreator100`
   - contenu : tableau de pièces normalisées
   - lecture : fallback `[]`
   - écriture : tableau passé par `normalizeRoom()`

2. `gensrpg_dungeon_room_interactions_v2`
   - propriétaire : `DungeonRoomCreatorV2`
   - contenu : objet indexé par `roomId`
   - lecture : fallback `{}`
   - écriture : données normalisées par `normalizeMeta()`

3. `gensrpg_zone_graphs_v1`
   - propriétaire d’écriture : `DungeonWorldBuilder167821`
   - lecteur secondaire : `DungeonRoomVisualConfig167826`
   - contenu : tableau de graphes normalisés
   - lecture : fallback `[]`
   - écriture : tableau passé par `normalizeGraph()`

## Correction de la cartographie Phase 2

`GENSRPG_PHASE2_STORAGE_OWNERS.json` ne comptait que deux clés Builders résolues.

`gensrpg_dungeon_custom_rooms_v1` apparaissait dans les accès non résolus parce que le scanner Phase 2 ne reconnaît que la première constante d’une déclaration multiple et le fichier Room Creator déclare `VERSION`, `APP_VERSION`, `SCHEMA_VERSION`, `STORAGE_KEY`, etc. sur une seule instruction `const`.

Ce n’est donc pas une clé réellement dynamique.

## Frontière de responsabilité

Le futur service Core doit posséder uniquement la mécanique :
- lire une valeur JSON ;
- écrire une valeur JSON ;
- supprimer éventuellement une clé ;
- gérer proprement JSON invalide / valeur absente.

Il ne doit pas connaître :
- `normalizeRoom()` ;
- `normalizeMeta()` ;
- `normalizeGraph()` ;
- les structures Room/Graph ;
- les règles de Builder.

Les normalizers et `SCHEMA_VERSION` restent dans leurs modules.

## Migrations

Aucune migration de format n’est autorisée dans le premier déplacement.

Le premier raccord doit conserver :
- exactement les mêmes noms de clés ;
- exactement les mêmes JSON persistés ;
- exactement les mêmes fallbacks ;
- exactement les mêmes normalizers.

Les migrations versionnées seront ajoutées seulement après extraction stable de la mécanique de stockage et avec des fixtures d’anciennes données dédiées.

## Ordre retenu

1. service Core stockage JSON minimal, testé hors production ;
2. Room Creator 1.0 — une clé, un lecteur, un writer ;
3. Room Creator V2 ;
4. World Builder + Visual Config sur la clé partagée ;
5. audit de parité Builders ;
6. seulement ensuite choisir un autre sous-périmètre de stockage.

Le runtime de partie `gensrpg_dungeon_runtime_v2` reste explicitement hors périmètre jusqu’à un audit séparé.

## État après extraction Builders — 2026-09-20

Les quatre jalons prévus ont été réalisés sans migration de format :

1. `GensStorageV1` — service JSON générique ;
2. `DungeonRoomCreator100` — `gensrpg_dungeon_custom_rooms_v1` ;
3. `DungeonRoomCreatorV2` — `gensrpg_dungeon_room_interactions_v2` ;
4. `DungeonWorldBuilder167821` + `DungeonRoomVisualConfig167826` — `gensrpg_zone_graphs_v1`.

Résultat :
- les noms de clés historiques sont inchangés ;
- les JSON persistés et fallbacks sont inchangés ;
- `normalizeRoom()`, `normalizeMeta()` et `normalizeGraph()` restent dans leurs modules ;
- Visual Config reste lecteur uniquement du stockage des graphes ;
- aucun accès direct `localStorage` ne reste dans le domaine Builders de la cartographie Phase 2 ;
- le manifeste global passe à 214 accès directs, 143 résolus et 71 dynamiques ;
- aucune migration de schéma n’a été introduite.

Checkpoint fonctionnel de référence avant fermeture documentaire :
`85cc898e2e74165b304f55029e0db8ea736dd46c`

Validations :
- Architecture + navigateur complet `35491789347` — SUCCESS ;
- Firefox `35491789272` — SUCCESS ;
- Tactical Dock `35491789293` — SUCCESS.

La suite du service stockage doit repartir d’un checkpoint GREEN neuf et auditer un autre sous-périmètre. Le runtime `gensrpg_dungeon_runtime_v2` reste volontairement exclu tant que ses nombreux consommateurs et fabriques de clés n’ont pas fait l’objet d’un audit dédié.
