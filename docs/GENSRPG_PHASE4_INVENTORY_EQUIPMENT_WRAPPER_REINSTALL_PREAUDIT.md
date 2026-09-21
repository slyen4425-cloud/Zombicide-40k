# GenSrpG — Phase 4 Core Inventory / Equipment — pré-audit compétition de réinstallation wrappers

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-reinstall-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-wrapper-reinstall-preaudit-2026-09-21`.
- Base exacte :
  `5b327836783f53819dcca603f486286c4df1576a`.
- Dernier checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission

Caractériser, sans correctif runtime, la compétition de réinstallation entre :

- `gens-hero-editor-dynamic-167897.js` ;
- `gens-equipment-stat-cleanup-1678102.js`.

## Résultat statique

Hero Editor Dynamic :
- wrapper générique marqué `__canon101` ;
- wrappe `openEquipmentEditor` et `saveEquipmentEditor` ;
- réessaie `installWrappers()` après 50 ms puis jusqu'à 30 relances à 100 ms ;
- ne reconnaît pas les marqueurs `__canonEq102` ni `__eqCache1021`.

Equipment Stat Cleanup :
- wrappe `openEquipmentEditor` avec `__canonEq102` ;
- wrappe `saveEquipmentEditor` avec l'invalidateur `__eqCache1021` ;
- est single-install ;
- ne reconnaît pas `__canon101`.

Ordre initial de chargement dynamique :
1. Hero Editor Dynamic ;
2. Equipment Stat Cleanup.

## Preuve navigateur réelle

Sentinelle :
`tests/gens_phase4_inventory_equipment_wrapper_reinstall_browser_v1.test.cjs`.

Elle capture les chaînes `__original` :
- juste après chargement ;
- après 3,3 s, donc après la fenêtre de retries.

### openEquipmentEditor

Juste après chargement :
1. `__canonEq102` ;
2. `__canon101` ;
3. Set Editor ;
4. hotfix ;
5. native.

Après la fenêtre de retries :
1. `__canon101` ;
2. `__canonEq102` ;
3. **`__canon101` une seconde fois** ;
4. Set Editor ;
5. hotfix ;
6. native.

### saveEquipmentEditor

Juste après chargement :
1. `__eqCache1021` ;
2. `__canon101` ;
3. Set Editor ;
4. hotfix ;
5. native.

Après la fenêtre de retries :
1. `__canon101` ;
2. `__eqCache1021` ;
3. **`__canon101` une seconde fois** ;
4. Set Editor ;
5. hotfix ;
6. native.

## Conséquence observée

Le retry de Hero Editor Dynamic re-wrappe réellement les deux fonctions après que
le Cleanup a installé ses propres wrappers.

Le native reste appelé exactement une fois :
- open : 1 ;
- save : 1.

Donc il ne s'agit pas d'un double appel natif, mais bien d'un **double propriétaire
Hero Editor Dynamic dans la même chaîne**.

Cela duplique potentiellement les effets post-open / post-save du même propriétaire :
- `ensureEquipmentBonusUi(...)` peut être planifié deux fois ;
- le writer `rpgBonuses` du Hero Editor Dynamic peut être planifié deux fois.

Le présent pré-audit ne corrige pas ce défaut.

## Tests

- statique :
  `tests/gens_phase4_inventory_equipment_wrapper_reinstall_preaudit_v1.test.cjs` ;
- navigateur :
  `tests/gens_phase4_inventory_equipment_wrapper_reinstall_browser_v1.test.cjs`.

Validation technique du SHA `3dbcd9d432fa6e722bb6da129e6537af90bf99ca` :
- Architecture + navigateur complet `35653370078` — SUCCESS ;
- Firefox `35653370055` — SUCCESS ;
- Tactical Dock `35653370068` — SUCCESS.

## Conclusion

Le défaut est prouvé et reproductible :
Hero Editor Dynamic peut se retrouver deux fois dans les chaînes Equipment après
les retries parce que son garde ne parcourt que le wrapper courant et ne reconnaît
pas la présence d'un wrapper `__canon101` plus bas dans `__original`.

Le prochain lot doit être correctif et séparé.

Candidat minimal :
- modifier uniquement la logique d'installation du wrapper Hero Editor Dynamic
  pour refuser de re-wrapper une chaîne qui contient déjà `__canon101` plus bas ;
- ne pas supprimer le wrapper canonique lui-même ;
- ne pas modifier Equipment Cleanup ;
- ne pas supprimer les retries globalement dans le même lot ;
- prouver au navigateur qu'après >3 s il reste exactement un `__canon101` dans
  open et save, avec toutes les fonctions Equipment intactes.

Aucun runtime n'a été modifié dans ce pré-audit.
