# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4E : détection Core 2.09

- Branche : `work/gensrpg-combat-callsite-migration-4e-2026-09-17`
- Base exacte / checkpoint vert lot 4D : `e9ee86b128d8954629163ee264dc5e950421e9e9`
- Checkpoint de départ 4E : `checkpoint/gensrpg-start-combat-callsite-migration-4e-2026-09-17`
- Test 4E : `tests/gens_core209_detection_direct_bridge_lot4e.test.cjs`
- Commit runtime 4E : `cf5d4ac7527f276ebeddd81dedcfbd3ea1de7f58`
- Workflow temporaire restauré : `fa3a7a23f00b63dd035ce12112501cf39c06b444`
- Workflow progression canonique : blob `31c5043f8352b656f1d015bc4888332e738bf913`, `contents: read`
- Inventaire combat après runtime 4E : `3 / 1 / 2 / 6`
- Checkpoint vert visé : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Lot 4D — état figé vert

Checkpoint : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.

Validation : architecture + Chromium/preview verts sur run `35204985777`, Firefox vert sur run `35204985756`, workflow progression lecture seule et `main` intact.

## Caractérisation 4E avant correction

Les cinq références `dc200StartCombat` restantes ont été séparées avant modification runtime :

1. une référence = alias historique `window.dc200StartCombat=startCombat` ;
2. deux références = détection Core 2.09 ;
3. deux références = embuscade Core 2.09.

Le lot 4E est volontairement limité aux **deux références de détection Core 2.09**. L'alias et l'embuscade sont hors périmètre.

Le test de caractérisation a été créé avant correction et a été rouge exactement sur l'entrée historique de détection. Il verrouille :

- garde `triggering` et salle valide ;
- héros actif et position courante ;
- sélection exacte via `zones.filter(z=>z.zone.has(hp))` ;
- déduplication/persistance `dc209Detected` ;
- délai 80 ms ;
- libération `triggering=false` à 250 ms ;
- `enemyIds` issus de `detectors.map(z=>String(z.e.id))` ;
- `reason:"detection"`.

Le même test protège l'embuscade comme hors périmètre : `ambushStarting`, `kind==="ambush"`, `living(x)`, `dc209AmbushDone`, délai 120 ms, libération 250 ms et appel historique `dc200StartCombat(...,"ambush")` encore requis.

## Correction runtime 4E appliquée

Seule l'entrée finale de la détection Core 2.09 a changé :

`dc200StartCombat(detectors.map(z=>String(z.e.id)),"detection")`

est remplacé par :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:detectors.map(z=>String(z.e.id)),reason:"detection",entry:"dc209EnemyDetection"})`

Aucune sélection de participants n'a été recopiée dans Core 2.09 : le scope V113 reste centralisé dans le Bridge.

Le compteur brut `dc200StartCombat` est passé exactement de 5 à 3. Le test d'inventaire et `docs/GENSRPG_COMBAT_CALLSITE_INVENTORY.md` sont alignés à :

- `dc200StartCombat` : 3 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Le garde 4E est raccordé aux sentinelles architecture.

## Discipline charte appliquée

- checkpoint de départ avant modification ;
- branche créée depuis exactement le checkpoint vert 4D ;
- caractérisation/test avant correction ;
- un seul groupe homogène migré ;
- aucun observer, timer de réparation, wrapper ou rerender ajouté ;
- aucun changement d'embuscade ;
- aucun changement d'alias Core 2.x ;
- `enemyIds` et `reason` préservés ;
- V113 reste propriétaire du scope via le Bridge ;
- workflow temporaire d'écriture retiré immédiatement après la modification du gros `index.html` ;
- `main` non touché.

## Ce qui n'a pas été touché

- embuscade Core 2.09 ;
- alias `window.dc200StartCombat=startCombat` ;
- `startCombat` et `launchCombat200` ;
- détection Core 2.11 déjà validée ;
- résolution Tactical ;
- timeline/IA Core 3.03 ;
- participants et règles de combat ;
- stats, XP, récompenses et loot ;
- déplacement ;
- navigation générale, fiche héros, Save & Quit ;
- Survival, Capture, PvP, World Builder ;
- cache/PWA.

## Validation finale 4E requise

Avant de créer le checkpoint vert 4E, exiger sur le même SHA final :

1. architecture verte, y compris le garde 4E ;
2. Chromium / preview verts ;
3. Firefox vert ;
4. workflow progression toujours lecture seule ;
5. `main` toujours sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Prochaine étape seulement après checkpoint vert 4E

Il restera exactement trois références `dc200StartCombat` : une pour l'alias historique et deux pour l'embuscade Core 2.09. Les caractériser séparément ; ne pas mélanger retrait d'alias et migration d'embuscade.

## Observations utilisateur hors périmètre

1. Les commandes flottantes de combat `Attaque / Fin de tour / Capacité` ont disparu de l'interface.
2. Des éléments de `Talent` ont brièvement clignoté une fois sur la fiche héros puis ont disparu ; non reproduit au second essai.

Ne pas les corriger pendant ce lot sans diagnostic de propriétaire conforme à la charte.

## Jalons verts précédents

- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
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
