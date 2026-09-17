# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4D : détection Core 2.11 vers Bridge canonique

- Branche : `work/gensrpg-combat-callsite-migration-4d-2026-09-17`
- Base exacte / checkpoint vert lot 4C : `8ce140c924d259091a6c9838b82d669256a104f3`
- Commit runtime lot 4D : `308fd5ac8e511faa8f285cb6dcc69c5e960d9270`
- Workflow temporaire restauré en lecture seule : `399024ed68198220ed36dde6474f0bfa11b3b0f5`
- Inventaire 4D aligné : `dc200StartCombat` 7 → 5
- Checkpoint vert visé : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat du lot 4D

Core 2.11 a été caractérisé avant modification. Son comportement de détection reste propriétaire uniquement de son bookkeeping local :

- garde `enemyDetection` / `detectBusy211` conservée ;
- filtre spatial `DungeonSpatial313.sameView()` conservé ;
- déduplication et persistance `dc211EnemyDetection` conservées ;
- sélection exacte des `enemyIds` conservée ;
- délai de déclenchement 80 ms conservé ;
- libération du verrou à 250 ms conservée.

Seule l'entrée finale du combat a été migrée :

`dc200StartCombat(ids,"detection")`

devient :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:ids,reason:"detection",entry:"dc211EnemyDetection"})`

Le scope et les participants restent calculés par l'autorité V113 via le Bridge. Aucune logique V113 n'a été recopiée dans Core 2.11.

Le test permanent `tests/gens_core211_detection_direct_bridge_lot4d.test.cjs` protège explicitement ces invariants et est raccordé aux sentinelles architecture.

## Dette combat après lot 4D

Inventaire attendu dans `index.html` :

- `dc200StartCombat` : 5 ;
- `openDungeonCombatSetup` : 1 — définition historique rollback uniquement ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Les cinq références `dc200StartCombat` restantes doivent être caractérisées par rôle avant migration. Ne pas mélanger alias, détection restante et embuscade dans un même lot.

## Discipline charte appliquée

- aucun changement sur `main` ;
- lot homogène et borné ;
- caractérisation/test avant modification ;
- aucune nouvelle couche de réparation ;
- aucun observer, timer de réparation ou wrapper ajouté ;
- `enemyIds` et `reason:"detection"` préservés ;
- sélection V113 centralisée dans le Bridge ;
- workflow temporaire d'écriture du gros `index.html` retiré immédiatement après usage ;
- `.github/workflows/gensrpg-progression-characterization.yml` est revenu à son blob canonique lecture seule `31c5043f8352b656f1d015bc4888332e738bf913`.

## Validation 4D à figer

Le runtime 4D et son garde spécifique sont en place. Le premier passage des sentinelles a atteint le garde d'inventaire et a échoué uniquement parce qu'il attendait encore la dette précédente `dc200StartCombat:7` alors que le runtime contient désormais 5 occurrences. Le garde et la documentation sont maintenant alignés à 5.

Avant création du checkpoint vert 4D, exiger sur le SHA final :

1. sentinelles architecture vertes ;
2. Chromium / preview verts ;
3. Firefox vert ;
4. workflow progression toujours lecture seule ;
5. `main` toujours sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Ce qui n'a pas été touché

- embuscade ;
- autres chemins de détection Core 2.x ;
- `startCombat` et `launchCombat200` ;
- résolution Tactical ;
- timeline/IA Core 3.03 ;
- participants et règles de combat ;
- stats, XP, récompenses et loot ;
- déplacement ;
- navigation générale, fiche héros, Save & Quit ;
- Survival, Capture, PvP, World Builder ;
- cache/PWA.

## Observations utilisateur à conserver hors périmètre

1. Les commandes flottantes de combat `Attaque / Fin de tour / Capacité` ont disparu de l'interface.
2. Lors d'une ouverture de fiche personnage, des éléments de `Talent` sont apparus brièvement puis ont disparu ; non reproduit au second essai.

Ne pas corriger ces anomalies pendant la migration combat sans diagnostic propriétaire conforme à la charte.

## Prochaine étape après checkpoint vert 4D

Caractériser le plus petit groupe homogène parmi les cinq références `dc200StartCombat` restantes. Préserver strictement `enemyIds`, `reason`, portée/scope V113 et comportement d'embuscade. Aucun changement de runtime ne commence avant le checkpoint vert 4D.

## Jalons verts précédents

- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.
- Lot 4B : `9c1b939ed7e7b34108882be933a99f2151529c79`.
- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. checkpoint de départ avant le premier changement ;
3. branche créée depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant le chantier suivant.
