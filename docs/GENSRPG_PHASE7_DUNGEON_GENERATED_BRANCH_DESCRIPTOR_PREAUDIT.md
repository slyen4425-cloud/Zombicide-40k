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

## RED isolé — prouvé

SHA RED :
`008701730efaf438a995e4c0026626947cda607c`.

CI :
- Architecture : `36360543411` — FAILURE attendue ;
- Browser : SKIPPED uniquement car Architecture est rouge ;
- Firefox : `36360543499` — SUCCESS ;
- Tactical Dock : `36360543487` — SUCCESS.

La caractérisation du descripteur historique reste GREEN.
La seule nouvelle garde rouge est :
`#192 — Exiger le descripteur Dungeon des branches generated Phase 7`.

Erreur attendue :
`Phase 7 micro-lot 6 requires Dungeon-owned generated branch scene descriptor builder`.

Aucun runtime n'a encore été modifié.

## Étape suivante — Rule 26

Le passage RED -> micro-diff nécessite maintenant la source exacte courante de `index.html` correspondant au SHA :
`008701730efaf438a995e4c0026626947cda607c`.

Le runtime attendu est toujours :
- taille : `8170090` octets ;
- blob : `85bf8dcb0ad22d596e648f4992210d870520d6f9`.

Avant toute modification de `index.html` :
1. récupérer le fichier exact via le permalink du SHA RED ;
2. recevoir le ZIP/TXT ;
3. vérifier localement taille + blob ;
4. seulement ensuite appliquer le micro-diff du descripteur.

## Candidat runtime appliqué

Source Rule 26 vérifiée :
- `work39.zip / indexwok39.txt` ;
- taille source : `8170090` octets ;
- blob source : `85bf8dcb0ad22d596e648f4992210d870520d6f9`.

SHA runtime :
`d86115d35e06d94d0881f08d8a915d7784237628`.

Runtime cible :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Micro-diff :
- ajout de `GensDungeonV1.exploration.buildGeneratedBranchSceneElement(room, cellIndex, branchType)` ;
- le builder retourne uniquement le plain object historique de trappe generated ;
- `nearestFree(x)`, les deux RNG, `addDungeonSceneElement(...)`, `m.cells[i]='trapdoor'` et le retour de matérialisation restent dans Core 2.00 ;
- authored, Spatial, RoomRuntime, événements/spawn, ennemis et Tactical restent inchangés ;
- contrat Dungeon mis à jour pour refléter cette propriété pure ;
- workflow one-shot retiré dans le commit runtime.

Étape suivante :
relancer la CI normale et réaligner uniquement les fingerprints historiques réellement invalidés, un garde à la fois.

## Fermeture candidate GREEN

SHA technique GREEN :
`fbc920816e8ab4ec35aa707430e499379715cf11`.

CI complète :
- Architecture + Browser Chromium : `36405137080` — SUCCESS ;
- Firefox : `36405136990` — SUCCESS ;
- Tactical Dock : `36405137041` — SUCCESS.

Runtime final :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Résultat :
- `GensDungeonV1.exploration.buildGeneratedBranchSceneElement(room, cellIndex, branchType)` possède uniquement la construction pure du descripteur generated ;
- les formes historiques treasure / boss / secret et le fallback de libellé sont conservés ;
- `nearestFree(x)`, le premier RNG de chance, le second RNG de type, `addDungeonSceneElement(...)`, `m.cells[i]='trapdoor'` et le retour de matérialisation restent dans Core 2.00 ;
- `shouldCreateGeneratedBranch(...)` et `pickWeightedGeneratedBranchType(...)` restent leurs propriétaires Dungeon déjà établis ;
- authored / Spatial / RoomRuntime / événements-spawn / ennemis / Tactical / Survie / Capture / PvP restent hors périmètre ;
- la caractérisation #191 est devenue une caractérisation post-raccord et la garde #192 valide le builder pur, son fresh object et l'absence de side effects ;
- les fingerprints historiques invalidés par le nouveau blob ont été réalignés un garde à la fois, sans assouplir les assertions métier ;
- Architecture, Browser Chromium, Firefox et Tactical Dock sont GREEN sur le même SHA technique ;
- aucun changement utilisateur visible : aucun test utilisateur supplémentaire requis.

Checkpoint final prévu après CI du présent SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-descriptor-green-2026-09-28`.

## Prochaine action obligatoire

1. valider cette fermeture documentaire par Architecture + Browser, Firefox et Tactical Dock ;
2. si tout est SUCCESS, créer le checkpoint final exact ci-dessus ;
3. ouvrir seulement ensuite le prochain micro-lot Phase 7 depuis ce checkpoint GREEN ;
4. rester dans `Dungeon exploration / salles / branches` et pré-auditer avant toute modification runtime ;
5. appliquer Rule 26 dès qu'une nouvelle inspection exacte de `index.html` est nécessaire.

