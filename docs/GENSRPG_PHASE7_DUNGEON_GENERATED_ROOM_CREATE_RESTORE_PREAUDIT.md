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
