# GenSrpG — Phase 5 / retrait goMenu Core 0.01

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-core01-retirement-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core01-retirement-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-core01-preaudit-green-2026-09-23` ;
- SHA de base :
  `d17ac5c486f0abfd9520c69356457e403370dfb5` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## TDD

Sentinelle :
`tests/gens_phase5_gomenu_core01_retirement_v1.test.cjs`.

Le RED attendu a été obtenu avant modification runtime :
la chaîne contenait encore
`captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`,
alors que la cible était
`captureFix139 -> dungeonCore200Rebuild`.

## Modification runtime

Commit runtime :
`76df9e9a6ff83db118e054f1e0afa36ac0c8c90e`.

Retrait strictement soustractif dans `gensDungeonCore01Js` :
- retrait de la capture `const oldGo=window.goMenu` ;
- retrait de son remplacement global `window.goMenu=function(){...}`.

Diff `index.html` :
- 1 ligne supprimée ;
- 0 ajout ;
- 225 octets retirés.

Runtime final :
- taille : `8170961` ;
- blob Git : `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75`.

## Responsabilités Core 0.01 conservées

Le bloc `gensDungeonCore01Js` reste présent.

Sont explicitement conservés :
- son interception `startConfiguredGame` ;
- `closeGameCustomization` ;
- son ancienne API / implémentation `DungeonCore01` ;
- son état privé `coreActive`.

Aucun autre propriétaire n'a été retiré dans ce lot.

## Chaîne goMenu résultante

`captureFix139 -> dungeonCore200Rebuild`.

Le propriétaire final Dungeon reste `dungeonCore200Rebuild`.

## Réalignement des preuves dérivées

Le retrait de 225 octets a invalidé plusieurs sentinelles historiques qui
figeaient volontairement la taille/blob exacts du runtime précédent.

Elles ont été réalignées uniquement sur :
- taille `8170961` ;
- blob `0c15b1dba66ce83f2b27ed99e371885fb1d0ed75`.

Leurs assertions métier n'ont pas été modifiées.

Familles concernées :
- Storage ;
- Core Stats S7 ;
- Inventory/Equipment ;
- Core Dice ;
- Core Progression/XP ;
- audit final resolver d'assets ;
- cartographies Phase 2 / goMenu cumulatives.

## Validation technique

SHA technique GREEN :
`61730ed2fa0f006ab843fc72573d46fd869dbe69`.

Runs :
- Architecture + navigateur complet :
  `35883403875` — SUCCESS ;
- Firefox :
  `35883404119` — SUCCESS ;
- Tactical Dock :
  `35883404181` — SUCCESS.

Preuves :
- Architecture statique : 203 / 203 ;
- navigateur complet : 36 / 36 ;
- caractérisation Core 0.01 : SUCCESS ;
- retrait Core 0.01 : SUCCESS ;
- goMenu Dungeon/Capture/Survie : SUCCESS ;
- Dungeon -> Tactical : SUCCESS ;
- Capture victoire/reprise : SUCCESS ;
- Dungeon après Survie : SUCCESS ;
- Builder : SUCCESS ;
- Save & Quit / reprise : SUCCESS ;
- non-interférence quatre modules : SUCCESS ;
- assets et Equipment : SUCCESS.

## Interdictions respectées

- aucun nouveau wrapper ;
- aucun observer ;
- aucun timer/retry ;
- aucun fallback ;
- aucune correction gameplay mélangée ;
- aucune modification détection ennemie ;
- aucune modification des rafraîchissements UI/Stats ;
- aucun merge sur `main`.

## Checkpoint final prévu

`checkpoint/gensrpg-phase5-gomenu-core01-retirement-green-2026-09-23`.

Ce checkpoint n'est créé qu'après triple CI GREEN du SHA documentaire final exact.
