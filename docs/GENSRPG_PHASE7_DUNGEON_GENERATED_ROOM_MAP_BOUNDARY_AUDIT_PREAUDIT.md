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
