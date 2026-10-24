# GenSrpG — Phase 4 Core Inventory / Equipment — pré-audit retry wrappers Equipment

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-2026-09-21`.
- Base exacte :
  `0fd2909a488becc452439c27c8272e2b7b346f73`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission

Caractériser sans modification runtime l'interaction entre :
- `GensHeroEditorDynamic167897.installWrappers()` et son marker `__canon101` ;
- `GensEquipmentStatCleanup1678102.wrapOpen()` avec `__canonEq102` ;
- l'invalidateur save Equipment Cleanup avec `__eqCache1021`.

## État Phase 2 confirmé

`docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json` classe déjà :
- `gens-hero-editor-dynamic-167897.js` ;
- `gens-equipment-stat-cleanup-1678102.js`

comme sources externes de bootstrap/retry.

Ce classement est descriptif : il ne justifie pas à lui seul la suppression d'un timer.

## Ordre de composition prouvé

Hero Art Repair charge dynamiquement :
1. Hero Editor Dynamic ;
2. puis Equipment Stat Cleanup.

Après l'installation initiale de Hero Editor Dynamic :

`openEquipmentEditor`
→ `__canon101`
→ propriétaires Equipment précédents.

Après l'installation d'Equipment Cleanup :

`openEquipmentEditor`
→ `__canonEq102`
→ `__canon101`
→ propriétaires précédents.

Pour `saveEquipmentEditor` :

`__eqCache1021`
→ `__canon101`
→ propriétaires précédents.

## Cause exacte du rewrap

Le helper Hero Editor :

`wrap(name, maker, flag="__canon101")`

ne regarde que le wrapper extérieur courant :

`old[flag]`.

Il ne vérifie pas si `__canon101` existe déjà plus bas dans la chaîne
`__original`.

Or Equipment Cleanup pose ensuite des wrappers ayant d'autres marqueurs :
- open : `__canonEq102` ;
- save : `__eqCache1021`.

Au retry Hero Editor (50 ms puis jusqu'à 30 répétitions à 100 ms), le wrapper
extérieur ne porte donc plus `__canon101`. Hero Editor rewrappe une seconde fois.

## Preuve navigateur

Sentinelle :
`tests/gens_phase4_inventory_equipment_wrapper_retry_browser_preaudit_v1.test.cjs`.

Chaîne initiale open après Cleanup :

1. `equipment-cleanup:__canonEq102`
2. `hero-editor:__canon101`
3. `set-editor:__setEditor167818`
4. `equipment-hotfix:__equipmentHotfix167817`
5. native

Après le premier retry Hero Editor :

1. `hero-editor:__canon101`
2. `equipment-cleanup:__canonEq102`
3. `hero-editor:__canon101`
4. `set-editor:__setEditor167818`
5. `equipment-hotfix:__equipmentHotfix167817`
6. native

Pour save, le même phénomène existe autour de `__eqCache1021`.

Les retries suivants ne continuent pas à faire croître la chaîne : une fois le
nouveau wrapper `__canon101` redevenu extérieur, le garde top-level bloque les
tentatives suivantes.

## Effet observable

Dans la fixture navigateur réaliste :
- l'ouverture native reste appelée une seule fois ;
- l'UI canonique bonus reste unique ;
- la section Set Editor reste unique ;
- les trois niveaux d'évolution canoniques restent uniques ;
- mais un seul appel `saveEquipmentEditor()` déclenche **deux appels**
  `saveCustomEquipment(...)` provenant des deux couches Hero Editor Dynamic.

La duplication n'est donc pas seulement structurelle : elle provoque une double
persistance Equipment.

## Conclusion architecturale

Le retry global de Hero Editor peut être nécessaire pour raccorder des globals
définis tardivement. Le pré-audit ne conclut donc pas à supprimer le retry entier.

En revanche, pour les wrappers Equipment déjà présents dans la chaîne
`__original`, le garde top-level est insuffisant et permet une duplication réelle
d'autorité.

Le prochain lot correctif doit :
- empêcher uniquement le rewrap d'une responsabilité Hero Editor déjà présente dans
  la chaîne ;
- préserver le retry pour les propriétaires réellement absents / tardifs ;
- éviter tout nouveau timer, wrapper, observer ou fallback ;
- prouver qu'un Save Equipment ne déclenche plus qu'une persistance Hero Editor ;
- conserver open/save natifs une seule fois et toutes les UI canoniques.

## Validation du pré-audit

SHA technique d'audit :
`dcabd657f61e87c8a1be8455ffee165b4d3ee979`.

- Architecture + navigateur complet :
  `35653724569` — SUCCESS ;
- Firefox :
  `35653724479` — SUCCESS ;
- Tactical Dock :
  `35653724449` — SUCCESS.

Aucun fichier runtime n'a été modifié dans ce pré-audit.

Le SHA documentaire final doit repasser les trois batteries avant création du
checkpoint GREEN.
