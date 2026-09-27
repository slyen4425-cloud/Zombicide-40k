# GenSrpG — Phase 7 / Dungeon exploration — création/restauration de salle generated — pré-audit — 2026-09-27

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-kind-weighting-green-2026-09-27`

SHA exact de base :
`2fc83900b001a7643cdd21eecd94d048b91192d1`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-create-restore-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-create-restore-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN de la base :
- Architecture + Browser : `36279456713` — SUCCESS ;
- Firefox : `36279456727` — SUCCESS ;
- Tactical Dock : `36279456712` — SUCCESS.

Runtime de base :
- `index.html` : `8170143` octets ;
- blob Git : `23b4f59009c5e51fdb91e9bfe3fd87d2a79bba3d`.

## Position dans la Phase 7

Les deux premières slices generated sont déjà extraites dans `GensDungeonV1.exploration` :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)`
   - retourne `complete`, `existing` ou `create` ;
   - ne modifie aucun état ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)`
   - sélectionne uniquement le type non-Boss ;
   - reçoit le roll explicitement ;
   - ne possède aucun aléatoire.

Le présent micro-lot continue dans le même sous-domaine `exploration / salles`.

## Périmètre strict du micro-lot 3

Cible unique :
**la frontière runtime qui matérialise une avance generated en création d’une nouvelle salle ou restauration d’une salle déjà snapshotée.**

Le lot doit d’abord caractériser exactement ce qui se passe après :
`GensDungeonV1.exploration.planGeneratedAdvance(...)`.

Deux cas doivent rester distincts :

### Cas create
Une salle generated inexistante doit être créée une seule fois puis devenir l’état canonique de ce numéro de salle.

### Cas existing
Une salle déjà présente dans `roomStates[targetRoom]` doit être restaurée/rejointe sans recréer son type, son contenu ou sa géométrie.

## Preuves externes déjà disponibles

### Planner Phase 7
`tests/gens_phase7_dungeon_generated_advance_plan_v1.test.cjs` prouve :
- room suivante absente -> `{status:"create", targetRoom}` ;
- snapshot présent avec `last` -> `{status:"existing", targetRoom}` ;
- limite atteinte -> `complete`.

### DungeonRoomRuntime167822
Le runtime de pièces personnalisées utilise le marqueur spatial :
`dc313LastTransition.created`.

Il applique une pièce personnalisée uniquement quand :
`created === true`.

Le test permanent `tests/dungeon_room_runtime_v167822.test.cjs` protège explicitement que :
- une nouvelle salle peut recevoir une géométrie personnalisée ;
- son `kind` généré est conservé ;
- les ennemis existants sont remappés, pas recréés par ce runtime ;
- le snapshot spatial est persisté ;
- rejoindre/rendre une salle existante ne remplace pas de nouveau sa géométrie.

Cette sémantique est un invariant du présent micro-lot.

## Autorités à protéger

- `GensDungeonV1.exploration.planGeneratedAdvance` reste propriétaire du choix pur create/existing/complete.
- `GensDungeonV1.exploration.pickWeightedGeneratedRoomKind` reste propriétaire de la pondération generated non-Boss.
- la politique Boss reste dans Core 2.00 pour ce lot.
- `DungeonRoomRuntime167822` reste propriétaire de l’application optionnelle de géométrie Room Creator sur une transition nouvellement créée.
- `DungeonSpatial313` reste propriétaire de ses snapshots/positions tant qu’aucun audit séparé ne prouve un déplacement sûr.
- Authored World Builder reste séparé et inchangé.
- Tactical ne reçoit aucune autorité de salle/exploration.

## Hors périmètre absolu

Ne pas modifier dans ce lot :
- mouvement case par case ;
- allowance / fin de tour ;
- événements / spawn ;
- composition des rencontres ;
- coffres / pièges / énigmes ;
- marchands / repos ;
- branches secondaires ;
- politique Boss ;
- Room Creator / World Builder ;
- `DungeonRoomRuntime167822` ;
- `DungeonSpatial313` ;
- persistance générale Dungeon ;
- déclenchement/résolution combat ;
- Tactical ;
- Survie ;
- Capture ;
- PvP ;
- assets.

## Invariants fonctionnels

Le raccord futur devra prouver simultanément que :

1. une salle nouvelle est matérialisée exactement une fois ;
2. une salle existante n’est pas régénérée ;
3. son `kind` ne change pas lors d’un retour ;
4. son snapshot `last` reste la source restaurée ;
5. les ennemis/positions déjà snapshotés ne sont pas perdus ;
6. `dc313LastTransition.created` reste cohérent avec create/existing ;
7. `DungeonRoomRuntime167822` continue à ne s’appliquer qu’au cas créé ;
8. authored reste hors de cette chaîne generated ;
9. aucune responsabilité Tactical n’est importée ;
10. aucune nouvelle globale, wrapper, polling, retry ou observer n’est ajouté.

## Question d’architecture à résoudre avant RED

Le corps exact de Core 2.00 doit être caractérisé pour déterminer :
- où le statut `create/existing` est consommé ;
- quelles mutations sont effectuées lors de la création ;
- quelles données sont recopiées lors d’une restauration ;
- où est posé `dc313LastTransition.created` ;
- quelles parties peuvent devenir une prochaine API Dungeon pure sans déplacer simultanément spawn, spatial ou persistance.

Aucune API cible n’est figée avant cette caractérisation exacte.

## Plan TDD

1. appliquer Rule 26 et obtenir le `index.html` exact du SHA de départ ;
2. caractériser statiquement le chemin Core 2.00 create/existing ;
3. ajouter une caractérisation déterministe/VM de la parité création-restauration ;
4. raccorder cette caractérisation à Architecture et obtenir GREEN ;
5. sélectionner UNE responsabilité pure et homogène à extraire ;
6. écrire une sentinelle RED dédiée ;
7. prouver que seule cette nouvelle sentinelle devient RED ;
8. appliquer un micro-diff minimal ;
9. réaligner uniquement les fingerprints réellement invalidés, un garde à la fois ;
10. CI Architecture + Browser, Firefox, Tactical Dock ;
11. preview utilisateur uniquement si le comportement visible change ;
12. checkpoint GREEN final avant tout micro-lot suivant.

## Rule 26

Le présent pré-audit a été établi à partir des propriétaires externes, contrats et tests permanents.

La prochaine étape exige désormais l’inspection exacte du propriétaire natif Core 2.00 dans `index.html`.

Il est donc interdit de reconstruire ce chemin depuis une ancienne copie ou de multiplier les lectures du gros fichier par le connecteur.

Le fichier demandé doit correspondre exactement au SHA :
`2fc83900b001a7643cdd21eecd94d048b91192d1`.

Empreinte attendue :
- taille : `8170143` octets ;
- blob : `23b4f59009c5e51fdb91e9bfe3fd87d2a79bba3d`.

Aucun runtime ne sera modifié avant réception et vérification de cette source exacte.


## Rule 26 — source exacte reçue et vérifiée

Sylvain a fourni `work35.zip`.

Contenu vérifié :
- fichier : `index35.txt` ;
- taille : `8170143` octets ;
- blob Git : `23b4f59009c5e51fdb91e9bfe3fd87d2a79bba3d` ;
- correspond exactement au `index.html` du checkpoint GREEN de base `2fc83900b001a7643cdd21eecd94d048b91192d1`.

Cette source est désormais l’unique source Rule 26 autorisée pour le raccord de ce micro-lot tant que le runtime `index.html` n’a pas changé.

## Caractérisation exacte create / existing

Test :
`tests/gens_phase7_dungeon_generated_room_create_restore_characterization_v1.test.cjs`.

SHA caractérisé :
`d9e9f4658ed8012c43492248587fcd495237af58`.

CI :
- Architecture + Browser : `36292666711` — SUCCESS ;
- Firefox : `36292666748` — SUCCESS ;
- Tactical Dock : `36292666751` — SUCCESS.

Architecture :
- #181 autorité exploration : SUCCESS ;
- #182 plan d’avance generated : SUCCESS ;
- #183 pondération generated caractérisée : SUCCESS ;
- #184 propriétaire pondération : SUCCESS ;
- #185 création/restauration generated : SUCCESS.

La source exacte prouve :

### existing
Après `planGeneratedAdvance(...)`, si `status==='existing'` et que le snapshot possède `last` :
- `spatialSetRoom(x, heroId, targetRoom)` ;
- `spatialActivate(x, heroId)` ;
- `DungeonSpatial313.activate()` restaure `last` et `enemyCells` depuis `roomStates[targetRoom]` par clone ;
- le héros actif est replacé sur l’entrée ;
- son mouvement restant est conservé ;
- `dc313LastTransition.created=false` ;
- aucun `chooseKind`, `createRoom`, `placeSceneForRoom`, spawn, lock ou challenge n’est rejoué.

### create
Si la salle n’existe pas :
- `x.room=targetRoom`, `enemyCells={}`, `branch=null` ;
- `spatialSetRoom(...)` ;
- `chooseKind()` puis `createRoom()` exactement une fois ;
- construction de `x.last` ;
- position d’entrée + mouvement restant ;
- `dc313LastTransition.created=true` ;
- sauvegarde initiale ;
- seulement ensuite scène / repos / branche spéciale / assignation ennemis / lock / challenge ;
- nouvelle sauvegarde puis render/intro.

### Spatial
`DungeonSpatial313.persist()` snapshotte exactement :
- `last` ;
- `enemyCells`.

`DungeonSpatial313.activate()` restaure exactement ces deux données et les clone.
Cette autorité Spatial ne doit pas être déplacée dans le présent lot.

### Room Runtime
`DungeonRoomRuntime167822` consomme `dc313LastTransition.created===true`.
Son test permanent protège que rejoindre une salle existante ne régénère pas de layout custom.

## Slice pure sélectionnée après caractérisation

API cible :
`GensDungeonV1.exploration.buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)`.

Responsabilité unique :
construire le descripteur de transition generated actuellement dupliqué inline dans les deux branches Core 2.00 :

`{heroId, from, to, created, at}`.

Sémantique :
- existing -> `created:false` ;
- create -> `created:true` ;
- `Date.now()` reste au callsite Core 2.00 et est passé explicitement ;
- aucun accès Spatial ;
- aucune mutation de runtime ;
- aucun DOM / stockage / timer / observer / listener ;
- aucun aléatoire ;
- aucune dépendance Tactical / Capture / Survie / PvP.

Pourquoi cette slice :
- elle est commune aux deux branches create/existing ;
- elle formalise exactement la frontière caractérisée ;
- elle est consommée par `DungeonRoomRuntime167822` sans déplacer son autorité ;
- elle ne déplace ni restauration Spatial, ni création de contenu, ni spawn ;
- elle constitue un micro-lot homogène et réversible.

## Prochaine étape TDD

1. ajouter une sentinelle RED exigeant `buildGeneratedRoomTransition` ;
2. exiger exactement deux consommateurs Core 2.00 : `created:false` et `created:true` ;
3. interdire les deux constructions inline historiques ;
4. vérifier que la nouvelle garde est la seule dette Phase 7 rouge ;
5. seulement après RED isolé, ajouter l’API pure, mettre à jour le contrat et raccorder les deux callsites via la source Rule 26 vérifiée.


## RED isolé — prouvé

SHA RED :
`8e8474e059344ecf43af2e376950401c235a553d`.

CI :
- Architecture : `36293318726` — FAILURE attendue ;
- Firefox : `36293318749` — SUCCESS ;
- Tactical Dock : `36293318721` — SUCCESS.

Architecture Phase 7 :
- #181 autorité exploration : SUCCESS ;
- #182 plan d’avance generated : SUCCESS ;
- #183 pondération generated caractérisée : SUCCESS ;
- #184 propriétaire pondération : SUCCESS ;
- #185 création/restauration generated : SUCCESS ;
- #186 `Exiger le descripteur de transition des salles generated Phase 7` : FAILURE attendue.

Erreur exacte :
`Phase 7 micro-lot 3 requires Dungeon-owned generated room transition descriptors`.

État observé :
- attendu : `function` ;
- réel : `undefined`.

Le RED est donc isolé à l’absence de la nouvelle API pure.
Aucune régression du runtime n’est impliquée.
