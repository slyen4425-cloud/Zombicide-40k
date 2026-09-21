# GenSrpG — Phase 4 Core Inventory — Equipped View / Slot Refs — contrat pur

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipped-view-slot-refs-contract-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipped-view-slot-refs-contract-2026-09-21`.
- Base exacte :
  `e61638fa504d0050f80fbfd1b3a7192f797a986f`.
- Dernier GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-sets-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet du micro-lot

Extraire un premier contrat **pur et inert** pour la future famille Core
Inventory, sans raccord runtime.

Le périmètre est limité à :

1. normalisation de références de slots par index ;
2. vue dédupliquée des indices équipés ;
3. résolution des items équipés par resolver explicite ;
4. réindexation déterministe des références après suppression.

Aucun stockage, DOM, combat, Stats, sets, évolution ou cache n'est déplacé.

## Source historique caractérisée

Le test exécute les propriétaires inline du blob exact :

`5b9b9ae780f735eadef049afeb10acf0b57441fe`
— 8 174 580 octets.

Propriétaires observés :

- `dungeonEquippedItems()` ;
- `getEntry()` ;
- `getItemFromEntry()` ;
- `clearIndexFromHands()` ;
- `removeInventoryEntry()` ;
- wrapper tardif Core 1.05 de `removeInventoryEntry`.

## Contrat Core créé

Fichier :

`assets/gensrpg/core/inventory-equipped-view-v1.js`.

API :

- `normalizeRef(value, length)` ;
- `normalizeGear(value, length)` ;
- `normalizeRefs(config)` ;
- `equippedIndices(config)` ;
- `equippedItems(config)` ;
- `reindexRefAfterRemoval(value, removedIndex)` ;
- `reindexRefsAfterRemoval(config, removedIndex)`.

Global exporté :

`GensInventoryEquippedViewV1`.

Version :

`1.0.0`.

## Sémantique verrouillée

### Vue équipée

Ordre canonique :

1. main droite ;
2. main gauche ;
3. slots `rpgGear` dans leur ordre d'énumération.

Les références répétées sont dédupliquées **par index**, comme le propriétaire
historique.

Cas verrouillés :

- arme deux mains : même index dans droite/gauche -> un seul item ;
- même index présent aussi dans `rpgGear` -> un seul item ;
- refs nulles, négatives, non entières ou hors inventaire -> ignorées ;
- resolver d'item fourni explicitement par l'appelant ;
- aucune dépendance au catalogue global.

### Suppression / réindexation

Contrat pur :

- ref égale à l'index supprimé -> `null` ;
- ref supérieure -> décrémentée de 1 ;
- ref inférieure -> inchangée ;
- même logique pour droite/gauche/equipment et tous les slots `rpgGear`.

La sentinelle compare cette sortie au chemin historique combiné :

`clearIndexFromHands(index)`
→ wrapper Core 1.05 `removeInventoryEntry(index)`
→ propriétaire inline d'origine.

## Dette volontairement hors lot

Le lot ne corrige pas :

- `dropItem` et ses propres réindexations inline ;
- les chemins de consommables qui splicent directement ;
- le gap d'invalidation des caches Equipment ;
- la garde `isDungeonHeroSheet` du propriétaire historique ;
- les wrappers UI/éditeur ;
- les sets ;
- l'évolution ;
- `dungeonEquipmentBonus`.

Ces éléments restent documentés dans
`GENSRPG_PHASE4_INVENTORY_EQUIPMENT_SETS_PREAUDIT.md`.

## Inertie architecturale

Le module n'est chargé par :

- ni GitHub Pages ;
- ni `preview.html` ;
- ni RuntimeBootstrap ;
- ni Service Worker.

La cartographie Phase 2 le classe explicitement comme **Phase 4 inert**.

Le graphe production-reachable reste à 73 fichiers.

L'inventaire JS physique passe de 90 à 91 fichiers, avec 11 services Phase 4
connus dont ce nouveau module inert.

## Interdictions respectées

Le module ne contient aucun accès à :

- DOM ;
- localStorage/sessionStorage ;
- timers ;
- MutationObserver ;
- Stats ;
- Tactical ;
- `dungeonEquipmentBonus`.

Aucun fichier gameplay/runtime historique n'a été modifié.

`index.html` est inchangé.

## TDD

1. la première sentinelle a eu deux erreurs de syntaxe de fixture, corrigées
   uniquement dans le test ;
2. vrai RED obtenu sur le run Architecture `35612350523` :
   `Core Inventory equipped-view contract module must exist` ;
3. module pur créé ;
4. premier run post-module a détecté le nouveau fichier non classé dans la
   cartographie Phase 2 ;
5. le fichier a été classé explicitement **Phase 4 inert** ;
6. la sentinelle pure et toute la batterie Architecture ont ensuite passé.

## Validation technique

SHA technique :

`82af680ee15bafc6b9195266270d9d96d5049e0f`.

Runs exacts :

- Architecture + navigateur complet : `35612621576` — SUCCESS ;
- Firefox : `35612621700` — SUCCESS ;
- Tactical Dock : `35612621668` — SUCCESS.

## Décision de sortie

Le contrat pur est suffisamment isolé pour devenir la base du prochain
micro-lot.

Le prochain lot recommandé est **un raccord séparé au propriétaire runtime de
la vue équipée / refs de slots**, avec parité avant remplacement.

Il ne devra pas encore absorber :

- stockage ;
- mutation equip/unequip ;
- sets ;
- évolution ;
- cache ;
- UI.

## Clôture candidate

Le commit documentaire final change le SHA.

Conformément à la charte, le checkpoint GREEN ne sera créé qu'après SUCCESS des
trois batteries sur ce SHA exact.
