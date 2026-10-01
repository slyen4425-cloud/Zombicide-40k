# GenSrpG — Phase 7 / Dungeon generated — audit frontière carte de salle — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-enemy-branch-normalization-audit-green-2026-09-30`

SHA exact de base :
`f7e0979fcdf2bbfe9d0c59a269de2b943005f5cf`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-map-boundary-audit-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-map-boundary-audit-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN documentaire de la base :
- Architecture + Browser `36762830930` — SUCCESS ;
- Firefox `36762830943` — SUCCESS ;
- Tactical Dock `36762830683` — SUCCESS.

Runtime courant :
- `index.html` : `8169447` octets ;
- blob Git : `106d2ec6e82f3b777e1d724cd3f74f30a22fdf39`.

## Position Phase 7

Les lots 31 et 32 ont déjà extrait :
- `buildGeneratedNonCombatRoomResult(kind, trapType)` ;
- `shouldDefaultGeneratedRoomEnemyBranch(enemy, room)`.

Core 2.00 conserve encore dans `createRoom(room,kind)` :
- encounter / Boss ;
- choix du piège ;
- chargement / mutation / sauvegarde ennemis ;
- décision carte activée/désactivée ;
- appel `generateDungeonMap(...)` ;
- composition finale `{result,map}`.

Le présent lot ne refait ni les résultats non-combat ni la normalisation dc200Branch.

## Cible stricte du micro-lot 33

Caractériser uniquement la frontière carte actuelle :

`const map=cfg().map===false?null:generateDungeonMap(kind,result.enemyQty||0);`

puis :

`return {result,map};`

L'audit doit distinguer :
1. sémantique stricte `map === false` ;
2. autres valeurs falsy/truthy de `map` ;
3. fallback historique `result.enemyQty || 0` sans normalisation numérique supplémentaire ;
4. ordre après sauvegarde ennemis ;
5. nombre exact d'appels à `generateDungeonMap` ;
6. forme finale `{result,map}`.

Aucune API cible n'est figée avant caractérisation.

## Risque architectural

`generateDungeonMap(...)` possède la géométrie et le RNG : il ne doit pas être déplacé dans un helper pur.

La seule responsabilité potentiellement extractible est la décision/planification précédant cet appel, mais elle ne sera sélectionnée qu'après preuve.

Il est interdit :
- de déplacer `generateDungeonMap` ;
- d'ajouter du RNG dans `GensDungeonV1.exploration` ;
- de normaliser `enemyQty` différemment de l'historique ;
- de changer le contrat strict `map===false`.

## Hors périmètre absolu

Ne pas modifier dans l'audit initial :
- encounter / Boss ;
- choix du piège ;
- résultats non-combat ;
- load/save ennemis ;
- mutation dc200Branch ;
- `generateDungeonMap(...)` ;
- géométrie / RNG ;
- Spatial / Room Runtime ;
- branches generated ;
- Boss policy ;
- authored ;
- mouvement ;
- événements/spawn ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets.

## TDD

1. ajouter une caractérisation dédiée de la frontière carte ;
2. raccorder cette caractérisation à Architecture ;
3. obtenir triple CI GREEN ;
4. sélectionner UNE responsabilité pure minimale seulement après preuve ;
5. poser ensuite une sentinelle RED dédiée si une extraction est justifiée ;
6. aucun changement runtime avant RED isolé.

## Rule 26

La caractérisation initiale n'exige aucune modification de `index.html`.

Toute future modification du runtime exige la source exacte correspondant à :
- taille `8169447` ;
- blob `106d2ec6e82f3b777e1d724cd3f74f30a22fdf39`.

Aucun nouveau wrapper, observer, timer, retry ou autorité globale n'est autorisé.


## Caractérisation GREEN de la frontière carte

Test :
`tests/gens_phase7_dungeon_generated_room_map_boundary_characterization_v1.test.cjs`.

SHA de caractérisation validé :
`bfd20658a04905c19dfaef22b8e363a188784fb1`.

Le commit `bfd20658...` est un retry CI à tree strictement identique à `3b4401d8830b86d9f2c73fd13161d8fb140ec31b`, après blocage infrastructure du premier runner Chromium.

CI GREEN :
- Architecture + Browser `36814038088` — SUCCESS ;
- Firefox `36814038058` — SUCCESS ;
- Tactical Dock `36814038050` — SUCCESS ;
- étape dédiée #199 `Caractériser la frontière carte des salles generated Phase 7` — SUCCESS.

La caractérisation confirme exactement :

### Gate carte

- seule la valeur booléenne stricte `false` désactive la carte ;
- `true`, `undefined`, `null`, `0` et `""` conservent le chemin de génération ;
- `cfg().map` reste lu au callsite Core 2.00.

### Quantité transmise

Le chemin actif conserve exactement :
`result.enemyQty || 0`.

Aucune conversion `Number(...)`, aucun clamp et aucune normalisation supplémentaire ne sont autorisés.

### Ordre

L'ordre actuel reste :
1. chargement ennemis ;
2. normalisation dc200Branch ;
3. sauvegarde ennemis ;
4. lecture `cfg().map` ;
5. éventuel `generateDungeonMap(kind,result.enemyQty||0)` ;
6. retour `{result,map:mapObj}`.

### Matérialisation

- un seul callsite `generateDungeonMap(...)` existe dans `createRoom(...)` ;
- `generateDungeonMap(...)` et son RNG restent hors extraction ;
- le retour public reste `{result,map}`.

## Slice pure sélectionnée

API cible :
`GensDungeonV1.exploration.planGeneratedRoomMapBoundary(mapSetting, kind, result)`.

Responsabilité unique :
planifier uniquement la décision de matérialiser une carte generated et les arguments du callsite.

Contrat cible :
- si `mapSetting === false` :
  `{status:"disabled",kind:null,enemyQty:null}` ;
- sinon :
  `{status:"generate",kind,enemyQty:result.enemyQty||0}`.

Cette forme préserve la paresse historique :
- si la carte est désactivée, `result.enemyQty` n'est pas lu ;
- si la carte est active et `result` est invalide, le comportement d'accès historique n'est pas masqué.

Core 2.00 doit conserver :
- l'appel `cfg().map` ;
- l'appel réel `generateDungeonMap(...)` ;
- tout RNG/géométrie ;
- la composition finale `{result,map:mapObj}`.

Le planner pur :
- ne consomme aucun RNG ;
- ne lit aucune config lui-même ;
- n'appelle pas `generateDungeonMap` ;
- ne touche aucun stockage, DOM, Spatial ou autre module.

## Prochaine étape TDD

1. poser UNE garde RED exigeant `planGeneratedRoomMapBoundary(...)` ;
2. exiger un raccord Core 2.00 unique et explicite ;
3. vérifier RED isolé : Architecture échoue uniquement sur cette garde ;
4. Firefox et Tactical Dock doivent rester GREEN ;
5. aucun micro-diff runtime avant ce RED isolé.
