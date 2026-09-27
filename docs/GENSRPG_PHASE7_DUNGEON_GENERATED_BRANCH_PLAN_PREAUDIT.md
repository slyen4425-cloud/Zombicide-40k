# GenSrpG — Phase 7 / Dungeon exploration — planification des branches generated — pré-audit — 2026-09-27

## Base sûre

Micro-lot 3 fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-create-restore-green-2026-09-27`

SHA exact de base :
`9ec3a39af709405f5d9ee54a61aa2c041c7339e6`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-branch-plan-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-branch-plan-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN de la base :
- Architecture + Browser : `36304220091` — SUCCESS ;
- Firefox : `36304220130` — SUCCESS ;
- Tactical Dock : `36304220131` — SUCCESS.

Runtime de base :
- `index.html` : `8170213` octets ;
- blob Git : `efcc459c9bade0e35bf123d100e499b3ce7d4eca`.

## Position dans la Phase 7

Les slices generated déjà propriétaires Dungeon dans `GensDungeonV1.exploration` sont :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)`
   - décide `complete / existing / create` ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)`
   - choisit le type non-Boss à partir d'un roll explicite ;
3. `buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)`
   - construit le descripteur pur `{heroId,from,to,created,at}`.

La caractérisation GREEN du micro-lot 3 a aussi verrouillé l'ordre de création d'une nouvelle salle :

- création de la salle et de `x.last` ;
- descripteur de transition `created:true` ;
- sauvegarde initiale ;
- scène ;
- repos éventuel ;
- `maybeSpecialBranch(x)` ;
- assignation des ennemis ;
- lock ;
- challenge de porte ;
- sauvegarde/render/intro.

Le présent micro-lot reste donc dans `Dungeon exploration / salles / branches` et s'arrête avant les événements/spawns.

## Cible stricte du micro-lot 4

**Caractériser puis isoler, si une frontière pure est prouvée, la décision/planification d'une branche secondaire dans l'adventure generated.**

Le propriétaire natif à auditer est le chemin autour de :
`maybeSpecialBranch(x)`.

Aucune API cible n'est présumée avant inspection exacte.

Le lot doit déterminer notamment :
- quelles règles rendent une branche possible ;
- si la décision dépend du numéro/type de salle, de règles configurables, d'un roll ou d'un état déjà présent ;
- quelles données décrivent une branche sans la matérialiser ;
- quelles mutations restent obligatoirement au callsite ;
- si une partie homogène peut devenir une fonction pure Dungeon sans déplacer contenu, spatial ou navigation.

## Séparation authored obligatoire

Les branches authored World Builder restent hors de ce lot.

### DungeonSecondaryBranchContentFix167860

Ce runtime :
- ne traite que les branches secondaires authored ;
- expose un nœud virtuel pendant l'application du contenu exact ;
- protège dimensions réelles, coffres exacts et métadonnées ;
- ne doit jamais devenir le propriétaire d'une branche generated.

### DungeonAuthoredBranchNavCleanup167863

Ce runtime :
- ne traite que la navigation authored ;
- masque les anciens contrôles numériques dans les mondes authored ;
- protège le bouton de retour dédié des branches/cache authored ;
- ne doit pas être modifié par le présent lot.

Ainsi :
**generated branch planning et authored branch runtime restent deux chaînes distinctes.**

## Autorités à protéger

- `GensDungeonV1.exploration.planGeneratedAdvance` : avance generated ;
- `GensDungeonV1.exploration.pickWeightedGeneratedRoomKind` : pondération de type de salle ;
- `GensDungeonV1.exploration.buildGeneratedRoomTransition` : descripteur de transition ;
- Core 2.00 : mutations de runtime tant qu'aucune extraction séparée n'est prouvée ;
- `DungeonSpatial313` : état spatial / snapshots ;
- `DungeonRoomRuntime167822` : géométrie Room Creator pour une nouvelle salle ;
- `DungeonSecondaryBranchContentFix167860` : contenu exact des branches authored ;
- `DungeonAuthoredBranchNavCleanup167863` : navigation des branches authored ;
- Dungeon décide toujours du monde et du déclenchement éventuel de Tactical.

## Hors périmètre absolu

Ne pas modifier dans ce lot :
- authored World Builder / graphes authored ;
- contenu exact des branches authored ;
- navigation retour authored ;
- mouvement case par case ;
- movement allowance / fin de tour ;
- événements / spawn ;
- assignation des ennemis ;
- coffres / pièges / énigmes ;
- marchands / repos ;
- politique Boss ;
- Room Creator ;
- `DungeonRoomRuntime167822` ;
- `DungeonSpatial313` ;
- persistance générale ;
- déclenchement/résolution combat ;
- Tactical ;
- Survie ;
- Capture ;
- PvP ;
- assets.

## Invariants

Le futur raccord, s'il existe, devra prouver que :

1. aucune branche n'est ajoutée à une salle qui n'en avait pas historiquement ;
2. une branche existante n'est pas dupliquée ;
3. les probabilités/conditions restent strictement identiques ;
4. le nombre et l'ordre des tirages aléatoires restent identiques ;
5. les mutations `x.branch` restent au même moment du pipeline ;
6. les spawns/ennemis ne sont pas déplacés dans l'API pure ;
7. authored reste totalement séparé ;
8. RoomRuntime et Spatial restent inchangés ;
9. aucun code Tactical n'entre dans la planification de branche ;
10. aucune nouvelle globale, wrapper, retry, polling, timer ou observer n'est ajouté.

## Plan TDD

1. appliquer Rule 26 au runtime exact du checkpoint GREEN ;
2. inspecter la définition native exacte de `maybeSpecialBranch(x)` et ses helpers immédiats ;
3. caractériser statiquement sa chaîne de décision et ses mutations ;
4. si nécessaire, ajouter une caractérisation déterministe/VM avec RNG injecté uniquement dans le test ;
5. raccorder la caractérisation à Architecture et obtenir GREEN ;
6. sélectionner UNE responsabilité pure homogène ;
7. écrire une sentinelle RED isolée ;
8. prouver que seule cette dette devient RED ;
9. appliquer un micro-diff minimal ;
10. réaligner les fingerprints historiques un garde à la fois ;
11. CI Architecture + Browser, Firefox, Tactical Dock ;
12. preview utilisateur uniquement si un comportement visible change ;
13. checkpoint GREEN avant tout micro-lot suivant.

## Rule 26

Le propriétaire generated de branche est natif dans `index.html`.
La prochaine étape exige donc une inspection exacte du fichier courant.

SHA requis :
`9ec3a39af709405f5d9ee54a61aa2c041c7339e6`.

Permalink :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/9ec3a39af709405f5d9ee54a61aa2c041c7339e6/index.html`

Empreinte attendue :
- taille : `8170213` octets ;
- blob Git : `efcc459c9bade0e35bf123d100e499b3ce7d4eca`.

La source Rule 26 précédente `work35.zip / index35.txt` est désormais obsolète pour une inspection exacte :
elle correspond au blob `23b4f590...` antérieur au micro-lot 3.

Aucun runtime du micro-lot 4 ne sera modifié avant réception et vérification de la source exacte ci-dessus.


## Rule 26 — source exacte reçue et vérifiée

Sylvain a fourni `work36.zip`.

Contenu vérifié :
- fichier : `index36.txt` ;
- taille : `8170213` octets ;
- blob Git : `efcc459c9bade0e35bf123d100e499b3ce7d4eca` ;
- correspond exactement au runtime du checkpoint GREEN `9ec3a39af709405f5d9ee54a61aa2c041c7339e6`.

Cette source devient la source Rule 26 autorisée pour le présent micro-lot tant que `index.html` ne change pas.

## Caractérisation GREEN de `maybeSpecialBranch(x)`

Test :
`tests/gens_phase7_dungeon_generated_branch_plan_characterization_v1.test.cjs`.

SHA caractérisé :
`c3654bdfbd0674968b321b9a7b440f8772d1db94`.

CI :
- Architecture + Browser : run `36307407149` — SUCCESS ;
- Firefox : run `36307407138` — SUCCESS ;
- Tactical Dock : run `36307407144` — SUCCESS.

La source exacte prouve :

1. une salle existing ne rappelle jamais `maybeSpecialBranch(x)` ;
2. une salle newly created l'appelle exactement une fois ;
3. sans map valide, aucun tirage aléatoire n'est consommé ;
4. le test de présence consomme un premier `Math.random()` et compare `roll*100` à `specialBranchChance` ;
5. si ce test échoue, `nearestFree(x)` et le tirage de type ne sont pas exécutés ;
6. si aucune case libre n'existe, aucun second tirage n'est consommé ;
7. seulement après succès du test de présence ET existence d'une case libre, un second `Math.random()` choisit le type ;
8. pondération historique :
   - treasure : 45 ;
   - boss : 25 ;
   - secret : 30 ;
   - surchargée par `specialBranchWeights` ;
9. les poids sont normalisés par `Math.max(0, Number(value)||0)` ;
10. la matérialisation reste ensuite impérative :
   - `addDungeonSceneElement(...)` ;
   - `m.cells[i]='trapdoor'`.

Les runtimes authored :
- `DungeonAuthoredRuntime167839` ;
- `DungeonSecondaryBranchContentFix167860` ;
- `DungeonAuthoredBranchNavCleanup167863`
restent hors de cette chaîne generated.

## Slice pure sélectionnée

API cible :

`GensDungeonV1.exploration.pickWeightedGeneratedBranchType(branchWeights, roll)`

Responsabilité UNIQUE :
sélectionner le type de branche generated à partir des poids et d'un roll explicite.

La fonction doit conserver exactement :
- défauts `{treasure:45,boss:25,secret:30}` ;
- surcharge par `branchWeights` ;
- clamp des poids négatifs/invalides à 0 ;
- somme `|| 1` ;
- ordre `Object.entries` historique ;
- fallback `"treasure"`.

Restent impérativement dans Core 2.00 :
- le premier `Math.random()` de présence ;
- `specialBranchChance` ;
- `nearestFree(x)` ;
- le second `Math.random()`, passé explicitement à l'API seulement après case libre ;
- `addDungeonSceneElement` ;
- le libellé du passage ;
- `m.cells[i]='trapdoor'`.

Ce découpage est retenu précisément pour ne pas avancer le second tirage aléatoire avant `nearestFree(x)` et ne pas changer la séquence RNG historique.

## Prochaine étape TDD

1. ajouter une sentinelle RED exigeant `pickWeightedGeneratedBranchType(branchWeights, roll)` ;
2. exiger un seul consommateur dans `maybeSpecialBranch(x)` ;
3. exiger que les deux `Math.random()` restent au callsite et dans le même ordre conditionnel ;
4. interdire l'ancien calcul pondéré inline ;
5. exiger que la matérialisation reste dans Core 2.00 ;
6. prouver que seule cette nouvelle garde devient RED ;
7. seulement ensuite appliquer le micro-diff minimal.


## RED isolé — prouvé

SHA RED :
`aaf2edbf7d7c8db6991ee951a3d4a6c397284c88`.

CI :
- Architecture : run `36308105216` — FAILURE attendue ;
- Firefox : run `36308105234` — SUCCESS ;
- Tactical Dock : run `36308105230` — SUCCESS.

La nouvelle garde Phase 7 :
- #188 `Exiger la pondération Dungeon des types de branches generated Phase 7`

est la seule garde Phase 7 rouge.

Erreur attendue :
`Phase 7 micro-lot 4 requires Dungeon-owned weighted generated branch-type selection`.

La dette est donc isolée à l'absence de :
`GensDungeonV1.exploration.pickWeightedGeneratedBranchType(branchWeights, roll)`.

## Candidat runtime appliqué

One-shot final :
- run `36308661330` — SUCCESS ;
- workflow temporaire auto-supprimé dans le commit runtime.

SHA runtime candidat :
`eae6760f1f86270042d3bd2ffa542f994995d946`.

Source Rule 26 vérifiée avant patch :
- taille : `8170213` ;
- blob : `efcc459c9bade0e35bf123d100e499b3ce7d4eca`.

Cible vérifiée après patch :
- taille : `8170062` ;
- blob : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

Micro-diff runtime :
- ajout de l'API pure `pickWeightedGeneratedBranchType(branchWeights, roll)` dans `GensDungeonV1.exploration` ;
- retrait du calcul pondéré inline de `maybeSpecialBranch(x)` ;
- premier `Math.random()` de présence inchangé ;
- `nearestFree(x)` inchangé et toujours avant le second tirage ;
- second `Math.random()` inchangé au callsite, passé explicitement à l'API ;
- `addDungeonSceneElement(...)`, libellés et `m.cells[i]='trapdoor'` restent dans Core 2.00 ;
- authored, Spatial, RoomRuntime, spawn, Tactical, Survie, Capture et PvP inchangés.

Tests ciblés exécutés par le one-shot :
- avance generated : SUCCESS ;
- transition generated : SUCCESS ;
- nouvelle garde propriétaire type de branche : SUCCESS ;
- RoomRuntime V167822 : SUCCESS ;
- `git diff --check` : SUCCESS.

La CI complète doit maintenant cartographier les éventuels fingerprints historiques invalidés avant toute déclaration GREEN.
