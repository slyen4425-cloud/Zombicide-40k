# GenSrpG — Phase 5 / pré-audit goMenu Core 0.01 restant

Date : 2026-09-23

## Base

- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-core023-retirement-green-2026-09-23` ;
- SHA de base :
  `17ff591bb5509496a7b417d5ee16a3c099a539f4` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core01-preaudit-2026-09-23` ;
- branche :
  `work/gensrpg-phase5-gomenu-core01-preaudit-2026-09-23` ;
- runtime exact :
  taille `8171186`, blob `c2424bada56517e579ffe65fa147facbb6bf2caf` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime, gameplay, asset ou règle n'est modifié dans ce pré-audit.

## Objet

Après retrait GREEN de l'interception `goMenu` de Core 0.23, la chaîne active
restante est :

1. `captureFix139` ;
2. `gensDungeonCore01Js` ;
3. `dungeonCore200Rebuild`.

Le présent lot détermine si l'interception `goMenu` historique de
`gensDungeonCore01Js` possède encore une autorité réelle.

## Constat source

### Core 0.01 / gensDungeonCore01Js

Le bloc possède un état privé :

`let coreActive=false`.

Cet état ne devient vrai que dans son ancien `show()`.

Son ancien `start()` termine par `return show()`.

Son interception `goMenu` ne reprend l'écran que si :

`coreActive && eligible()`.

### Core 2.00

`dungeonCore200Rebuild` :

- remplace l'objet public `window.DungeonCore01` ;
- possède son propre état `active200` ;
- intercepte le lancement Dungeon courant dans `startConfiguredGame` avant
  délégation vers les propriétaires plus anciens ;
- possède l'interception finale `goMenu` lorsque `active200` est vrai ;
- conserve une référence locale à l'ancien objet au moment du remplacement,
  mais ne l'utilise plus après ce remplacement.

Conséquence candidate :
le `start()` historique Core 0.01 ne devrait plus être traversé par un lancement
Dungeon actuel, donc son `coreActive` privé devrait rester faux.

Ce point doit être prouvé dans un vrai navigateur avant tout retrait.

## Sentinelle E2E

`tests/gens_phase5_gomenu_core01_preaudit_e2e_v1.test.cjs`.

Scénario décisif :

1. lancement réel Dungeon ;
2. vrai Save & Quit ;
3. vrai switch vers Survie ;
4. retour par le Shell au profil Dungeon sans cliquer Reprendre/Nouvelle partie ;
5. vérifier que Core 2.00 reste inactif et que la sauvegarde Dungeon persiste ;
6. appeler la frontière globale `goMenu`.

À ce moment :
- le profil actif est réellement Dungeon ;
- Core 2.00 doit déléguer car `active200 === false` ;
- Capture doit déléguer car ce n'est pas Capture.

Si l'ancien `coreActive` Core 0.01 avait été activé par le lancement réel,
son vieux `goMenu` satisferait alors `coreActive && eligible()` et
réafficherait la map Dungeon.

La preuve attendue est donc :
- map Dungeon reste masquée ;
- `DungeonCore01.active` reste faux ;
- runtime Dungeon resumable toujours présent ;
- aucune erreur navigateur.

## Périmètre

Autorisé dans ce lot :
- tests ;
- documentation ;
- cartographie de l'autorité `goMenu`.

Interdit :
- aucun retrait runtime avant GREEN du pré-audit ;
- aucun changement Capture ;
- aucun changement Core 2.00 ;
- aucun changement de détection ennemie ;
- aucun traitement des rafraîchissements UI ;
- aucun wrapper, observer, timer ou retry ;
- aucun merge sur `main`.

## Étape suivante

Si la caractérisation est GREEN et confirme l'inertie du vieux `coreActive`,
ouvrir un micro-lot TDD séparé pour exiger le retrait de **la seule**
affectation `window.goMenu` de `gensDungeonCore01Js`.

Les autres responsabilités de ce bloc, notamment son ancienne implémentation
Dungeon et `closeGameCustomization`, restent hors périmètre jusqu'à audit
spécifique.


## Conclusion GREEN

SHA technique validé :
`2ec907067b0723fd4447f43ba8dcba11e390095a`.

Validation :
- Architecture + navigateur complet `35872003882` — SUCCESS ;
- Firefox `35872003797` — SUCCESS ;
- Tactical Dock `35872003759` — SUCCESS.

Une première exécution a produit un faux RED avant lancement navigateur à cause
d'une regex sur-échappée dans la nouvelle sentinelle. La syntaxe du test a été
corrigée sans aucun changement runtime.

La caractérisation E2E finale prouve :
- vrai lancement Dungeon moderne ;
- vrai Save & Quit ;
- vrai switch vers Survie ;
- retour Shell au profil Dungeon sans Resume/Nouvelle partie ;
- profil réellement Dungeon et runtime resumable toujours présent ;
- Core 2.00 reste inactif ;
- l'appel `goMenu` ne réaffiche pas la map Dungeon.

Conclusion architecturale :
l'état privé `coreActive` de `gensDungeonCore01Js` reste inert sur le chemin
moderne protégé. Son interception globale `window.goMenu` est donc un candidat
de retrait soustractif.

Prochain micro-lot autorisé après checkpoint GREEN :
TDD de retrait **uniquement** de :
- `const oldGo=window.goMenu` ;
- `window.goMenu=function(){...}`
dans `gensDungeonCore01Js`.

Toutes les autres responsabilités de `gensDungeonCore01Js` restent hors
périmètre, notamment `startConfiguredGame`, `closeGameCustomization` et son
ancienne implémentation Dungeon.

Checkpoint cible :
`checkpoint/gensrpg-phase5-gomenu-core01-preaudit-green-2026-09-23`.
