# GenSrpG — Phase 4 Core Inventory / Equipment — pré-audit wrappers / UI historiques

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-legacy-ui-preaudit-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-legacy-ui-preaudit-2026-09-21`.
- Base exacte :
  `fc6e2fadea984869eef2435025c7b98851c1fd7e`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-cache-invalidation-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est diagnostic / caractérisation uniquement.

Aucun fichier runtime n'a été modifié.

## Cycle Core Inventory / Equipment déjà GREEN

Avant ce pré-audit :

- Equipped View / Slot Refs : Core pur + raccord runtime ;
- bonus directs + sets : Core pur + raccord `dungeonEquipmentBonus` ;
- évolution : Core pur + raccord sur cache miss ;
- cache / invalidation : frontières canoniques corrigées.

Le but du présent lot est donc d'identifier les dettes historiques restantes
dans les couches UI / éditeur, sans mélanger leur nettoyage avec les moteurs
Core déjà stabilisés.

## Couches auditées

- `assets/dungeon/dungeon-equipment-ui.js` ;
- `assets/dungeon/dungeon-equipment-hotfix-167817.js` ;
- `assets/dungeon/dungeon-set-editor-167818.js` ;
- `assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`.

## 1. Fallback de calcul des sets dans Equipment UI

`dungeon-equipment-ui.js` contient encore :

`fallbackSetStates(items)`.

Le chemin actif de `setStates(items)` préfère cependant déjà :

`window.dungeonSetStateFromItems316(items)`.

Cette autorité est fournie par :

`assets/dungeon/dungeon-core-316.js`.

Le runtime de production conserve Core 3.16 dans le source index avant
l'injection de l'UI Equipment.

La sentinelle prouve, sur des pièces valides, la parité de progression entre
le fallback UI et le service Core actuel `GensEquipmentBonusSetsV1.setState`.

Elle prouve également une divergence sur une pièce malformée sans
`setPieceId` ni `id` :

- fallback UI : ignore la pièce ;
- sémantique historique/Core actuellement verrouillée : compte le token vide.

Le fallback local ne doit donc pas devenir une autorité de secours concurrente.

### Premier candidat soustractif

Le premier micro-lot recommandé est :

**retirer uniquement `fallbackSetStates()` et le fallback local associé,
après avoir verrouillé la disponibilité du seam canonique set-state.**

Ce lot futur doit être purement soustractif et ne doit pas toucher au rendu,
aux éditeurs ou au stockage.

## 2. Empilement openEquipmentEditor

La chaîne historique caractérisée est :

1. `dungeon-equipment-hotfix-167817.js` ;
2. `dungeon-set-editor-167818.js` ;
3. `gens-equipment-stat-cleanup-1678102.js`.

Chaque couche conserve son marqueur et son `__original`.

Le cleanup canonique ajoute encore une décoration différée via
`setTimeout(...,0)`.

Cet empilement est une dette distincte. Il ne doit pas être nettoyé dans le
même lot que le fallback set-state.

## 3. Empilement saveEquipmentEditor

Chaîne caractérisée :

1. hotfix Equipment ;
2. Set Editor ;
3. invalidateur de cache local du cleanup canonique.

Le correctif cache/invalidation précédent a déjà retiré les cibles mortes et
conserve uniquement la frontière éditeur réellement utile.

La consolidation de `saveEquipmentEditor` doit donc faire l'objet d'un
pré-audit / retrait dédié plus tard, car elle combine encore persistance
d'objet, appartenance de set et invalidation.

## 4. renderDungeonGear

`dungeon-equipment-ui.js` reste l'unique wrapper externe caractérisé de :

`renderDungeonGear`.

Il déclenche un rafraîchissement UI après le rendu historique.

Aucun retrait n'est autorisé sans sentinelle navigateur dédiée.

## 5. Side effects UI historiques

### dungeon-equipment-ui.js

Possède encore :

- listener `change` au niveau document ;
- `MutationObserver` sur `documentElement` ;
- refresh via `requestAnimationFrame` ou `setTimeout(0)` ;
- wrapper de `renderDungeonGear`.

Ces effets appartiennent à une couche UI historique, pas au Core Inventory.

### dungeon-set-editor-167818.js

Possède encore :

- listeners document `change` et `click` ;
- callback click différé `setTimeout(...,0)` ;
- wrappers `openEquipmentEditor` et `saveEquipmentEditor`.

### gens-equipment-stat-cleanup-1678102.js

Possède encore :

- décoration éditeur différée ;
- retry d'installation à 25 ms si Stats / DOM ne sont pas prêts ;
- wrapper `openEquipmentEditor` ;
- handlers canoniques de set/évolution.

Ces dettes doivent être traitées par petits lots de propriétaire, jamais par
suppression globale.

## TDD

Sentinelle :

`tests/gens_phase4_inventory_equipment_legacy_ui_preaudit_v1.test.cjs`.

Elle verrouille :

- présence du seam set-state historique ;
- fallback UI encore présent ;
- parité sur pièces valides ;
- divergence sur pièce malformée ;
- chaînes open/save editor ;
- wrapper `renderDungeonGear` ;
- observer/listeners/timers UI ;
- premier candidat soustractif ;
- absence de modification runtime.

La première exécution CI du pré-audit a échoué uniquement à cause d'une
fixture VM qui cherchait le Core sous `ctx.ROOT` au lieu du `globalThis`
de la VM.

Correction test uniquement :

`3ac7b8f7e2dd2887989495103cbc6d6ce38e2ea0`.

Aucun runtime n'a été modifié pour corriger ce RED de fixture.

## Validation technique

HEAD technique :

`3ac7b8f7e2dd2887989495103cbc6d6ce38e2ea0`.

- Architecture + navigateur complet :
  `35643807612` — SUCCESS ;
- Firefox :
  `35643807408` — SUCCESS ;
- Tactical Dock :
  `35643807525` — SUCCESS.

## Périmètre respecté

Diff depuis la base :

- `docs/GENSRPG_CURRENT_WORK.md` ;
- sentinelle de pré-audit ;
- entrée CI.

Aucun changement de :

- `index.html` ;
- runtime Equipment ;
- rendu ;
- stockage ;
- sets/bonus/évolution/cache ;
- Stats/Tactical/combat ;
- Pages/preview/PWA.

## Sortie du lot

La présente documentation change le SHA.

Conformément à la charte :

1. revalider les trois batteries sur le SHA documentaire exact ;
2. créer le checkpoint GREEN du pré-audit uniquement après trois SUCCESS ;
3. ouvrir ensuite un lot séparé pour le retrait minimal du fallback set-state ;
4. ce retrait doit commencer par un RED exigeant le seam canonique et
   l'absence de fallback local ;
5. ne jamais toucher `main`.
