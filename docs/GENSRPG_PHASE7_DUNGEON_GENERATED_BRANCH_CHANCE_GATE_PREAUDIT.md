# GenSrpG — Phase 7 / Dungeon exploration — gate de présence des branches generated — pré-audit — 2026-09-27

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27`

SHA exact de base :
`49289784ee92a47fd51089815ca25954cdba4493`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-branch-chance-gate-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-branch-chance-gate-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN de la base :
- Architecture + Browser : `36324103034` — SUCCESS ;
- Browser sentinel du même run — SUCCESS ;
- Firefox : `36324103113` — SUCCESS ;
- Tactical Dock : `36324103013` — SUCCESS.

Runtime de base :
- `index.html` : `8170062` octets ;
- blob Git : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

## Position dans la Phase 7

Les slices generated déjà propriétaires Dungeon dans `GensDungeonV1.exploration` sont :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)` ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)` ;
3. `buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)` ;
4. `pickWeightedGeneratedBranchType(branchWeights, roll)`.

Le micro-lot précédent a prouvé et conservé l'ordre exact de `maybeSpecialBranch(x)` :
1. map valide ;
2. lecture config ;
3. premier RNG de présence ;
4. comparaison à `specialBranchChance` ;
5. `nearestFree(x)` ;
6. second RNG de type ;
7. sélection pondérée via `pickWeightedGeneratedBranchType` ;
8. `addDungeonSceneElement(...)` ;
9. mutation `m.cells[i]='trapdoor'`.

## Cible stricte du micro-lot 5

Isoler uniquement la décision pure :
**un roll de présence autorise-t-il la tentative de branche generated selon `specialBranchChance` ?**

API cible proposée après caractérisation GREEN :
`GensDungeonV1.exploration.shouldCreateGeneratedBranch(specialBranchChance, roll)`

Responsabilité unique :
- normaliser la chance exactement comme aujourd'hui ;
- comparer `Number(roll)*100` au seuil ;
- retourner un booléen.

L'API ne génère aucun RNG elle-même.

## Hors périmètre absolu

Ne pas déplacer/modifier :
- `nearestFree(x)` ;
- le second `Math.random()` de type ;
- `pickWeightedGeneratedBranchType(...)` ;
- `addDungeonSceneElement(...)` ;
- les libellés treasure/boss/secret ;
- `m.cells[i]='trapdoor'` ;
- assignation ennemis / événements / spawn ;
- mouvement / Spatial / RoomRuntime ;
- authored World Builder et branches authored ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- Survie / Capture / PvP ;
- assets.

## Invariants

- une map absente ne consomme aucun RNG ;
- le premier RNG reste au callsite historique ;
- un rejet de chance consomme exactement un RNG et s'arrête avant `nearestFree` ;
- un succès de chance poursuit vers `nearestFree` sans consommer encore le RNG de type ;
- seuil exact : un roll tel que `roll*100 >= chance` est rejeté ;
- chance négative/invalides reste normalisée par `Math.max(0, Number(value)||0)` ;
- authored reste séparé ;
- aucun DOM / stockage / timer / observer / listener / Tactical dans l'API pure ;
- aucun wrapper, retry, polling ou nouvelle globale.

## TDD

1. ajouter une caractérisation dédiée GREEN du gate de présence ;
2. raccorder cette caractérisation à Architecture ;
3. vérifier Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. ajouter ensuite UNE sentinelle RED exigeant l'API pure et son consommateur unique ;
5. prouver que seule cette garde devient RED ;
6. seulement ensuite modifier le runtime exact ;
7. réaligner les fingerprints historiques un par un ;
8. triple CI ;
9. aucun test utilisateur si le comportement reste strictement neutre ;
10. checkpoint GREEN final.

## Rule 26

Le runtime exact ne doit pas être relu/modifié via le connecteur GitHub.

Dès le passage du RED au micro-diff runtime, utiliser exactement le fichier :
- SHA : `49289784ee92a47fd51089815ca25954cdba4493`
- permalink : `https://github.com/slyen4425-cloud/Zombicide-40k/blob/49289784ee92a47fd51089815ca25954cdba4493/index.html`
- taille attendue : `8170062`
- blob attendu : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

Aucune ancienne copie Rule 26 ne doit être utilisée sans vérification.
