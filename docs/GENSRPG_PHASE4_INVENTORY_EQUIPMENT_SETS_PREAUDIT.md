# GenSrpG — Phase 4 — Pré-audit Inventory / Equipment / Sets

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-sets-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-sets-preaudit-2026-09-21`.
- Base exacte :
  `7dd70d6fc78e0bd43d63f9fbf67e22571c8555e9`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-stats-s11-core-snapshot-raccord-green-2026-09-21`.
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est **diagnostic / caractérisation uniquement**.

Aucun moteur Inventory Core, aucune migration de stockage et aucun déplacement
de responsabilité ne sont autorisés dans ce lot.

## Source inline exacte

Le fichier utilisateur `work_8.zip` a été retrouvé dans la Library et
matérialisé uniquement pour l'audit.

Le fichier extrait est :

- taille : `8 174 580` octets ;
- blob Git :
  `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Il correspond donc exactement au blob `index.html` du checkpoint de base.

Aucun nouveau transfert du gros `index.html` n'est nécessaire pour ce lot.

## 1. Source de vérité de l'inventaire héros

L'état persistant du héros est l'autorité actuelle.

Clé historique :

`z40k_<heroId>_v1`

Le propriétaire inline `loadState(id)` recharge cet état et normalise
`inventory`, les attributs et `rpgGear`.

L'inventaire est :

`state.inventory[]`

Chaque entrée référence un objet par :

`entry.itemId`

et reçoit un `uid` stable lorsqu'il est créé/migré.

`getEntry(index)` lit l'entrée et `getItemFromEntry(entry)` délègue à
`itemById(entry.itemId)`.

### Autorité des slots équipés Dungeon

Les objets équipés ne portent pas eux-mêmes un booléen "equipped".

L'autorité est constituée d'indices dans `state.inventory` :

- `state.rightHand` ;
- `state.leftHand` ;
- `state.rpgGear[slot]`.

Slots RPG actuels :

- head ;
- shoulders ;
- torso ;
- legs ;
- feet ;
- hands ;
- neck ;
- offhand.

Le champ historique `state.equipment` reste utilisé par le chemin non-Dungeon
et ne doit pas être fusionné silencieusement avec `rpgGear`.

## 2. Propriétaires de mutation des slots

### Mains

Propriétaires inline historiques :

- `equipRight(index)` ;
- `equipLeft(index)` ;
- `equipTwoHands(index)` ;
- `unequip(side)`.

Ces fonctions mutent directement `rightHand/leftHand`, sauvegardent puis
rafraîchissent mains/inventaire/actions.

Le Tactical historique possède aussi `window.dc214Equip(heroId,value)`, qui
migre les deux indices de mains sur un état chargé puis persiste cet état.

### Équipement RPG

Propriétaires inline :

- `inferRpgSlot(item)` ;
- `equipRpgGear(index)` ;
- `unequipRpgGear(slot)`.

`equipRpgGear` écrit directement :

`state.rpgGear[inferRpgSlot(item)] = inventoryIndex`.

### Suppression d'une entrée

`removeInventoryEntry(index)` retire l'entrée du tableau et corrige les
indices de mains/équipement historique.

Une couche inline tardive Core 1.05 wrappe cette fonction pour corriger aussi
les indices de `rpgGear`.

**Risque majeur :** les références équipées sont des indices de tableau.
Toute extraction Inventory doit préserver leur réindexation ou introduire une
migration explicite vers les `uid`. Une substitution implicite serait
incompatible avec les sauvegardes actuelles.

## 3. Vue "objets réellement équipés"

Propriétaire inline de base :

`dungeonEquippedItems()`

Il collecte, sans doublon :

1. `rightHand` ;
2. `leftHand` ;
3. tous les indices `rpgGear`.

Chaque indice est résolu via `getEntry -> getItemFromEntry -> itemById`.

Le propriétaire historique contient cependant un garde :

`if (!isDungeonHeroSheet()) return []`.

### Hotfix 16.78.17

`assets/dungeon/dungeon-equipment-hotfix-167817.js` wrappe
`dungeonEquippedItems`.

Si le résultat historique est vide alors que le mode Dungeon est actif, le
hotfix reconstruit la même vue depuis :

`state.rightHand + state.leftHand + Object.values(state.rpgGear)`.

Il utilise ensuite `getItemFromEntry` ou `itemById`.

Cela confirme que les **slots de state** sont la vraie source de vérité et que
le garde de fiche héros est une dette de compatibilité, pas une autorité
Inventory.

Ce wrapper ne doit pas être supprimé avant qu'un futur propriétaire Inventory
fournisse la vue équipée indépendamment de l'écran ouvert.

## 4. Catalogue et définitions d'objets

Le catalogue actuel est composé de plusieurs sources.

### Base Dungeon inline

`dungeonItems()` définit le catalogue Dungeon historique puis applique :

`gensrpg_dungeon_item_overrides_v1`

via :

- `loadDungeonItemOverrides()` ;
- `saveDungeonItemOverrides()`.

`itemById(id)` privilégie `dungeonItems()` pour les IDs Dungeon puis tombe
sur le tableau global `ITEMS`.

### Extension Core 3.16

`assets/dungeon/dungeon-core-316.js` :

- déclare `ITEMS316` ;
- expose `DUNGEON_ITEM_DEFINITIONS_316` ;
- wrappe `dungeonItems()` ;
- ajoute les nouveaux objets au catalogue ;
- applique les mêmes overrides builtin ;
- associe notamment `dng_leather` au set cuir.

Cette couche mélange encore catalogue, sets et capacités combat des objets.
La future extraction Inventory ne devra **pas** déplacer les hooks de dégâts,
reload, DoT, cooldowns ou boutons de capacités avec le catalogue.

### Équipement personnalisé

Stockage :

`gensrpg_custom_equipment_v1`

Propriétaires inline :

- `loadCustomEquipment()` ;
- `saveCustomEquipment()` ;
- `refreshCustomEquipmentIntoItems()`.

Les records persistés sont réinjectés dans le tableau global `ITEMS`.

`saveEquipmentEditor()` écrit :

- un objet builtin dans les overrides Dungeon ;
- un objet custom dans la bibliothèque custom.

L'évolution fait partie du record objet persisté.

## 5. Autorité des sets

Registry runtime :

`window.DUNGEON_EQUIPMENT_SETS`.

Core 3.16 fournit l'algorithme actuel :

`setState316(items, registry)`.

Contrat observé :

- groupe par `setId` ;
- déduplique par `setPieceId || item.id` ;
- compte les pièces uniques ;
- active tous les paliers dont `pieces <= count` ;
- cumule les bonus de chaque palier actif.

Exports :

- `dungeonSetStateFromItems316` ;
- `dungeonEquippedSetState` ;
- `dungeonSetBonusFromItems316` ;
- `dungeonSetBonusTotal`.

Le moteur ne cherche pas l'inventaire complet : il consomme la vue
`dungeonEquippedItems()`.

### Persistance des définitions de sets

`assets/dungeon/dungeon-set-editor-167818.js` utilise directement :

`gensrpg_dungeon_set_overrides_v1`.

Il hydrate ensuite le registry global.

`gens-equipment-stat-cleanup-1678102.js` réutilise la même clé pour son
éditeur canonique de stats de set.

Il existe donc deux couches d'éditeur/persistance autour du même registry.
Elles doivent être consolidées plus tard au propriétaire réel, pas dupliquées
dans Core.

## 6. Chaîne exacte de bonus Equipment vers Stats

### Étape A — bonus direct de l'objet

Inline :

`dungeonEquipmentBonus(key)`

additionne :

`item.rpgBonuses[key]`

sur `dungeonEquippedItems()`.

### Étape B — bonus de set

Core 3.16 capture le bonus précédent puis remplace le seam par :

`bonus objets + dungeonSetBonusTotal(key)`.

Les paliers sont donc appliqués une seule fois à ce niveau.

### Étape C — bonus d'évolution

`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js` wrappe à son tour
`dungeonEquipmentBonus`.

Il ajoute :

`cachedEvolutionBonus(key)`

calculé depuis les objets équipés et le XP du héros.

`evolutionBonusForItem(item,key,xp)` additionne les `rpgBonuses` de tous
les niveaux d'évolution dont le seuil XP est atteint.

### Étape D — cache performance

`assets/gensrpg/gens-mobile-combat-performance-16781022.js` wrappe
`dungeonEquipmentBonus` dans le cache de combat partagé.

Le cache est indexé par héros/state/génération/stat.

Le module réinstalle son wrapper immédiatement puis à 250 ms et 1200 ms, ce
qui lui permet de recouvrir les wrappers chargés dynamiquement plus tard.

### Étape E — Core Stats

Le propriétaire Stats ne lit pas l'inventaire.

`GensCleanRpgStats167874.coreSnapshot()` collecte
`R.dungeonEquipmentBonus(id)` comme source Equipment explicite et transmet
ces lignes à S5 Modifier Provider.

Pour les dérivées externes `mana/crit/dodge/magicDefense`, il consomme le
même seam.

**Frontière actuelle saine :**

Inventory/Equipment possède la composition du bonus ;
Core Stats consomme uniquement le résultat normalisé.

Un futur service Core Inventory ne doit pas déplacer cette responsabilité dans
Stats.

## 7. Cache et invalidation

Le cache évolution Equipment a un TTL de 120 ms.

`gens-equipment-stat-cleanup-1678102.js` tente de wrapper :

- `dungeonEquipItem` ;
- `dungeonUnequipItem` ;
- `equipDungeonItem` ;
- `unequipDungeonItem` ;
- `toggleDungeonEquipment` ;
- `saveEquipmentEditor`.

Or les propriétaires inline réellement observés utilisent notamment :

- `equipRight` ;
- `equipLeft` ;
- `equipTwoHands` ;
- `unequip` ;
- `equipRpgGear` ;
- `unequipRpgGear` ;
- `dc214Equip`.

Ces noms ne coïncident pas tous avec les invalidateurs déclarés.

Le cache reste court et le cache performance général est invalidé sur plusieurs
mutations/sauvegardes, mais la couverture exacte d'invalidation doit être
caractérisée avant extraction.

Ce point est un **risque**, pas un correctif dans ce pré-audit.

## 8. Couches UI / wrappers historiques

### dungeon-equipment-ui.js

Cette couche :

- lit `dungeonItems`, `itemById`, `dungeonEquippedItems` ;
- préfère `dungeonSetStateFromItems316` ;
- possède encore un fallback local de calcul des sets ;
- wrappe `renderDungeonGear` ;
- ajoute un listener `change` document ;
- installe un `MutationObserver` global sur documentElement ;
- planifie des refresh via RAF / setTimeout.

Cette couche est une dette UI historique, pas le futur moteur Inventory.

### dungeon-equipment-hotfix-167817.js

Cette couche wrappe :

- `dungeonEquippedItems` ;
- `equipmentSummary` ;
- `equipmentCardStatsHtml` ;
- `openEquipmentEditor` ;
- `saveEquipmentEditor`.

Elle conserve les marqueurs `__original`.

### dungeon-set-editor-167818.js

Cette couche :

- persiste directement les overrides de sets ;
- persiste l'appartenance d'un objet via builtin/custom writers ;
- wrappe `openEquipmentEditor` et `saveEquipmentEditor` ;
- ajoute des listeners éditeur et des callbacks différés.

### gens-equipment-stat-cleanup-1678102.js

Cette couche mixte Stats/Builders :

- remplace l'UI fixe des bonus par les defs Stats canoniques ;
- ajoute les bonus d'évolution ;
- recâble l'éditeur de sets ;
- wrappe le seam `dungeonEquipmentBonus` ;
- ajoute le cache et ses invalidateurs ;
- wrappe `openEquipmentEditor` ;
- s'installe avec retry si Stats/document ne sont pas encore prêts.

Cette couche devra être **découpée**, pas déplacée en bloc vers Core Inventory.

## 9. Ordre de chargement pertinent

Ordre simplifié :

1. `index.html` crée les propriétaires inline ;
2. `dungeon-core-316.js` étend catalogue + sets + bonus ;
3. `dungeon-equipment-ui.js` ;
4. `dungeon-equipment-hotfix-167817.js` ;
5. `dungeon-set-editor-167818.js` ;
6. Core Stats S2-S7 ;
7. `gens-rpg-stats-clean-167874.js` ;
8. `gens-dungeon-hero-art-repair-167874.js` déclenche le chargement dynamique de
   `gens-equipment-stat-cleanup-1678102.js` ;
9. `gens-mobile-combat-performance-16781022.js` installe/réinstalle le cache.

Le cleanup Equipment est également précaché par le Service Worker.

## 10. Stockages du périmètre

| Donnée | Stockage actuel |
| --- | --- |
| état héros, inventaire, slots | `z40k_<heroId>_v1` |
| équipement personnalisé | `gensrpg_custom_equipment_v1` |
| overrides objets Dungeon builtin | `gensrpg_dungeon_item_overrides_v1` |
| overrides définitions de sets | `gensrpg_dungeon_set_overrides_v1` |

Les decks, marchands, loot, munitions actives, cooldowns d'objets et états de
combat existent à proximité mais sont **hors du premier périmètre Core
Inventory/Equipment**.

## 11. Frontière candidate du futur Core Inventory / Equipment

Le futur service ne doit pas être créé dans ce pré-audit.

La frontière candidate à prouver dans un lot ultérieur est :

### Core Inventory — pur

Entrées explicites :

- inventory entries ;
- références de slots ;
- item catalogue.

Sorties :

- vue d'objets équipés dédupliquée ;
- résolution index/uid ;
- opérations pures de slot ;
- correction déterministe des références après suppression.

Aucun DOM, stockage ou combat.

### Core Equipment — pur

Entrées explicites :

- objets équipés ;
- registry de sets ;
- XP ;
- définitions d'évolution.

Sorties :

- bonus directs ;
- état des sets ;
- bonus de sets ;
- bonus d'évolution ;
- bonus Equipment total normalisé.

Aucun accès direct à Stats.

### Runtime adapter

Le propriétaire runtime restera responsable de :

- lecture/écriture du state héros ;
- persistance ;
- cache/invalidation ;
- adaptation des anciens indices ;
- UI/Builders séparés.

## 12. Exclusions fermes du premier lot d'extraction

Ne pas aspirer dans Core Inventory :

- dégâts/DoT/on-hit ;
- capacités actives d'objets ;
- ammo/reload ;
- loot/deck/chests ;
- marchands/économie ;
- rendu équipement ;
- éditeur ;
- Stats S3-S7 ;
- Tactical ;
- PWA ;
- progression générale.

Ces responsabilités auront leurs propriétaires/lots propres.

## 13. Risques à verrouiller avant extraction

1. références de slots par index fragiles lors de suppression ;
2. garde `isDungeonHeroSheet` compensé par un hotfix ;
3. plusieurs wrappers sur `saveEquipmentEditor` ;
4. calcul de set dupliqué en fallback UI ;
5. deux couches écrivant le registry/stockage de sets ;
6. bonus évolution ajouté par une couche mixte Stats/Builders ;
7. cache Equipment et cache performance empilés ;
8. invalidateurs nommés différemment des vrais propriétaires equip/unequip ;
9. chargement dynamique du cleanup Equipment ;
10. Core 3.16 contient aussi des responsabilités combat à ne pas déplacer.

## 14. Décision de pré-audit

Il est **interdit** de créer directement un gros
`inventory-equipment-v1.js` en copiant les fonctions historiques.

La prochaine extraction devra être découpée.

Ordre recommandé à confirmer par sentinelles :

1. contrat pur "equipped view / slot refs" ;
2. raccord au propriétaire runtime des slots ;
3. contrat pur bonus directs + sets ;
4. raccord `dungeonEquipmentBonus` avec parité ;
5. évolution ;
6. cache/invalidation ;
7. seulement ensuite nettoyage des wrappers/UI historiques dans des lots dédiés.

Le premier futur micro-lot ne doit pas toucher au combat des objets, aux
Builders ni au stockage.


## 15. Validation technique

SHA technique du pré-audit :

`c540e0c033e85ecfa64721f16efb0aadecef308e`.

Validation exacte :

- Architecture + navigateur complet : `35607723774` — SUCCESS ;
- Firefox : `35607723698` — SUCCESS ;
- Tactical Dock : `35607723731` — SUCCESS.

La sentinelle dédiée
`tests/gens_phase4_inventory_equipment_sets_preaudit_v1.test.cjs`
est exécutée par la CI Architecture et est GREEN.

Deux RED intermédiaires provenaient uniquement de la sentinelle :
1. dépendance Stats explicite absente dans la fixture ;
2. extracteur de fonction ne gérant pas un objet littéral dans un paramètre par défaut.

Ils ont été corrigés uniquement dans le test. Aucun runtime n'a été modifié.

## 16. Résultat de sortie du pré-audit

Le pré-audit est suffisamment précis pour interdire une extraction monolithique.

Contrats établis :

1. source de vérité inventaire :
   `state.inventory[]` ;
2. source de vérité des slots :
   `rightHand / leftHand / rpgGear` ;
3. vue équipée historique :
   `dungeonEquippedItems()` + hotfix de compatibilité ;
4. composition bonus :
   objet direct -> set -> évolution -> cache -> `dungeonEquipmentBonus` ;
5. Core Stats consomme uniquement le seam agrégé Equipment ;
6. moteur de sets actuel :
   `setState316(items, registry)` ;
7. stockage et UI restent hors du premier micro-lot Core ;
8. les hooks combat des objets restent hors Inventory/Equipment Core.

Premier micro-lot recommandé :

**contrat pur Equipped View / Slot Refs**.

Il devra caractériser puis extraire uniquement :
- résolution des refs de slots ;
- déduplication des objets équipés ;
- correction déterministe des refs après suppression ;
- aucune mutation stockage/DOM/combat/Stats.

Le raccord au runtime des slots viendra dans un lot distinct après parité.

## 17. Clôture candidate

Le présent changement documentaire modifie le SHA final.

Conformément à la charte, aucun checkpoint GREEN ne doit être créé avant
SUCCESS des trois batteries sur le SHA documentaire exact.

Si les trois batteries restent GREEN :

1. créer
   `checkpoint/gensrpg-phase4-inventory-equipment-sets-preaudit-green-2026-09-21` ;
2. ouvrir un checkpoint de départ séparé pour le contrat pur Equipped View /
   Slot Refs ;
3. créer une nouvelle branche de micro-lot ;
4. ne pas modifier `main`.
