# GenSrpG — Phase 7 / Dungeon generated — audit matérialisation des salles post Boss authority sweep — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-boss-policy-post-authority-sweep-green-2026-09-30`

SHA exact de base :
`cae1b61120fabd331a437290bb63639f57d79896`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-materialization-audit-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-materialization-audit-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN documentaire de la base :
- Architecture + Browser `36741124146` — SUCCESS ;
- Firefox `36741124306` — SUCCESS ;
- Tactical Dock `36741124296` — SUCCESS.

Runtime courant :
- `index.html` : `8169856` octets ;
- blob Git : `454b2e12cde591c2db19023d1b76055ebac8e1b1`.

## Position Phase 7

Les responsabilités generated déjà propriétaires dans `GensDungeonV1.exploration` sont :
- `planGeneratedAdvance(...)` ;
- `pickWeightedGeneratedRoomKind(...)` ;
- `buildGeneratedRoomTransition(...)` ;
- `pickWeightedGeneratedBranchType(...)` ;
- `shouldCreateGeneratedBranch(...)` ;
- `buildGeneratedBranchSceneElement(...)` ;
- `planGeneratedBossPolicy(...)`.

Le lot historique create/restore a déjà prouvé :
- une salle `existing` est restaurée sans régénération ;
- une salle `create` appelle `createRoom(...)` exactement une fois ;
- Spatial et Room Runtime gardent leurs autorités ;
- seul le descripteur pur de transition a été extrait.

Le présent lot ne refait donc pas le lot create/restore.

## Cible stricte du micro-lot 31

Caractériser uniquement la responsabilité encore inline :
`dungeonCore200Rebuild.createRoom(room, kind)`.

Aucune API cible de migration n'est figée avant caractérisation.

L'audit doit distinguer au minimum :
1. sélection du résultat de salle ;
2. chemins actifs `dungeonEncounter(room)` et `dungeonBossRoom(room)` ;
3. descripteurs statiques trap/chest/merchant/rest/mystery ;
4. remise à zéro historique de `dc200Branch` sur les ennemis persistés de la salle ;
5. sauvegarde de ces ennemis ;
6. choix carte activée/désactivée ;
7. appel `generateDungeonMap(kind, enemyQty)` ;
8. forme de retour `{result,map}`.

## Constat Rule 26 issu de la source utilisateur

Le fichier `work40.zip / index40.txt`, fourni par Sylvain et précédemment vérifié :
- taille `8169990` ;
- blob `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Il a permis d'inspecter exactement `createRoom(...)`.

Le lot 30 a modifié uniquement :
- la politique Boss inline de `chooseKind(room)` ;
- `assets/gensrpg/dungeon/entry-v1.js` ;
- tests/sentinelles associés.

Le corps `createRoom(...)` n'a pas été modifié par le lot 30.

Cette ancienne source peut donc servir à la caractérisation du seam inchangé, mais **pas** à produire un nouveau `index.html` courant.

Toute future modification de `index.html` dans ce lot exigera une source Rule 26 correspondant exactement au runtime courant :
- `8169856` octets ;
- blob `454b2e12cde591c2db19023d1b76055ebac8e1b1`.

## Risque architectural identifié

`createRoom(...)` n'est pas une fonction pure homogène.

Elle mélange actuellement :
- appels de rencontre/Boss susceptibles de RNG, réserve et spawn ;
- choix de piège ;
- construction de descripteurs statiques ;
- lecture/écriture de la liste d'ennemis actifs ;
- mutation `dc200Branch` ;
- configuration Dungeon ;
- génération de carte avec RNG.

Il est interdit d'extraire `createRoom(...)` en bloc.

## Hors périmètre absolu

Ne pas modifier dans ce lot d'audit :
- `dungeonEncounter(...)` ;
- `dungeonBossRoom(...)` ;
- réserves ennemies / spawn ;
- `generateDungeonMap(...)` ;
- Room Creator / World Builder ;
- Spatial ;
- Room Runtime ;
- événements ;
- coffres / pièges / énigmes en runtime ;
- mouvement ;
- branches generated ;
- politique Boss ;
- authored ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets ;
- stockage général.

## Plan TDD / audit

1. ajouter une caractérisation permanente de `createRoom(...)` sur le runtime courant ;
2. verrouiller les appels, ordre et effets observables avec dépendances stubées ;
3. raccorder la caractérisation à Architecture ;
4. obtenir triple CI GREEN ;
5. sélectionner, à partir de la preuve, UNE seule responsabilité pure homogène ;
6. seulement alors décider s'il faut ouvrir un RED de migration dans ce même lot ou fermer l'audit et ouvrir un lot dédié ;
7. aucune modification runtime avant cette décision.

## Critères GREEN de caractérisation

La caractérisation doit prouver au minimum :
- `enemy` et `ambush` délèguent à `dungeonEncounter(room)` ;
- `boss` délègue à `dungeonBossRoom(room)` ;
- trap/chest/merchant/rest/default conservent leurs formes historiques ;
- seuls les ennemis de la salle avec `dc200Branch===undefined` reçoivent `false` ;
- la liste d'ennemis est sauvegardée après cette normalisation ;
- `cfg().map===false` retourne `map:null` sans génération ;
- sinon `generateDungeonMap(kind, result.enemyQty||0)` est appelée une fois ;
- le retour reste `{result,map}` ;
- authored et autres modules restent hors de ce seam.

Aucun changement utilisateur visible n'est attendu pour la phase de caractérisation.
