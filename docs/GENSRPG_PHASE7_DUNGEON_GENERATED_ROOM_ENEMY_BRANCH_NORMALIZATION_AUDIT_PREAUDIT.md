# GenSrpG — Phase 7 / Dungeon generated — audit normalisation dc200Branch — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-materialization-audit-green-2026-09-30`

SHA exact de base :
`b546f96a928ade114553790a37b1f07ba8e56b87`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-enemy-branch-normalization-audit-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-enemy-branch-normalization-audit-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN documentaire de la base :
- Architecture + Browser `36752651640` — SUCCESS ;
- Firefox `36752651555` — SUCCESS ;
- Tactical Dock `36752651655` — SUCCESS.

Runtime courant :
- `index.html` : `8169442` octets ;
- blob Git : `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

## Position Phase 7

Le micro-lot 31 a extrait uniquement :
`GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind, trapType)`.

Core 2.00 conserve encore dans `createRoom(room,kind)` :
- encounter / Boss ;
- choix du piège ;
- normalisation `dc200Branch` ;
- sauvegarde de la liste d'ennemis ;
- génération de carte ;
- composition finale `{result,map}`.

Le présent lot ne refait ni le lot 31 ni la matérialisation complète.

## Cible stricte du micro-lot 32

Caractériser uniquement la règle historique :

- charger `loadActiveEnemies() || []` ;
- pour chaque ennemi :
  - comparer `Number(enemy.dungeonRoom || 0)` à `Number(room)` ;
  - si la salle correspond ET `enemy.dc200Branch === undefined`, poser `false` ;
- conserver tout marqueur déjà défini, y compris `true`, `false`, `null` ou autre valeur ;
- ne pas toucher aux ennemis d'une autre salle ;
- appeler ensuite `saveActiveEnemies(all)`.

Aucune API cible n'est figée avant caractérisation.

## Risque architectural

La règle de décision `doit recevoir false ou non` est potentiellement pure.

En revanche :
- `loadActiveEnemies()` ;
- la mutation réelle des objets ennemis ;
- `saveActiveEnemies(...)`

sont des effets de stockage/runtime et doivent rester à leur propriétaire tant qu'un lot séparé ne prouve pas leur déplacement.

Il est donc interdit d'extraire le bloc complet stockage + mutation en une nouvelle autorité concurrente.

## Cas limites à verrouiller

La caractérisation doit distinguer :
- `room` number et chaîne numérique ;
- `enemy.dungeonRoom` number et chaîne numérique ;
- salle différente ;
- `dungeonRoom` falsy / absent via le fallback historique `|| 0` ;
- `dc200Branch === undefined` -> devient `false` ;
- `dc200Branch === false` -> reste `false` ;
- `dc200Branch === true` -> reste `true` ;
- `dc200Branch === null` -> reste `null` ;
- liste vide ;
- identité du tableau et des objets conservée si le chemin historique mute in-place ;
- sauvegarde appelée exactement une fois après la normalisation.

## Hors périmètre absolu

Ne pas modifier dans l'audit initial :
- `dungeonEncounter(...)` ;
- `dungeonBossRoom(...)` ;
- choix du piège ;
- résultats non-combat déjà extraits ;
- génération de carte / RNG ;
- spawn / réserve ennemie ;
- système global de stockage ;
- Spatial ;
- Room Runtime ;
- branches generated ;
- politique Boss ;
- authored World Builder ;
- mouvement ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets.

## TDD

1. ajouter une caractérisation dédiée de la normalisation `dc200Branch` ;
2. raccorder la caractérisation à Architecture ;
3. obtenir triple CI GREEN ;
4. à partir de cette preuve, sélectionner UNE responsabilité pure minimale si elle existe ;
5. seulement ensuite poser une sentinelle RED ;
6. aucun changement runtime avant RED isolé.

## Rule 26

L'audit initial n'exige aucune modification de `index.html`.

La caractérisation repose sur la frontière déjà verrouillée par le lot 31.

Toute future modification de `index.html` exige une source Rule 26 correspondant exactement au runtime courant :
- taille `8169442` ;
- blob `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

Aucun nouveau mécanisme global, wrapper, timer, observer ou retry n'est autorisé.


## Caractérisation GREEN dc200Branch

Test :
`tests/gens_phase7_dungeon_generated_room_enemy_branch_normalization_characterization_v1.test.cjs`.

SHA GREEN :
`8a8e605c69a64b5ab0018cfa75d4a10f0d7adcc1`.

CI :
- Architecture + Browser `36754785657` — SUCCESS ;
- Firefox `36754785664` — SUCCESS ;
- Tactical Dock `36754785665` — SUCCESS ;
- étape #197 `Caractériser la normalisation dc200Branch generated Phase 7` — SUCCESS.

La caractérisation confirme :
- comparaison historique `Number(enemy.dungeonRoom || 0) === Number(room)` ;
- un numéro de salle numérique et sa chaîne numérique sont équivalents ;
- les valeurs absentes/falsy de `dungeonRoom` passent par le fallback `0` ;
- seul `dc200Branch === undefined` reçoit la valeur `false` ;
- les marqueurs déjà définis `false`, `true`, `null`, `0` et chaîne vide restent inchangés ;
- les ennemis d'une autre salle restent inchangés ;
- le tableau et les objets ennemis gardent leur identité : le chemin historique mute in-place ;
- `saveActiveEnemies(all)` reçoit le tableau exact chargé ;
- l'ordre reste `load -> normalisation -> save -> cfg/map` ;
- un résultat de chargement absent utilise `[]` puis sauvegarde cette liste vide ;
- le bloc reste dans le `try/catch` historique de Core 2.00.

## Slice pure sélectionnée

API cible :
`GensDungeonV1.exploration.shouldDefaultGeneratedRoomEnemyBranch(enemy, room)`.

Responsabilité unique :
retourner le booléen historique :

`Number(enemy.dungeonRoom || 0) === Number(room) && enemy.dc200Branch === undefined`.

Le raccord futur doit laisser dans Core 2.00 :
- `loadActiveEnemies()` ;
- le `try/catch` historique ;
- `all.forEach(...)` ;
- la mutation `enemy.dc200Branch=false` ;
- `saveActiveEnemies(all)` ;
- tout ce qui suit dans `createRoom(...)`.

L'API cible :
- ne mute rien ;
- ne lit aucun stockage ;
- ne lit aucune config ;
- ne consomme aucun RNG ;
- ne dépend ni du DOM ni d'un autre module ;
- conserve les accès directs aux propriétés de l'ennemi afin de ne pas introduire silencieusement une nouvelle tolérance aux entrées invalides.

## Prochaine étape TDD

1. poser UNE sentinelle RED exigeant uniquement `shouldDefaultGeneratedRoomEnemyBranch(...)` et son raccord dans la boucle existante ;
2. vérifier que #197 reste GREEN ;
3. vérifier RED isolé sur la nouvelle étape Architecture ;
4. Firefox et Tactical Dock doivent rester GREEN ;
5. aucun micro-diff runtime avant ce RED isolé.


## Fermeture du micro-lot 32

### RED isolé

SHA :
`b9355fa33cf7e4dee6214254954bdc6345bfe8e2`.

CI :
- Architecture `36755952074` — FAILURE attendue uniquement sur #198 `Exiger la règle pure dc200Branch generated Phase 7` ;
- caractérisation #197 — SUCCESS ;
- Firefox `36755951793` — SUCCESS ;
- Tactical Dock `36755951729` — SUCCESS.

### Raccord GREEN technique

SHA technique GREEN :
`37d50b4dcd7322f02831f01de777ed685ccd8e9a`.

CI :
- Architecture + Browser `36761222657` — SUCCESS ;
- Firefox `36761222535` — SUCCESS ;
- Tactical Dock `36761222557` — SUCCESS ;
- étape #197 `Caractériser la normalisation dc200Branch generated Phase 7` — SUCCESS ;
- étape #198 `Exiger la règle pure dc200Branch generated Phase 7` — SUCCESS.

### Runtime final

`index.html` :
- taille : `8169447` octets ;
- blob Git : `106d2ec6e82f3b777e1d724cd3f74f30a22fdf39`.

Rule 26 a vérifié :
- runtime source exact : `8169442 / a37acaabcb3202a8527c2d545f9e2ff4466ea1db` ;
- seam inline unique ;
- sortie exacte : `8169447 / 106d2ec6e82f3b777e1d724cd3f74f30a22fdf39` ;
- tests #197/#198 GREEN localement avant commit.

### Résultat exact

Le propriétaire pur est désormais :
`GensDungeonV1.exploration.shouldDefaultGeneratedRoomEnemyBranch(enemy, room)`.

Il possède uniquement la décision historique :
`Number(enemy.dungeonRoom||0)===Number(room) && enemy.dc200Branch===undefined`.

Core 2.00 conserve :
- `loadActiveEnemies()` ;
- le `try/catch` historique ;
- `all.forEach(...)` ;
- la mutation réelle `enemy.dc200Branch=false` ;
- `saveActiveEnemies(all)` ;
- tout le reste de `createRoom(...)`.

Sémantique conservée :
- comparaison Number historique ;
- fallback `dungeonRoom||0` ;
- seuls les marqueurs `undefined` sont initialisés ;
- `false`, `true`, `null`, `0` et chaîne vide restent inchangés ;
- ennemis des autres salles inchangés ;
- mutation in-place et identité tableau/objets conservées ;
- ordre `load -> normalisation -> save -> cfg/map` conservé.

### Sentinelles et tooling

Les gardes qui désignaient le précédent fingerprint comme runtime courant ont été réalignées sur :
`8169447 / 106d2ec6e82f3b777e1d724cd3f74f30a22fdf39`.

Les deux listes explicitement historiques ont conservé l'ancien couple et ajouté le nouveau.

Les métadonnées Phase 2 qui identifient le blob source courant ont été réalignées.

Tous les workflows/scripts temporaires de writer, scan et réalignement ont été supprimés avant le SHA technique final.

### Frontière préservée

Aucun déplacement de :
- chargement/sauvegarde ennemis ;
- mutation ennemis ;
- encounter/Boss ;
- choix du piège ;
- résultat non-combat du lot 31 ;
- génération de carte / RNG ;
- Spatial ;
- Room Runtime ;
- branches generated ;
- politique Boss ;
- authored ;
- mouvement ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets.

Aucun changement utilisateur visible attendu.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-generated-room-enemy-branch-normalization-audit-green-2026-09-30`.
