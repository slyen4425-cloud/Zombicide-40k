# GenSrpG — Phase 4 Core Inventory / Equipment — raccord dungeonEquipmentBonus

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-bonus-raccord-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-bonus-raccord-2026-09-21`.
- Base exacte :
  `b7e3df8547cfbe6e9609589219dd08b17ada50ea`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-bonus-sets-contract-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet du lot

Raccorder le calcul Equipment **bonus directs + sets** au service pur :

`assets/gensrpg/core/equipment-bonus-sets-v1.js`

sans déplacer ni réécrire les couches suivantes :

- évolution ;
- cache performance ;
- consommation par Core Stats S5.

## Autorité runtime

Le propriétaire runtime existant reste :

`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`

via son wrapper déjà existant sur :

`window.dungeonEquipmentBonus`.

Aucun nouveau wrapper n'est ajouté.

Le propriétaire existant devient l'adaptateur vers :

`GensEquipmentBonusSetsV1.totalBonus(items, key, registry)`.

Entrées explicites :

- vue équipée via `equippedItemsCached()` ;
- clé de bonus ;
- `window.DUNGEON_EQUIPMENT_SETS`.

Ensuite, le même propriétaire continue d'ajouter :

`cachedEvolutionBonus(key)`.

La couche performance reste en aval via :

`gens-mobile-combat-performance-16781022.js`

et Core Stats continue à consommer le seam final :

`dungeonEquipmentBonus`.

## Ordre des couches conservé

1. Core Equipment : direct + sets ;
2. évolution existante ;
3. cache performance existant ;
4. Core Stats S5.

L'ancien calcul direct + sets capturé par le wrapper n'est plus exécuté.

Le lien historique `w.__original = old` reste présent uniquement pour la
traçabilité du wrapper existant.

## Composition runtime

Le service Core est désormais connecté :

- GitHub Pages le charge ;
- `preview.html` reproduit le même chargement ;
- le Service Worker le précache ;
- le graphe Phase 2 le classe **connected** ;
- le manifeste des propriétaires lui attribue l'autorité Core Equipment Bonus Sets.

Conséquences descriptives :

- modules Pages injectés : 27 -> 28 ;
- entrées JS directes production uniques : 30 -> 31 ;
- graphe production : 74 -> 75 fichiers atteignables ;
- inventaire physique : 92 JS, inchangé.

## TDD

RED initial attendu :

- run Architecture `35623564733` ;
- échec exact :
  `Pages must publish the Core Equipment bonus + sets service`.

Après raccord, les RED intermédiaires ont été structurels :

- manifeste owner encore à 74 ;
- autres cartographies de reachability encore à 74 ;
- compositions navigateur encore à 27 modules ;
- pré-audit Inventory encore calé sur l'ancien `old.apply(...)` ;
- audit VM Stats demandant la dépendance explicite
  `stats-normalization-v1.js` dans la nouvelle fixture.

Ces corrections ont porté uniquement sur les tests/manifeste/cartographies.

## Validation d'exécution

La sentinelle de raccord exécute le propriétaire actif en VM et verrouille :

- bonus directs : 3 ;
- bonus de set : 3 ;
- évolution : 4 ;
- résultat final : 10 ;
- appels au calcul historique direct + sets : 0.

Elle vérifie également :

- conservation du marqueur `__canon102` ;
- marqueur `__coreEquipmentBonusSetsV1` ;
- cache performance toujours en aval ;
- Core Stats toujours consommateur du seam final.

## Validation technique

HEAD technique :

`b1ad914f2dfe403a10de93fd9323aaf70ad2fe73`.

Runs :

- Architecture + navigateur complet : `35624628763` — SUCCESS ;
- Firefox : `35624628545` — SUCCESS ;
- Tactical Dock : `35624628686` — SUCCESS.

## Périmètre non modifié

Aucun changement de :

- `index.html` ;
- refs de slots ;
- equip / unequip / remove / drop ;
- moteur d'évolution ;
- logique du cache performance ;
- invalidation cache ;
- stockage ;
- UI / Builders ;
- combat / capacités objets ;
- Core Stats ;
- Tactical.

Aucun nouvel observer, timer/retry ou monkey-patch n'a été ajouté.

## Décision de sortie

Le raccord est techniquement GREEN.

La présente documentation change le SHA. Conformément à la charte :

1. relancer Architecture + navigateur, Firefox et Tactical Dock sur le SHA
   documentaire exact ;
2. créer le checkpoint GREEN uniquement si les trois batteries restent SUCCESS ;
3. ouvrir ensuite un lot distinct pour la suite Inventory/Equipment ;
4. évolution et cache restent des responsabilités séparées ;
5. ne jamais fusionner directement sur `main`.
