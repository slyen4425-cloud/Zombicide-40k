# GenSrpG — Phase 4 Core Inventory / Equipment — garde de chaîne retry Hero Editor

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-wrapper-retry-scope-fix-2026-09-21`.
- Base exacte :
  `6875be5259f4356e710b29ee6d75d715070847ec`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Cause prouvée

Le pré-audit précédent a démontré que Hero Editor Dynamic installe d'abord ses
wrappers `__canon101`, puis Equipment Cleanup s'interpose avec :
- `__canonEq102` sur `openEquipmentEditor` ;
- `__eqCache1021` sur `saveEquipmentEditor`.

Le retry Hero Editor ne testait que le wrapper extérieur :
`old[flag]`.

Il ne voyait donc plus le propriétaire `__canon101` présent plus bas dans la
chaîne `__original` et réinstallait une deuxième couche Hero Editor.

Effet observable avant correctif :
- deux couches `__canon101` sur open/save après le premier retry ;
- open natif toujours appelé une seule fois ;
- un Save Equipment déclenchait deux persistances Hero Editor
  `saveCustomEquipment`.

## TDD

### RED owner-level

Test :
`tests/gens_phase4_inventory_equipment_wrapper_chain_guard_owner_v1.test.cjs`.

Run :
`35655960164` — FAILURE attendu.

Le test exige que le wrapper générique consulte toute la chaîne
`__original` avant d'ajouter une nouvelle responsabilité `__canon101`.

### RED comportemental navigateur

Test :
`tests/gens_phase4_inventory_equipment_wrapper_chain_guard_browser_v1.test.cjs`.

Run isolé :
`35655960536` — FAILURE attendu.

Erreur attendue :
`retry must not duplicate Hero Editor openEquipmentEditor ownership through Cleanup`.

Valeur observée :
2 couches Hero Editor au lieu d'1.

## Correctif minimal

Commit runtime :
`70c1cee972ec58c17792fc1979c07333115fb624`.

Fichier runtime modifié :
`assets/gensrpg/gens-hero-editor-dynamic-167897.js` uniquement.

Ajout :
- une garde `hasWrapFlag(fn, flag)` ;
- parcours borné à 32 niveaux ;
- protection contre les cycles via `Set` ;
- recherche du marqueur dans toute la chaîne `__original`.

Le wrapper générique utilise désormais cette garde avant d'ajouter une couche.

Non modifié :
- cadence du retry initial 50 ms ;
- jusqu'à 30 relances à 100 ms ;
- responsabilités open/save Equipment ;
- Equipment Cleanup ;
- Set Editor ;
- hotfix Equipment ;
- stockage / bonus / sets / évolution / cache ;
- Stats gameplay / Tactical / combat ;
- `index.html` ;
- `main`.

## Preuve de préservation du retry utile

La sentinelle navigateur remplace volontairement `renderDungeonAttributes`
après le premier passage par une nouvelle fonction qui ne conserve pas l'ancienne
chaîne.

Au retry :
- la nouvelle fonction tardive est bien enveloppée par Hero Editor ;
- sa valeur de retour est conservée ;
- elle n'est exécutée qu'une fois.

Le correctif ne supprime donc pas le retry : il empêche seulement le doublon
d'un propriétaire déjà présent dans `__original`.

## Résultat Equipment après correctif

Après interposition Equipment Cleanup puis retry :
- une seule couche `__canon101` sur `openEquipmentEditor` ;
- une seule couche `__canon101` sur `saveEquipmentEditor` ;
- open natif : 1 appel ;
- save natif : 1 appel ;
- persistance Hero Editor : 1 appel `saveCustomEquipment` ;
- UI canonique bonus : unique ;
- évolution canonique niveaux 2/3/4 : présente ;
- Set Editor / hotfix / Cleanup : responsabilités conservées.

Les sentinelles historiques ont été réalignées sur ce nouvel invariant ; le
document de pré-audit précédent conserve la preuve de l'ancien comportement.

## Validation technique

SHA technique :
`283c921f240c6a7dac587aaa2b9fd01a9432ca66`.

- Architecture + navigateur complet :
  `35656277814` — SUCCESS ;
- Firefox :
  `35656277860` — SUCCESS ;
- Tactical Dock :
  `35656277841` — SUCCESS ;
- navigateur ciblé isolé :
  `35656277861` — SUCCESS.

Le workflow temporaire d'isolation a ensuite été supprimé.

## Clôture

Le présent document et la mise à jour de `CURRENT_WORK` créent un nouveau SHA
documentaire. Le checkpoint GREEN final ne doit être créé qu'après SUCCESS de :
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;
sur ce SHA documentaire exact.

Checkpoint cible :
`checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.
