# GenSrpG — Phase 4 Core Inventory / Equipment — pré-audit cache / invalidation

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-cache-invalidation-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-cache-invalidation-preaudit-2026-09-21`.
- Base exacte :
  `4707fb0ce3a7fa4cad688d81526323b916f80f6b`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-evolution-raccord-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est strictement diagnostic / caractérisation.

Aucune fonction runtime, aucun TTL, aucun invalidateur et aucun cache n'ont été
modifiés.

## Frontières auditées

### Cache évolution Equipment local

Propriétaire :

`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`.

État local :
- `equipmentBonusCache` ;
- `equippedSnapshot`.

TTL commun :

`CACHE_TTL_MS = 120`.

Le snapshot équipé et le bonus évolution utilisent tous deux la même limite
de 120 ms.

### Cache performance final

Propriétaire :

`assets/gensrpg/gens-mobile-combat-performance-16781022.js`.

Le seam final `dungeonEquipmentBonus` est mis en cache en aval du calcul
Equipment.

## Vrais propriétaires de mutation des slots

Les propriétaires inline caractérisés sont :

- `equipRight` ;
- `equipLeft` ;
- `equipTwoHands` ;
- `unequip` ;
- `equipRpgGear` ;
- `unequipRpgGear`.

Ils atteignent tous la frontière historique `save()`.

Le propriétaire Tactical `dc214Equip` constitue un autre chemin de mutation
des mains.

La suppression / réindexation passe par :

`removeInventoryEntry(index)`.

Cette fonction ne persiste pas elle-même via `save()` ; la persistance dépend
de ses appelants.

## Couverture actuelle du cache évolution local

`installCacheInvalidators()` cible actuellement :

- `dungeonEquipItem` ;
- `dungeonUnequipItem` ;
- `equipDungeonItem` ;
- `unequipDungeonItem` ;
- `toggleDungeonEquipment` ;
- `saveEquipmentEditor`.

Intersection avec les six vrais propriétaires inline de slots :

**aucune**.

Le cache évolution local n'invalide pas non plus directement :

- `removeInventoryEntry` ;
- `dc214Equip`.

Conséquence caractérisée :

après une mutation de slot, `equippedSnapshot` et `equipmentBonusCache`
peuvent dépendre uniquement de l'expiration du TTL de 120 ms avant de refléter
la nouvelle vue équipée.

Ce constat est une dette de cohérence temporelle, pas un correctif dans ce lot.

## Mutations explicitement couvertes localement

Le cache local est explicitement invalidé pour les chemins éditeur suivants :

- modification d'évolution via `patchEvolutionFunctions()` ;
- sauvegarde d'une définition de set via `persistSetRaw()` ;
- modification d'appartenance à un set dans le chemin éditeur.

Ces chemins ne présentent donc pas le même trou que les mutations de slots.

## Couverture du cache performance final

Le cache performance final invalide notamment sur :

- `save` ;
- `saveState` ;
- `saveDungeonHeroState` ;
- `dc214Equip`.

Comme les six vrais propriétaires inline de slots appellent `save()`, leur
mutation atteint indirectement l'invalidation du cache performance final.

`dc214Equip` est couvert directement.

Le cache performance est donc mieux aligné avec les vrais propriétaires de
mutation que le cache évolution local.

## Cas removeInventoryEntry

`removeInventoryEntry` ne contient pas directement d'appel à `save()`.

La caractérisation a trouvé 7 callsites runtime :

- 6 présentent une frontière `save()` proche ;
- 1 n'en présente pas dans la fenêtre caractérisée.

Conclusion prudente :

la suppression / réindexation dépend du comportement de l'appelant pour la
persistance et l'invalidation finale ; elle ne doit pas être considérée comme
couverte directement par le propriétaire de suppression.

Le futur correctif doit donc verrouiller explicitement ce cas au lieu de
supposer que tous les appelants sauvegardent.

## Matrice synthétique

| Mutation | Cache évolution local | Cache performance final |
| --- | --- | --- |
| equipRight | TTL seulement | via save |
| equipLeft | TTL seulement | via save |
| equipTwoHands | TTL seulement | via save |
| unequip | TTL seulement | via save |
| equipRpgGear | TTL seulement | via save |
| unequipRpgGear | TTL seulement | via save |
| dc214Equip | TTL seulement | direct |
| removeInventoryEntry | pas direct ; appelant/TTL | pas direct ; appelant |
| édition évolution | explicite | aval selon seam |
| sauvegarde set | explicite | aval selon seam |
| appartenance set | explicite | aval selon seam |

## Frontière minimale pour le lot correctif

Le prochain lot ne doit pas créer un deuxième cache ni un nouveau système de
wrappers.

Il doit partir des vrais propriétaires de mutation et obtenir une invalidation
immédiate du cache évolution local lorsque la vue équipée ou le bonus Equipment
peut changer.

À prouver avant modification :

1. quelle frontière unique existante permet de couvrir les six mutations de
   slots sans multiplier les wrappers ;
2. comment couvrir `dc214Equip` ;
3. comment couvrir `removeInventoryEntry` et sa réindexation sans dépendre
   implicitement de chaque appelant ;
4. comment conserver le TTL 120 ms comme protection de performance, et non
   comme mécanisme principal de cohérence ;
5. comment garder le cache performance final inchangé.

## TDD

Sentinelle :

`tests/gens_phase4_inventory_equipment_cache_invalidation_preaudit_v1.test.cjs`.

Elle verrouille :
- vrais propriétaires de slots ;
- liste réelle des invalidateurs locaux ;
- absence de couverture directe des vrais propriétaires ;
- TTL 120 ms du snapshot et du cache évolution ;
- couverture `save` / `dc214Equip` du cache performance ;
- frontière spéciale de `removeInventoryEntry` ;
- invalidations éditeur explicites ;
- absence de changement runtime.

## Validation technique

HEAD technique :

`ca7107759bda94ac4fd780def075024ee490320c`.

- Architecture statique : run `35632915312` — SUCCESS ;
- navigateur complet : premier passage en échec sur le scénario Dungeon après
  Survie, puis rerun du job sur le **même SHA sans modification** — SUCCESS ;
- Firefox : `35632915398` — SUCCESS ;
- Tactical Dock : `35632915285` — SUCCESS.

Aucune rustine n'a été ajoutée pour le rerun navigateur.

## Périmètre respecté

Le diff depuis la base contient uniquement :

- `docs/GENSRPG_CURRENT_WORK.md` ;
- la sentinelle de pré-audit ;
- son entrée CI.

Aucun fichier runtime n'a été modifié.

## Sortie du lot

La présente documentation change le SHA.

Conformément à la charte :

1. relancer Architecture + navigateur, Firefox et Tactical sur le SHA
   documentaire exact ;
2. créer le checkpoint GREEN du pré-audit uniquement si les trois batteries
   passent ;
3. ouvrir ensuite une nouvelle branche pour un correctif d'invalidation
   minimal, précédé d'un RED ;
4. ne pas modifier `main`.
