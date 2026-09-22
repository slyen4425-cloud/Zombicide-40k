# GenSrpG — Phase 4 Core Inventory / Equipment — audit de clôture

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-closure-audit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-closure-audit-2026-09-22`.
- Base exacte :
  `669a8b2ef1caeba2d75a97000b4716877e9e5fc9`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est strictement diagnostic. Aucun runtime n'est modifié.

## Source index vérifiée

Le fichier utilisateur `index_work_9.zip` contient un unique fichier
`index_work9.txt`, dont le contenu est bien le document HTML source complet.

Vérification :

- taille : `8 174 580` octets ;
- blob Git : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Il correspond exactement au `index.html` du checkpoint GREEN de départ.
Aucun nouveau transfert du gros fichier n'est nécessaire pour cet audit.

## Services Core déjà raccordés

Le sous-chantier a réellement extrait et raccordé :

1. `GensInventoryEquippedViewV1.equippedItems()` pour la vue équipée ;
2. `GensEquipmentBonusSetsV1.totalBonus()` pour bonus directs + sets dans
   `dungeonEquipmentBonus` ;
3. `GensEquipmentEvolutionV1.totalBonus()` pour le calcul pur d'évolution ;
4. les frontières canoniques d'invalidation cache ;
5. le fallback local de calcul de set Equipment UI ;
6. le hook Equipment non propriétaire de Hero Art Repair ;
7. la duplication de wrapper Hero Editor due au retry.

Ces parties ne doivent pas être rouvertes.

## Reliquat commun n°1 — réindexation des références de slots

Le contrat pur
`GensInventoryEquippedViewV1.reindexRefsAfterRemoval()`
existe depuis le lot Slot Refs.

Cependant le raccord runtime précédent n'a raccordé que la **vue équipée**.

Le blob source vérifié contient encore deux algorithmes actifs manuels :

### Core 0.62 / removeInventoryEntry

Le wrapper tardif `window.removeInventoryEntry` recalcule lui-même tous les
indices `rpgGear` après suppression.

Le propriétaire inline d'origine recalcule déjà :
- `rightHand` ;
- `leftHand` ;
- `equipment`.

Le résultat combiné est équivalent au contrat Core, mais l'autorité reste
dupliquée dans le runtime historique.

### Consommables combat / removeItem61

`removeItem61(st, idx)` splice directement `st.inventory` puis recalcule
manuellement :
- `rightHand` ;
- `leftHand` ;
- `equipment` ;
- tous les slots `rpgGear`.

Ce chemin ne passe pas par `removeInventoryEntry`.

### Décision

Inventory/Equipment ne peut pas être déclaré clos tant que ces réindexations
communes n'utilisent pas le contrat Core déjà créé.

**Prochain micro-lot prioritaire : raccord runtime Slot Refs après suppression.**

Ce lot devra être séparé et TDD. Il devra préserver :
- ordre du splice ;
- références nulles ;
- décrément des indices supérieurs ;
- suppression de la ref exactement égale ;
- comportement des consommables combat ;
- persistance et rendu existants.

Il ne devra pas déplacer le stockage, le DOM, les effets de consommables ou le
combat vers Core.

## Reliquat commun n°2 — moteur set-state encore dans Dungeon Core 3.16

`assets/dungeon/dungeon-core-316.js` contient toujours :

- `setState316(items, registry)` ;
- `dungeonSetStateFromItems316` ;
- `dungeonSetBonusFromItems316` ;
- `dungeonSetBonusTotal`.

Or `GensEquipmentBonusSetsV1.setState()` possède déjà la même responsabilité
pure.

L'Equipment UI n'a plus de fallback local, mais consomme toujours le seam
`dungeonSetStateFromItems316`.

Cette dette devra être traitée dans un lot distinct **après** le raccord Slot
Refs, afin que Core 3.16 conserve seulement ses responsabilités Dungeon
catalogue/objets/combat et ne reste pas propriétaire d'un moteur Equipment
commun.

## Fonctions inline qui ne bloquent pas à elles seules la sortie Core

Le blob contient toujours :
- `loadCustomEquipment` / `saveCustomEquipment` ;
- `dungeonItems` ;
- `openEquipmentEditor` / `saveEquipmentEditor` ;
- equip/unequip et rendu.

Elles relèvent actuellement d'adapters runtime, stockage, catalogue Dungeon,
UI/Builders ou mutation d'état. Elles ne doivent pas être copiées en bloc vers
Core Inventory.

Leur nettoyage appartient aux propriétaires et phases correspondants.

## Décision de clôture

**Phase 4 Inventory / Equipment n'est pas encore clôturable.**

Ordre de sortie retenu :

1. raccord Core Slot Refs sur les suppressions réelles ;
2. raccord du seam Set State vers `GensEquipmentBonusSetsV1.setState()` ;
3. nouvel audit de clôture ;
4. si aucun moteur commun actif ne reste hors Core, checkpoint de sortie
   Inventory/Equipment ;
5. seulement ensuite passer au point 5 de la roadmap Phase 4 : **Dés**.

## Sentinelle

`tests/gens_phase4_inventory_equipment_closure_audit_v1.test.cjs`

Elle verrouille :
- blob index exact ;
- services Core déjà raccordés ;
- absence de retour du fallback Set UI ;
- réindexations manuelles encore actives ;
- moteur set-state encore actif dans Core 3.16 ;
- décision `closureReady = false`.
