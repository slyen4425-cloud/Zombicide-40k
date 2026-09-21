# GenSrpG — Phase 4 Core Inventory / Equipment — pré-audit saveEquipmentEditor

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-save-wrapper-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-save-wrapper-preaudit-2026-09-21`.
- Base exacte :
  `669a8b2ef1caeba2d75a97000b4716877e9e5fc9`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun fichier runtime n'est modifié dans ce pré-audit.

## Inventaire exhaustif

La sentinelle
`tests/gens_phase4_inventory_equipment_save_wrapper_inventory_v1.test.cjs`
scanne les 76 fichiers JS externes atteignables du manifeste Phase 2.

Elle trouve exactement 4 participants contenant `saveEquipmentEditor` :

1. `assets/dungeon/dungeon-equipment-hotfix-167817.js` ;
2. `assets/dungeon/dungeon-set-editor-167818.js` ;
3. `assets/gensrpg/gens-equipment-stat-cleanup-1678102.js` ;
4. `assets/gensrpg/gens-hero-editor-dynamic-167897.js`.

Cette liste est verrouillée : tout changement futur impose un ré-audit.

## Chaîne runtime après fenêtre de retry

La caractérisation Chromium utilise les vrais modules et attend la fin de la
fenêtre historique de retry Hero Editor.

Chaîne `saveEquipmentEditor` observée :

1. Equipment Cleanup — `__eqCache1021` ;
2. Hero Editor Dynamic — `__canon101` ;
3. Set Editor — `__setEditor167818` ;
4. Equipment Hotfix — `__equipmentHotfix167817` ;
5. save natif.

La garde de chaîne du lot précédent empêche désormais toute deuxième couche
`__canon101`.

## Responsabilités observées

### Equipment Hotfix

- lit les contrôles historiques `deuiHotfixBonus_*` ;
- pour un objet custom : réécrit `rpgBonuses` via `saveCustomEquipment` ;
- pour un objet builtin : réécrit `rpgBonuses` via les overrides Dungeon ;
- reste actuellement le seul writer de bonus builtin vers les overrides.

### Set Editor

- persiste `setId` et `setPieceId` ;
- utilise `saveCustomEquipment` pour un custom ;
- utilise les overrides Dungeon pour un builtin.

### Hero Editor Dynamic

- lit l'UI canonique `#eqCanonicalRpgBonuses1678101` ;
- persiste les bonus canoniques sur les objets présents dans
  `loadCustomEquipment()` ;
- n'a actuellement aucun target builtin dans ce chemin.

### Equipment Cleanup

- n'écrit pas l'objet ;
- invalide le cache Equipment avant et après le save.

## Cas custom

Pour un seul Save custom dans la fixture contrôlée :

- save natif : 1 appel ;
- `saveCustomEquipment` : **3 appels** ;
- override Dungeon : 0.

Les trois écritures correspondent à :
1. hotfix bonus historique ;
2. Set Editor membership ;
3. Hero Editor bonus canonique différé.

La valeur canonique éditée est finalement conservée et l'appartenance de set
est conservée.

## Cas builtin

Pour un seul Save builtin :

- save natif : 1 appel ;
- `saveCustomEquipment` : 0 ;
- save des overrides Dungeon : **2 appels**.

Les deux écritures correspondent à :
1. bonus par le hotfix ;
2. appartenance de set par Set Editor.

Preuve importante :

- valeur affichée/éditée dans l'UI canonique Hero Editor : `9` ;
- valeur de bonus réellement persistée dans l'override : `2`,
  c'est-à-dire la valeur des contrôles historiques cachés chargés par le hotfix.

Le chemin canonique de bonus Equipment n'est donc pas encore uniforme entre
custom et builtin.

## Conclusion architecturale

Aucun des 4 wrappers n'est retirable isolément sans perte de comportement :

- retirer Hotfix casse aujourd'hui le writer de bonus builtin ;
- retirer Set Editor casse la membership des sets ;
- retirer Hero Editor casse le writer de l'UI canonique pour les customs ;
- retirer Equipment Cleanup casse l'invalidation cache.

Le bon prochain chantier n'est donc pas un retrait de wrapper à l'aveugle.

Il faut d'abord créer/raccorder une **autorité canonique de persistance des bonus
Equipment** capable de cibler explicitement :
- équipement custom ;
- équipement builtin / overrides Dungeon.

Cette autorité doit recevoir les bonus déjà lus par l'UI canonique ; elle ne doit
pas lire le DOM elle-même.

Après parité custom+builtin, un lot séparé pourra retirer le writer de bonus
historique du hotfix, puis ré-auditer le reste de la chaîne save.

## Validation technique du pré-audit

SHA technique :
`a9f9baaed77026b8a427b1c1f46923146a8e890b`.

- Architecture + navigateur complet `35658166447` — SUCCESS ;
- Firefox `35658166405` — SUCCESS ;
- Tactical Dock `35658166515` — SUCCESS.

Sentinelles ajoutées :
- `tests/gens_phase4_inventory_equipment_save_wrapper_inventory_v1.test.cjs` ;
- `tests/gens_phase4_inventory_equipment_save_wrapper_browser_preaudit_v1.test.cjs`.

Le checkpoint GREEN final ne sera créé qu'après revalidation des trois batteries
sur le SHA documentaire exact de clôture.
