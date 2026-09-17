# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4F : embuscade Core 2.09

- Branche : `work/gensrpg-combat-callsite-migration-4f-2026-09-17`
- Base exacte / checkpoint vert lot 4E : `0315edb74a428594fa02d8d9fd74639779b8df07`
- Checkpoint vert 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17`
- Checkpoint de départ 4F : `checkpoint/gensrpg-start-combat-callsite-migration-4f-2026-09-17`
- Commit runtime 4F : `e473571bd80a5a61c9258c16e43d9472d5a395db`
- Test 4F : `tests/gens_core209_ambush_direct_bridge_lot4f.test.cjs`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat appliqué du lot 4F

La caractérisation a été écrite avant la correction. Core 2.09 conserve intégralement sa logique d'embuscade : garde d'événement/salle, source `living(x)`, déduplication et persistance `dc209AmbushDone`, verrou `ambushStarting`, délai 120 ms et libération à 250 ms.

Seule l'entrée finale du combat a été migrée :

`dc200StartCombat(live.map(e=>String(e.id)),"ambush")`

devient :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:"ambush",entry:"dc209Ambush"})`

Les participants et le scope restent calculés par V113 via le Bridge. Aucune règle V113 n'est recopiée dans Core 2.09.

Le writer temporaire utilisé pour le gros `index.html` a été restauré immédiatement au workflow progression canonique en lecture seule, blob `31c5043f8352b656f1d015bc4888332e738bf913`.

## Dette combat après application 4F

Inventaire attendu :

- `dc200StartCombat` : 1 — uniquement `window.dc200StartCombat=startCombat` ;
- `openDungeonCombatSetup` : 1 — définition rollback historique ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Le test d'inventaire a été abaissé de 3 à 1 uniquement après la modification réelle du runtime. Le test 4E a été recentré sur son contrat de détection et le test 4F est désormais seul propriétaire des assertions d'entrée d'embuscade.

L'alias Core 2.x restant doit être caractérisé séparément. Ne pas le retirer avec `startCombat` ou `launchCombat200` sans nouveau lot dédié.

## Diagnostic UI séparé — dock flottant Tactical

Observation utilisateur : les boutons flottants `Attaquer / Fin du tour / Capacité` ont disparu.

Cause confirmée :

- le dock appartient au module V111 `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js` ;
- `ensureDock()` existe toujours et crée les trois boutons ;
- l'ancien `MutationObserver` n'est plus installé, conformément à la charte ;
- V111 tente de maintenir le dock via un wrapper de `GensRpgTacticalCombatV2Ui.render` exporté ;
- le renderer Tactical de base appelle cependant son `render()` lexical/interne depuis `open()` et depuis ses actions ; ces rendus contournent donc le wrapper exporté ;
- les boutons source `data-attack` et `data-end` existent toujours, mais `ensureDock()` n'est plus rappelé sur le vrai chemin de rendu.

Ne pas réactiver `MutationObserver`, timer global ou retry. Après le checkpoint vert 4F, ouvrir un lot UI séparé avec un raccord post-rendu explicite appartenant au renderer Tactical, un test navigateur vrai chemin, puis fournir une preview de test à l'utilisateur.

## Validation de fermeture 4F

Le runtime, les gardes 4E/4F, l'inventaire à 1 et la documentation sont alignés. Le test 4F est raccordé aux sentinelles architecture.

Avant le checkpoint vert 4F, exiger sur le même SHA final :

1. architecture complète verte, incluant V112/V113/Bridge, inventaire et 4F ;
2. Chromium / preview verts ;
3. Firefox vert ;
4. workflow progression toujours sur le blob lecture seule `31c5043f8352b656f1d015bc4888332e738bf913` ;
5. `main` toujours sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Checkpoint à créer seulement après ces contrôles : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17`.

## Jalons verts précédents

- Lot 4E : `checkpoint/gensrpg-combat-callsite-migration-4e-green-2026-09-17` — `0315edb74a428594fa02d8d9fd74639779b8df07`.
- Lot 4D : `checkpoint/gensrpg-combat-callsite-migration-4d-green-2026-09-17` — `e9ee86b128d8954629163ee264dc5e950421e9e9`.
- Lot 4C : `checkpoint/gensrpg-combat-callsite-migration-4c-green-2026-09-17` — `8ce140c924d259091a6c9838b82d669256a104f3`.
- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, checkpoint avant changement, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.
