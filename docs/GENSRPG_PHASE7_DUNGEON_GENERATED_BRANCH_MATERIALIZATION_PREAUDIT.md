# GenSrpG — Phase 7 / Dungeon exploration — matérialisation de branche generated — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-descriptor-green-2026-09-28`

SHA exact de base :
`cdc939b810edf918f6eeee537da9b5d5488a5ac8`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-branch-materialization-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-generated-branch-materialization-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser Chromium : `36406319373` — SUCCESS ;
- Firefox : `36406319514` — SUCCESS ;
- Tactical Dock : `36406319414` — SUCCESS.

Runtime de base :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les slices generated déjà propriétaires Dungeon dans `GensDungeonV1.exploration` sont :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)` ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)` ;
3. `buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)` ;
4. `pickWeightedGeneratedBranchType(branchWeights, roll)` ;
5. `shouldCreateGeneratedBranch(specialBranchChance, roll)` ;
6. `buildGeneratedBranchSceneElement(room, cellIndex, branchType)`.

Le callsite `maybeSpecialBranch(x)` conserve encore la matérialisation réelle :
- `nearestFree(x)` ;
- sélection du type via le propriétaire Dungeon ;
- construction du descripteur via le propriétaire Dungeon ;
- `addDungeonSceneElement(...)` ;
- `m.cells[i]='trapdoor'` ;
- retour de la valeur renvoyée par `addDungeonSceneElement(...)`.

## Question d'architecture du micro-lot 7

Peut-on isoler une frontière de matérialisation Dungeon sans déplacer prématurément :
- la recherche `nearestFree(x)` ;
- les deux RNG ;
- la sélection de type ;
- le propriétaire réel `addDungeonSceneElement(...)` ;
- ni modifier l'ordre exact des side effects ?

Aucune API cible n'est figée avant caractérisation GREEN et Rule 26.

## Périmètre strict

Caractériser uniquement la séquence :
`descriptor -> addDungeonSceneElement -> map cell 'trapdoor' -> return`.

Le micro-lot ne doit pas décider à l'avance qu'il faut déplacer `addDungeonSceneElement` lui-même.

## Hors périmètre absolu

Ne pas déplacer/modifier :
- `nearestFree(x)` ;
- les deux `Math.random()` ;
- `shouldCreateGeneratedBranch(...)` ;
- `pickWeightedGeneratedBranchType(...)` ;
- `buildGeneratedBranchSceneElement(...)` ;
- implémentation interne de `addDungeonSceneElement(...)` ;
- événements/spawn/ennemis ;
- mouvement / Spatial / RoomRuntime ;
- authored World Builder et branches authored ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- Survie / Capture / PvP ;
- assets.

## Invariants à caractériser

- une branche acceptée consomme toujours exactement deux RNG avant matérialisation ;
- `nearestFree` reste avant le RNG de type ;
- le descripteur pur est construit après la sélection du type ;
- `addDungeonSceneElement(...)` reçoit exactement ce descripteur ;
- la case map reste dans son état précédent pendant l'appel de `addDungeonSceneElement(...)` ;
- la mutation `m.cells[i]='trapdoor'` arrive seulement après le retour de `addDungeonSceneElement(...)` ;
- le retour de `maybeSpecialBranch` est exactement la valeur de matérialisation ;
- si `addDungeonSceneElement` est absent, l'optional chaining historique est conservé et la mutation map a toujours lieu ;
- si `addDungeonSceneElement` lève une erreur, l'erreur se propage et la mutation map ne doit pas avoir eu lieu ;
- authored reste séparé ;
- aucune nouvelle globale / wrapper / retry / polling / observer.

## Rule 26

Le pré-audit et la caractérisation peuvent s'appuyer sur les gardes GREEN du checkpoint de base sans relire le gros `index.html`.

Avant toute inspection supplémentaire de la définition exacte ou toute modification de `index.html`, Rule 26 est obligatoire sur le HEAD courant :
1. résoudre le SHA ;
2. vérifier taille + blob attendus ;
3. fournir le permalink exact ;
4. recevoir le ZIP/TXT exact ;
5. vérifier localement la correspondance ;
6. seulement ensuite écrire un RED de raccord ou un micro-diff runtime.

La copie `work39.zip` correspond au runtime précédent de `8170090` octets et ne doit pas être réutilisée comme source du runtime courant.

## TDD prévu

1. ajouter une caractérisation GREEN dédiée de la matérialisation ;
2. raccorder cette caractérisation à Architecture ;
3. vérifier Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. appliquer Rule 26 sur le runtime courant ;
5. seulement après preuve et inspection exacte, définir UNE frontière RED minimale si une extraction sûre existe ;
6. micro-diff minimal ;
7. réaligner les fingerprints un garde à la fois si nécessaire ;
8. triple CI ;
9. test utilisateur seulement si comportement visible ;
10. fermeture documentaire + checkpoint GREEN.
