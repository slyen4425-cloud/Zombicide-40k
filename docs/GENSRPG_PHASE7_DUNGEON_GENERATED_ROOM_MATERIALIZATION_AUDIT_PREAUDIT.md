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


## Caractérisation GREEN du seam createRoom

Test :
`tests/gens_phase7_dungeon_generated_room_materialization_characterization_v1.test.cjs`.

SHA :
`62d3bd9d48201be4ec9af5ab541057206cbcae6f`.

CI :
- Architecture + Browser `36743699875` — SUCCESS ;
- Firefox `36743699968` — SUCCESS ;
- Tactical Dock `36743699886` — SUCCESS ;
- étape dédiée #195 `Caractériser la matérialisation des salles generated Phase 7` — SUCCESS.

La caractérisation verrouille exactement :

### Chemins actifs

- `enemy` et `ambush` délèguent à `dungeonEncounter(room)` ;
- `boss` délègue à `dungeonBossRoom(room)` ;
- ces chemins restent hors extraction pure.

### Descripteurs non-combat

- `trap` construit le résultat à partir du type de piège déjà choisi ;
- `chest`, `merchant`, `rest` et le fallback calme sont des objets descriptifs sans besoin de runtime externe une fois les entrées connues.

### Normalisation ennemis

Après le choix du résultat :
- `loadActiveEnemies()` est lu ;
- seuls les ennemis dont `Number(dungeonRoom)===Number(room)` et `dc200Branch===undefined` reçoivent `false` ;
- un marqueur existant n'est pas écrasé ;
- les autres salles restent intactes ;
- `saveActiveEnemies(all)` reste au propriétaire Core 2.00.

### Carte

- `cfg().map===false` produit `map:null` sans appel à `generateDungeonMap` ;
- sinon `generateDungeonMap(kind,result.enemyQty||0)` est appelé une fois ;
- RNG et géométrie restent hors extraction pure.

### Retour

La forme reste :
`{result,map}`.

## Slice pure sélectionnée

API cible :
`GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind, trapType)`.

Responsabilité unique :
construire uniquement les objets descriptifs des salles generated non-combat.

Sémantique cible :
- `trap` -> `{title:'🪤 '+trapType.name,text:'Un piège est présent dans la salle.',enemyQty:0,trapId:trapType.id}` ;
- `chest` -> descripteur Coffre historique ;
- `merchant` -> descripteur Marchand historique ;
- `rest` -> descripteur Sanctuaire historique ;
- autre kind non-combat -> descripteur Salle calme historique.

Le callsite Core 2.00 conserve :
- les branches `enemy/ambush` et `boss` ;
- le choix du piège `dungeonPickTrapType(cfg())` et son fallback historique ;
- la normalisation / sauvegarde `dc200Branch` ;
- `cfg().map` ;
- `generateDungeonMap(...)` ;
- la composition finale `{result,map}`.

L'API cible :
- ne consomme aucun RNG ;
- ne lit aucune config ;
- ne touche aucun stockage ;
- ne dépend ni du DOM, ni de Spatial, ni de Room Runtime ;
- ne consomme aucun autre module.

## Rule 26 courant reconstitué et vérifié

À partir du fichier utilisateur exact `work40.zip / index40.txt` et du micro-diff Boss du lot 30 déjà documenté, l'`index.html` courant a été reconstruit localement.

Empreinte vérifiée :
- `8169856` octets ;
- blob Git `454b2e12cde591c2db19023d1b76055ebac8e1b1`.

Cette reconstruction correspond exactement au runtime courant.

Un futur micro-diff du seam sélectionné pourra donc utiliser cette source exacte, sous garde stricte d'empreinte et remplacement à occurrence unique.

## Prochaine étape TDD

1. poser UNE sentinelle RED exigeant `buildGeneratedNonCombatRoomResult(...)` et son raccord exact dans `createRoom(...)` ;
2. vérifier RED isolé sur Architecture ;
3. Firefox et Tactical Dock doivent rester GREEN ;
4. seulement ensuite appliquer le micro-diff minimal.


## RED isolé non-combat

SHA :
`45060d384bb0ae2736208dde54981350529a9cb2`.

CI :
- Architecture `36744953544` — FAILURE attendue uniquement sur #196 `Exiger le propriétaire pur des résultats non-combat generated Phase 7` ;
- caractérisation #195 — SUCCESS ;
- Browser — SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36744953488` — SUCCESS ;
- Tactical Dock `36744953451` — SUCCESS.

Le RED est donc isolé à l'absence du nouveau propriétaire pur et de son raccord.

Aucune autre régression n'est détectée avant micro-diff.


## Fermeture du micro-lot 31

### Raccord GREEN technique

SHA technique GREEN :
`2ada8cbd17dd872cd02bfb395a16304da8371554`.

CI :
- Architecture + Browser `36746980361` — SUCCESS ;
- Firefox `36746979868` — SUCCESS ;
- Tactical Dock `36746978838` — SUCCESS ;
- étape #195 `Caractériser la matérialisation des salles generated Phase 7` — SUCCESS ;
- étape #196 `Exiger le propriétaire pur des résultats non-combat generated Phase 7` — SUCCESS.

### Runtime final

`index.html` :
- taille : `8169442` octets ;
- blob Git : `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

Le changement de fingerprint provient uniquement du micro-diff ciblé du seam non-combat et des réalignements de sentinelles nécessaires.

### Résultat exact

Le propriétaire pur est désormais :
`GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind, trapType)`.

Il possède uniquement :
- le descripteur piège une fois le piège déjà choisi ;
- le descripteur coffre ;
- le descripteur marchand ;
- le descripteur repos ;
- le descripteur calme/fallback.

Core 2.00 conserve :
- `enemy/ambush -> dungeonEncounter(room)` ;
- `boss -> dungeonBossRoom(room)` ;
- le choix du piège `dungeonPickTrapType(cfg())` et son fallback historique ;
- la normalisation `dc200Branch` ;
- `loadActiveEnemies()` / `saveActiveEnemies(...)` ;
- `cfg().map` ;
- `generateDungeonMap(kind,result.enemyQty||0)` ;
- la composition finale `{result,map}`.

Le builder pur :
- ne consomme aucun RNG ;
- ne lit aucune configuration ;
- ne touche aucun stockage ;
- ne dépend ni du DOM, ni de Spatial, ni de Room Runtime ;
- ne consomme aucun autre module.

### Sentinelles / Rule 26

La source exacte courante a été obtenue sous Rule 26 à partir de la source utilisateur vérifiée et du micro-diff Boss déjà documenté, puis protégée par empreinte avant le micro-diff du lot 31.

Les gardes qui verrouillaient explicitement l'ancien runtime courant ont été réalignées sur le nouveau fingerprint sans suppression d'assertions métier.

Les outils temporaires de fingerprint ont été retirés avant le SHA technique GREEN final.

### Frontière préservée

Restent inchangés :
- encounter et Boss actifs ;
- réserve/spawn ennemis ;
- stockage ennemis hors normalisation historique conservée au callsite ;
- génération de carte et RNG ;
- Spatial ;
- Room Runtime ;
- branches generated ;
- politique Boss ;
- authored World Builder ;
- mouvement ;
- événements ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets.

Aucun changement utilisateur visible attendu.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-generated-room-materialization-audit-green-2026-09-30`.
