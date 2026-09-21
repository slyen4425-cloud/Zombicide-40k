# GenSrpG — Phase 4 Core Inventory — raccord Equipped View runtime

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipped-view-raccord-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipped-view-raccord-2026-09-21`.
- Base exacte :
  `db9d9d7de9dcd220920dcf99da032641940ea016`.
- Dernier checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipped-view-slot-refs-contract-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet du lot

Raccorder le contrat pur :

`assets/gensrpg/core/inventory-equipped-view-v1.js`

au propriétaire runtime existant de la vue équipée Dungeon :

`assets/dungeon/dungeon-equipment-hotfix-167817.js`.

Le lot ne crée aucun nouveau wrapper et ne modifie pas le gros `index.html`.

## Autorité après raccord

Le hotfix Equipment reste le dernier propriétaire de :

`window.dungeonEquippedItems`.

Il devient l'adaptateur explicite vers :

`GensInventoryEquippedViewV1.equippedItems(...)`.

Entrées transmises au Core :

- `state.inventory` ;
- `state.rightHand` ;
- `state.leftHand` ;
- `state.rpgGear` ;
- resolver existant `getItemFromEntry`, avec fallback `itemById`.

Le propriétaire inline historique `dungeonEquippedItems()`, dont le résultat
était dépendant de `isDungeonHeroSheet()`, n'est plus exécuté pour construire
la vue équipée.

Hors mode Dungeon, l'adaptateur conserve une vue vide.

## Composition runtime

Le service Core est désormais connecté :

1. GitHub Pages charge
   `inventory-equipped-view-v1.js`
   avant
   `dungeon-equipment-hotfix-167817.js` ;
2. `preview.html` reproduit le même ordre ;
3. le Service Worker précache le service ;
4. la cartographie Phase 2 classe le module en **Phase 4 connected**.

Conséquence descriptive du raccord :

- modules injectés Pages : 26 -> 27 ;
- fichiers JS production-reachable : 73 -> 74.

Les sentinelles Phase 2 dépendant de ces cardinalités ont été réalignées sans
modifier leur logique fonctionnelle.

## TDD

RED initial attendu :

- run Architecture `35614287484` ;
- cause : le module Core existait mais n'était pas encore présent dans la
  composition Pages.

Après raccord, les RED intermédiaires étaient exclusivement des empreintes de
cartographie devenues obsolètes :

- nombre de modules Pages ;
- taille du graphe runtime ;
- manifeste des propriétaires ;
- inventaire effets globaux / stockage ;
- classification timers ;
- fichiers hors graphe ;
- structure Phase 3 ;
- composition navigateur Capture / preview.

Aucun de ces RED n'a nécessité une modification de gameplay.

## Validation technique

HEAD technique validé :

`9f389c9dfef4458b216eca060358b041d069662a`.

Runs :

- Architecture + navigateur complet : `35617874824` — SUCCESS ;
- Firefox : `35617874802` — SUCCESS ;
- Tactical Dock : `35617874784` — SUCCESS.

Le navigateur complet a notamment conservé GREEN :

- Survie ;
- Fouiller / arts Survie ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet moderne ;
- isolation fiche RPG / Survie ;
- caches / retour / pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Capture courant ;
- Capture en composition complète ;
- non-interférence quatre modules ;
- murs Tactical ;
- preview ;
- resolver d'assets.

## Périmètre non modifié

Le lot ne change pas :

- `index.html` ;
- equip / unequip ;
- suppression / drop ;
- références de slots ;
- `dungeonEquipmentBonus` ;
- sets ;
- évolution ;
- caches / invalidation ;
- Stats ;
- Tactical ;
- stockage ;
- règles combat ou loot.

## Décision de sortie

Le raccord est techniquement GREEN.

La présente clôture documentaire change le SHA. Conformément à la charte :

1. relancer Architecture + navigateur, Firefox et Tactical Dock sur le SHA
   documentaire exact ;
2. créer le checkpoint GREEN uniquement si les trois batteries restent SUCCESS ;
3. ensuite ouvrir un nouveau micro-lot Inventory / Equipment depuis ce checkpoint ;
4. ne jamais fusionner ce lot directement sur `main`.

Le prochain micro-lot doit suivre le pré-audit : **bonus directs + sets purs**,
avant tout raccord de `dungeonEquipmentBonus`.
