# GenSrpG — Phase 4 Core Inventory / Equipment / Sets — audit de sortie

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-exit-audit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-exit-audit-2026-09-21`.
- Base exacte :
  `669a8b2ef1caeba2d75a97000b4716877e9e5fc9`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Cet audit est documentaire / sentinelle uniquement.
Aucun runtime n'est modifié.

## 1. Contrats Core maintenant présents

Trois services purs et connectés couvrent le moteur commun prévu par le
pré-audit initial.

### Equipped View / Slot Refs

`assets/gensrpg/core/inventory-equipped-view-v1.js`

Possède :
- normalisation des références de slots ;
- vue dédupliquée des indices équipés ;
- résolution des objets équipés ;
- réindexation déterministe après suppression.

Le propriétaire runtime historique
`dungeon-equipment-hotfix-167817.js` adapte explicitement l'état héros vers
`GensInventoryEquippedViewV1.equippedItems(...)`.

Le calcul historique conditionné par la fiche Dungeon n'est plus l'autorité de
construction de la vue équipée.

### Bonus directs + sets

`assets/gensrpg/core/equipment-bonus-sets-v1.js`

Possède :
- bonus directs ;
- état des sets ;
- paliers actifs ;
- bonus de sets ;
- total direct + sets.

Le propriétaire runtime
`gens-equipment-stat-cleanup-1678102.js` appelle
`GensEquipmentBonusSetsV1.totalBonus(...)`.

L'ancien calcul direct + sets capturé dans la chaîne `__original` n'est plus
exécuté pour le résultat actif.

### Évolution Equipment

`assets/gensrpg/core/equipment-evolution-v1.js`

Possède :
- bonus d'un item selon XP ;
- total d'évolution sur les objets équipés.

Le cache runtime délègue les cache misses à
`GensEquipmentEvolutionV1.totalBonus(...)`.

Le helper historique local `evolutionBonusForItem(...)` reste exporté comme
compatibilité/caractérisation, mais n'est plus consommé par le chemin actif du
cache.

## 2. Cache / invalidation

La frontière d'invalidation Equipment est raccordée au propriétaire performance
existant.

Les mutations canoniques :
- `save` ;
- `dc214Equip` ;
- `removeInventoryEntry`

passent par le wrapper performance existant, qui invalide aussi le cache local
Equipment via
`GensEquipmentStatCleanup1678102.invalidateEquipmentBonusCache()`.

Aucun second système d'invalidation commun n'a été créé.

## 3. Fallbacks / doubles autorités retirés

Le fallback local de calcul de set dans
`dungeon-equipment-ui.js` a été retiré.

L'UI consomme désormais uniquement le seam set-state historique/canonique déjà
raccordé au moteur Core.

La garde `hasWrapFlag(...)` de Hero Editor empêche également le retry de
réintroduire une deuxième couche `__canon101` lorsqu'un propriétaire identique
existe déjà dans la chaîne `__original`.

## 4. Dettes encore actives mais hors moteur commun Core

Les éléments suivants restent actifs :

### Equipment UI
`assets/dungeon/dungeon-equipment-ui.js`
- listener `change` document ;
- `MutationObserver` global sur le DOM ;
- wrapper de `renderDungeonGear` ;
- refresh RAF / timeout.

### Set Editor
`assets/dungeon/dungeon-set-editor-167818.js`
- listeners document ;
- writer de définitions de sets ;
- writer d'appartenance des objets ;
- wrappers open/save Equipment.

### Equipment Cleanup
`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`
- UI canonique évolution/set ;
- persistence de définitions de set via l'éditeur canonique ;
- invalidation spécifique `saveEquipmentEditor` ;
- décoration différée / bootstrap.

### Equipment Hotfix / Hero Editor
Ils conservent encore leurs responsabilités d'éditeur et de compatibilité
associées à open/save Equipment.

Ces éléments ne sont pas des moteurs communs Inventory/Equipment à déplacer dans
Core. Le pré-audit initial les avait explicitement laissés au
runtime adapter / Builders / UI.

Ils restent donc une dette architecturale à traiter plus tard, propriétaire par
propriétaire, lors du nettoyage Builders/UI/Shell. Ils ne justifient pas de
maintenir ouvert le sous-chantier Core Inventory/Equipment.

## 5. Critère de sortie Phase 4.4

Le but de la roadmap pour Inventory / Equipment / Sets était :
- séparer le modèle commun des éditeurs Builders et règles Dungeon ;
- conserver bonus/sets/cache sans double calcul.

État obtenu :
- modèle commun Equipped View : Core pur + raccord ;
- bonus directs + sets : Core pur + raccord ;
- évolution : Core pur + raccord ;
- cache/invalidation : frontières uniques ;
- fallback set-state concurrent : retiré ;
- duplication de wrapper retry : corrigée ;
- UI/Builders restent hors Core.

Aucune responsabilité de moteur commun identifiée dans le pré-audit ne nécessite
un micro-lot Core supplémentaire avant la suite de la roadmap.

## 6. Décision

Sous réserve des trois batteries finales sur le SHA documentaire exact :

**Phase 4.4 — Inventory / Equipment / Sets peut être déclarée GREEN et close.**

Le prochain lot doit être un **pré-audit Phase 4.5 — Dés**, sans extraction
immédiate.

Propriétaires connus à caractériser avant tout changement :
- `gens-mobile-combat-performance-16781022.js` :
  génération/animation/performance D6/D100 ;
- `gens-rpg-tactical-visual-dice-16781142.js` :
  résolution visible Tactical ;
- inline `dungeonCore073RpDice` :
  D100/RP Dungeon.

Le pré-audit Dés devra d'abord séparer :
1. génération aléatoire ;
2. résultat déterminé ;
3. animation/FX ;
4. intégration Tactical ;
5. intégration Dungeon/RP ;
6. explications et règles de succès.

Aucun `dice-v1.js` Core ne doit être créé avant cette cartographie.

## Sentinelle

`tests/gens_phase4_inventory_equipment_exit_audit_v1.test.cjs`

Elle verrouille :
- présence et ordre des trois services Core ;
- raccord réel des propriétaires runtime ;
- absence de fallback set-state UI ;
- garde de chaîne wrapper ;
- classification des dettes restantes comme UI/Builders ;
- absence de service Core Dice prématuré ;
- ordre roadmap Inventory -> Dés.

## Checkpoint cible

Après SUCCESS de :
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;

sur le SHA documentaire exact, créer :

`checkpoint/gensrpg-phase4-inventory-equipment-exit-audit-green-2026-09-21`.

Ensuite ouvrir séparément :
- checkpoint de départ Phase 4.5 Dés ;
- branche de pré-audit Dés ;
- aucun changement runtime tant que la cartographie n'est pas complète.
