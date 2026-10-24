# GenSrpG — Phase 4 Core Inventory / Equipment — retrait du hook openEquipmentEditor de Hero Art Repair

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-hero-art-open-hook-retirement-2026-09-21`.
- Base exacte :
  `c5f8b60cc130d6df12651c317285ed209eddd5c2`.
- Dernier checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-inventory-equipment-open-wrapper-preaudit-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Cause architecturale

Le pré-audit `openEquipmentEditor` a prouvé que
`gens-dungeon-hero-art-repair-167874.js` participait au cycle d'ouverture
Equipment via son hook générique :

`hookAll() -> hook("openEquipmentEditor")`.

Cette couche exécutait seulement :
- le propriétaire précédent ;
- `repairDefs()` ;
- `schedule()`.

Elle ne possède ni :
- les données Equipment ;
- l'UI des bonus RPG ;
- l'UI de sets ;
- l'évolution Equipment ;
- le stockage Equipment.

Les propriétaires dédiés existent déjà :
- `dungeon-equipment-hotfix-167817.js` ;
- `dungeon-set-editor-167818.js` ;
- `gens-hero-editor-dynamic-167897.js` ;
- `gens-equipment-stat-cleanup-1678102.js`.

## TDD

### Caractérisation navigateur avant correctif

Sentinelle :
`tests/gens_phase4_inventory_equipment_hero_art_open_hook_browser_v1.test.cjs`.

La fixture utilise notamment le vrai Core :
`assets/gensrpg/core/inventory-equipped-view-v1.js`.

Elle vérifie :
- l'ouverture native exactement une fois ;
- l'UI canonique `rpgBonuses` ;
- la section Set Editor synchronisée ;
- les trois niveaux d'évolution canoniques ;
- le masquage des contrôles legacy mono-stat ;
- les réparations d'arts héros et participants ;
- la stabilité après la fenêtre historique de retry du Hero Editor Dynamic.

Preuve de caractérisation ciblée :
- workflow temporaire isolé `35651278948` — SUCCESS.

Le workflow temporaire a ensuite été supprimé du dépôt.

### RED propriétaire

Sentinelle :
`tests/gens_phase4_inventory_equipment_hero_art_open_hook_owner_v1.test.cjs`.

SHA RED :
`2bddbef1f22e5a30736157a820ff246ea2efb066`.

Run Architecture :
`35650600108`.

Échec attendu et unique du garde :
`Hero Art Repair must retire its unrelated openEquipmentEditor hook`.

Firefox et Tactical étaient GREEN sur ce même état RED.

## Correctif soustractif

Commit runtime :
`d2725f2a7bd515e7f37a6bf82435976d0e336e0d`.

Modification unique dans
`assets/gensrpg/gens-dungeon-hero-art-repair-167874.js` :

avant :
`["ensureDungeonHeroes","renderParticipantSelector","renderMenu","openHeroCreator","hcRenderRpgStatsUsage","openEquipmentEditor"]`

après :
`["ensureDungeonHeroes","renderParticipantSelector","renderMenu","openHeroCreator","hcRenderRpgStatsUsage"]`

Aucun nouveau wrapper, observer, timer, retry, fallback ou stockage n'a été ajouté.

## Réalignement des sentinelles

L'ancienne sentinelle de pré-audit attendait encore cinq participants
`openEquipmentEditor`.

Après le retrait, elle a été réalignée pour attendre quatre propriétaires :
- Equipment hotfix ;
- Set Editor ;
- Hero Editor Dynamic ;
- Equipment Stat Cleanup.

Elle exige aussi désormais explicitement que Hero Art Repair ne contienne plus
le token `"openEquipmentEditor"`.

## Périmètre réellement modifié

Runtime :
- `assets/gensrpg/gens-dungeon-hero-art-repair-167874.js` uniquement.

Tests / CI / documentation :
- sentinelle navigateur ciblée ;
- garde propriétaire ;
- pré-audit réaligné ;
- workflow Architecture ;
- présent document ;
- `GENSRPG_CURRENT_WORK.md`.

Non modifiés :
- `saveEquipmentEditor` ;
- hotfix Equipment ;
- Set Editor ;
- Hero Editor Dynamic ;
- Equipment Cleanup ;
- `renderDungeonGear` ;
- observers/listeners/timers existants ;
- stockage ;
- bonus/sets ;
- évolution ;
- cache ;
- Stats gameplay ;
- Tactical / combat ;
- `index.html` ;
- `main`.

## Validation technique avant clôture documentaire

SHA documentaire candidat :
`917497395ab3cbd06f86df70a2285e80a30d7dc1`.

Résultats :
- Architecture + navigateur complet `35651753018` — SUCCESS ;
- Firefox `35651752932` — SUCCESS ;
- Tactical Dock contrat + Chromium + Firefox `35651752858` — SUCCESS.

Le navigateur complet a notamment validé :
- Dungeon après Survie ;
- Builder ;
- Config objet moderne ;
- cache / retour / pièges authored ;
- Save & Quit / reprise ;
- Capture ;
- PvP ;
- non-interférence ;
- murs Tactical ;
- preview ;
- resolver d'assets ;
- la nouvelle caractérisation Equipment sans dépendance au hook Hero Art.

La présente mise à jour documentaire change le SHA. Conformément à la charte,
le checkpoint GREEN final ne sera créé qu'après revalidation des trois batteries
sur le SHA documentaire exact de clôture.

Checkpoint cible :
`checkpoint/gensrpg-phase4-inventory-equipment-hero-art-open-hook-retirement-green-2026-09-21`.

## Prochaine dette séparée

Le pré-audit a aussi mis en évidence que Hero Editor Dynamic réessaie
`installWrappers()` pendant plusieurs secondes avec le marqueur `__canon101`,
tandis qu'Equipment Cleanup utilise `__canonEq102`.

Cette dette ne fait pas partie du présent lot et ne doit pas être corrigée ici.
