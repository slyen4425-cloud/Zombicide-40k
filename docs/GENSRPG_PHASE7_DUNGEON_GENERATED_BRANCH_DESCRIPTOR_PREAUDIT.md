# GenSrpG — Phase 7 / Dungeon exploration — descripteur de branche generated — pré-audit — 2026-09-27

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-chance-gate-green-2026-09-27`

SHA exact de base :
`0e2d97f1230ab75c76945faf4798d8cfcb344de6`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-branch-descriptor-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-branch-descriptor-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36345989113` — SUCCESS ;
- Firefox : `36345989224` — SUCCESS ;
- Tactical Dock : `36345989189` — SUCCESS.

Runtime de base :
- `index.html` : `8170090` octets ;
- blob Git : `85bf8dcb0ad22d596e648f4992210d870520d6f9`.

## Position dans la Phase 7

Les slices generated déjà propriétaires Dungeon dans `GensDungeonV1.exploration` sont :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)` ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)` ;
3. `buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)` ;
4. `pickWeightedGeneratedBranchType(branchWeights, roll)` ;
5. `shouldCreateGeneratedBranch(specialBranchChance, roll)`.

Le callsite `maybeSpecialBranch(x)` conserve encore :
- `nearestFree(x)` ;
- la construction du descripteur de trappe ;
- `addDungeonSceneElement(...)` ;
- la mutation `m.cells[i]='trapdoor'`.

## Cible stricte du micro-lot 6

Isoler uniquement la construction pure du descripteur de scène de la branche generated.

API cible proposée après caractérisation GREEN :
`GensDungeonV1.exploration.buildGeneratedBranchSceneElement(room, cellIndex, branchType)`

Forme historique à préserver :
- `kind: 'trapdoor'` ;
- `name` :
  - `boss -> 'Trappe inquiétante'` ;
  - `secret -> 'Passage secret'` ;
  - défaut/treasure -> `'Cache souterraine'` ;
- `room` explicite ;
- `cellIndex` explicite ;
- `environment: 'dungeon'` ;
- `branchType` explicite.

Responsabilité unique :
retourner ce plain object, sans side effect.

## Hors périmètre absolu

Ne pas déplacer/modifier :
- `nearestFree(x)` ;
- les deux `Math.random()` ;
- `shouldCreateGeneratedBranch(...)` ;
- `pickWeightedGeneratedBranchType(...)` ;
- `addDungeonSceneElement(...)` ;
- `m.cells[i]='trapdoor'` ;
- ordre de matérialisation scène -> mutation map ;
- événements/spawn/ennemis ;
- mouvement / Spatial / RoomRuntime ;
- authored World Builder et branches authored ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- Survie / Capture / PvP ;
- assets.

## Invariants

- map absente : zéro RNG et aucune matérialisation ;
- rejet de chance : un RNG, arrêt avant `nearestFree` ;
- aucune case libre : un RNG, arrêt avant RNG de type ;
- acceptation : exactement deux RNG ;
- `nearestFree` reste avant le RNG de type ;
- le descripteur est construit après sélection du type ;
- `addDungeonSceneElement` reste le propriétaire de la création de scène ;
- `m.cells[i]='trapdoor'` reste après la création de scène ;
- le retour de `maybeSpecialBranch` reste le résultat de `addDungeonSceneElement` ;
- authored reste séparé ;
- aucune nouvelle globale / wrapper / retry / polling / observer.

## Rule 26

La source exacte courante a été re-vérifiée localement :
- taille : `8170090` octets ;
- blob : `85bf8dcb0ad22d596e648f4992210d870520d6f9`.

Elle correspond exactement au runtime du checkpoint de base.

Aucune modification runtime ne sera faite avant :
1. caractérisation GREEN dédiée ;
2. RED isolé ;
3. preuve que seule la nouvelle garde est rouge.

Si une nouvelle source exacte devient nécessaire après changement de runtime, Rule 26 s'applique de nouveau.

## TDD prévu

1. ajouter une caractérisation GREEN du descripteur historique ;
2. raccorder cette caractérisation à Architecture ;
3. vérifier Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. ajouter UNE garde RED exigeant l'API pure et son consommateur unique ;
5. prouver le RED isolé ;
6. appliquer le micro-diff minimal ;
7. réaligner les fingerprints un par un si nécessaire ;
8. triple CI ;
9. aucun test utilisateur si le comportement reste strictement neutre ;
10. fermeture documentaire + checkpoint GREEN final.
