# GenSrpG — Phase 4 Core Inventory / Equipment — retrait fallback set-state UI

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-setstate-fallback-retirement-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-setstate-fallback-retirement-2026-09-21`.
- Base exacte :
  `db3bdbd51e6ba32a9d81204e41fd0e6a95a2519e`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-legacy-ui-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## But du lot

Retirer uniquement la seconde implémentation locale de calcul d'état de set dans :

`assets/dungeon/dungeon-equipment-ui.js`.

Le pré-audit avait identifié :

`fallbackSetStates(items)`

comme premier candidat soustractif sûr, car le chemin de production préfère déjà
le seam canonique :

`dungeonSetStateFromItems316(items)`.

## Changement runtime

La fonction locale :

`fallbackSetStates(items)`

a été supprimée.

`setStates(items)` :
1. appelle toujours `dungeonSetStateFromItems316(items)` ;
2. retourne directement le tableau canonique lorsqu'il est valide ;
3. retourne désormais `[]` lorsque le seam est absent, invalide ou lève une
   exception ;
4. ne recalcule plus localement les groupes, pièces ou paliers de set.

Aucune nouvelle autorité de calcul n'a été ajoutée.

## Pourquoi ce retrait est sûr

La composition production conserve `dungeon-core-316.js`, propriétaire du
seam `dungeonSetStateFromItems316`, avant l'Equipment UI injectée.

Le pré-audit avait aussi prouvé une divergence du fallback sur les pièces
malformées sans id/piece id. Sa suppression évite qu'une sémantique locale
différente puisse reprendre l'autorité en cas de défaut de seam.

Quand le seam canonique fonctionne — cas production attendu — le résultat
retourné à l'UI reste inchangé.

## TDD

Sentinelle dédiée :

`tests/gens_phase4_inventory_equipment_setstate_fallback_retirement_v1.test.cjs`.

RED initial :

- SHA CI : `031d38baf7f1a2ece5127b2d4e364509ed94a8ea` ;
- Architecture : `35645846830` — FAILURE attendu ;
- erreur exacte :
  `local Equipment UI fallbackSetStates must be retired`.

Après suppression runtime, l'ancien pré-audit a volontairement échoué car il
attendait encore la fonction retirée :

- SHA : `c4099932d4a1ee0c2d5d34997a1781ff4386cc04` ;
- Architecture : `35646076358` — FAILURE attendu ;
- erreur :
  `missing function fallbackSetStates`.

La sentinelle historique a ensuite été réalignée sur le nouvel état.

## Contrat final

La sentinelle finale verrouille :

- absence de `fallbackSetStates` ;
- dépendance exclusive de `setStates` envers
  `dungeonSetStateFromItems316` ;
- résultat canonique retourné inchangé ;
- seam absent -> vue UI vide ;
- résultat canonique invalide -> vue UI vide ;
- aucun recalcul local des sets.

## Validation technique

HEAD technique :

`d448b8052c5a9b01bfb239ecdb0b216ab951cdef`.

Runs :

- Architecture + navigateur complet :
  `35646315077` — SUCCESS ;
- Firefox :
  `35646315049` — SUCCESS ;
- Tactical Dock :
  `35646315106` — SUCCESS.

## Périmètre respecté

Aucun changement de :

- `index.html` ;
- `dungeon-core-316.js` ;
- Core Equipment bonus/sets ;
- wrappers `openEquipmentEditor` / `saveEquipmentEditor` ;
- wrapper `renderDungeonGear` ;
- MutationObserver ;
- listeners document ;
- timers / RAF ;
- stockage ;
- évolution ;
- cache/invalidation ;
- Stats ;
- Tactical ;
- combat.

Aucun nouveau wrapper, fallback, observer ou timer n'a été ajouté.

## Résultat architectural

Avant :
- seam canonique préféré ;
- fallback local encore capable de recalculer une sémantique parallèle.

Après :
- seam canonique unique pour l'état de set ;
- UI sans autorité locale de calcul de set ;
- absence du seam = vue vide, jamais moteur concurrent.

## Sortie du lot

La présente documentation change le SHA.

Conformément à la charte :

1. valider Architecture + navigateur, Firefox et Tactical sur le SHA
   documentaire exact ;
2. créer le checkpoint GREEN final uniquement après trois SUCCESS ;
3. ouvrir ensuite un nouveau micro-lot depuis ce checkpoint ;
4. les wrappers open/save et les side effects UI restent hors périmètre ;
5. ne jamais toucher `main`.
