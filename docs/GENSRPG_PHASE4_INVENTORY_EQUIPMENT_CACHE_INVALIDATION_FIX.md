# GenSrpG — Phase 4 Core Inventory / Equipment — correctif cache / invalidation

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-cache-invalidation-fix-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-cache-invalidation-fix-2026-09-21`.
- Base exacte :
  `70c679a8079094dd410a37b875ace6c47e6708c4`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-cache-invalidation-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## But du lot

Corriger la cohérence du cache Equipment sans créer un deuxième système
d'invalidation, sans modifier les propriétaires inline equip/unequip, et sans
changer le TTL de 120 ms.

Le pré-audit avait prouvé que les invalidateurs locaux historiques visaient des
noms qui ne sont pas les vrais propriétaires de mutation des slots.

## Frontière canonique retenue

Le propriétaire d'invalidation déjà existant dans :

`assets/gensrpg/gens-mobile-combat-performance-16781022.js`

reste l'unique wrapper canonique des frontières de mutation concernées.

Frontières Equipment classées :

- `save` ;
- `dc214Equip` ;
- `removeInventoryEntry`.

Le wrapper performance continue à invalider ses propres caches via `clear()`.

Après exécution de la mutation réelle, lorsqu'il s'agit d'une frontière
Equipment, il appelle désormais l'API locale existante :

`GensEquipmentStatCleanup1678102.invalidateEquipmentBonusCache()`.

Cette API vide :
- `equipmentBonusCache` ;
- `equippedSnapshot`.

Aucun nouveau cache n'est créé.

## Couverture obtenue

Les six vrais propriétaires inline :

- `equipRight` ;
- `equipLeft` ;
- `equipTwoHands` ;
- `unequip` ;
- `equipRpgGear` ;
- `unequipRpgGear`

atteignent déjà `save()`.

Ils bénéficient donc maintenant d'une invalidation immédiate du cache Equipment
local via le propriétaire performance existant.

`dc214Equip` est couvert directement.

`removeInventoryEntry` est désormais couvert directement, ce qui ne dépend
plus de la présence d'un `save()` chez son appelant pour invalider les caches.

La question de persistance propre à `removeInventoryEntry` reste séparée :
ce correctif porte sur l'invalidation, pas sur la sauvegarde.

## Retrait de dette locale

Dans :

`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`

`installCacheInvalidators()` ne tente plus de wrapper les anciens noms :

- `dungeonEquipItem` ;
- `dungeonUnequipItem` ;
- `equipDungeonItem` ;
- `unequipDungeonItem` ;
- `toggleDungeonEquipment`.

Ces cibles ne correspondaient pas aux vrais propriétaires caractérisés.

Le chemin spécifique :

`saveEquipmentEditor`

reste local, car il constitue une vraie frontière éditeur déjà possédée par ce
module.

## Pas de double wrapper

Le lot n'ajoute aucun wrapper local sur :

- `save` ;
- `dc214Equip` ;
- `removeInventoryEntry`.

Ces fonctions restent wrappées une seule fois par le propriétaire performance
existant.

Le marqueur historique du wrapper performance reste :

`__gensMobileCombat1022Invalidator`.

Le lien `__original` reste conservé.

## TDD

Sentinelle :

`tests/gens_phase4_inventory_equipment_cache_invalidation_fix_v1.test.cjs`.

RED initial :

- CI Architecture : `35637289338` — FAILURE attendu ;
- erreur exacte :
  `local Equipment cache must invalidate at canonical mutation boundary save`.

RED suivant après durcissement :

- Architecture : `35637662040` — FAILURE attendu ;
- erreur exacte :
  `dead local cache invalidator target must be retired: dungeonEquipItem`.

Après retrait des cibles mortes, le pré-audit historique a volontairement
échoué car son état attendu était devenu obsolète ; il a ensuite été réaligné
sur la nouvelle autorité.

La sentinelle finale exécute en VM les trois frontières canoniques et prouve,
pour chacune :

1. mutation réelle exécutée exactement une fois ;
2. cache performance invalidé ;
3. cache Equipment local invalidé ;
4. valeur de retour préservée ;
5. même identité de wrapper performance ;
6. absence de second wrapper canonique.

## Validation technique

HEAD technique :

`4efaf9de71091d0b44fc9410525f521a54a6590f`.

Runs :

- Architecture + navigateur complet :
  `35638123573` — SUCCESS ;
- Firefox :
  `35638123814` — SUCCESS ;
- Tactical Dock :
  `35638123988` — SUCCESS.

## Périmètre respecté

Aucun changement de :

- `index.html` ;
- fonctions inline equip/unequip ;
- TTL 120 ms ;
- calcul direct + sets ;
- calcul évolution ;
- stockage ;
- UI / Builders ;
- combat ;
- Stats / Tactical ;
- composition Pages ;
- graphe runtime.

Aucun nouvel observer, timer/retry, cache ou système de wrappers.

## Résultat architectural

Avant :
- cache performance correctement invalidé sur les vraies frontières ;
- cache Equipment local potentiellement périmé jusqu'à 120 ms ;
- plusieurs noms d'invalidateurs locaux morts.

Après :
- mêmes frontières canoniques performance ;
- invalidation Equipment locale immédiate sur ces frontières ;
- suppression des cibles locales mortes ;
- un seul propriétaire de wrapper pour les mutations canoniques.

## Sortie du lot

La présente documentation change le SHA.

Conformément à la charte :

1. valider Architecture + navigateur, Firefox et Tactical sur le SHA
   documentaire exact ;
2. créer le checkpoint GREEN final uniquement après les trois SUCCESS ;
3. reprendre ensuite le prochain micro-lot Inventory / Equipment depuis ce
   checkpoint ;
4. ne jamais fusionner directement sur `main`.
