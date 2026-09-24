# GenSrpG — Phase 5 / module-launch S4 — provider Dungeon

Date : 2026-09-24

## Base obligatoire

- Pré-audit GREEN :
  `checkpoint/gensrpg-phase5-module-launch-s4-dungeon-provider-preaudit-green-2026-09-24`.
- SHA :
  `3f3e9a0f5492839df6c32ac7f05544450a587425`.
- Runtime :
  taille `8172204`,
  blob `6c95e3f6ca4bf8e34003776e7e43e44192aafb16`.
- Production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission unique

Raccorder **Dungeon uniquement** au registre public module-launch.

S4 ne change pas le callsite production et ne retire aucun propriétaire historique.

## Raccord cible

Dans `dungeonCore200Rebuild`, immédiatement après l'installation du dernier
`window.startConfiguredGame` Dungeon :

1. capturer cette fonction dans
   `gensDungeonStartConfiguredGame200V1` ;
2. déclarer `gensDungeonStartModuleSessionV1` ;
3. vérifier `gensShellActiveModuleV1() === "dungeon"` ;
4. déléguer à la référence Core200 capturée ;
5. retourner `true` lorsque Dungeon a pris la demande ;
6. enregistrer `dungeon` dans `GensShellModuleLaunchV1`.

Le provider reste routing-only.

## Invariants

- Survival S2 conservé ;
- Capture S3 conservé ;
- aucun provider PvP ;
- cinq propriétaires historiques conservés ;
- bouton production inchangé ;
- aucune bascule de production vers le registre ;
- aucun observer/timer/retry/polling ;
- aucun changement Dungeon/Tactical gameplay.

## TDD RED

Sentinelle statique :
`tests/gens_phase5_module_launch_s4_dungeon_provider_v1.test.cjs`.

Échec attendu :
absence de `gensDungeonStartConfiguredGame200V1`.

Preuve navigateur :
`tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs`.

Elle reprend le vrai round-trip Dungeon Save & Quit/reprise, mais le lancement initial
passe par :
`GensShellModuleLaunchV1.startModuleSession("dungeon")`.

Le test legacy Save & Quit/reprise reste exécuté en parallèle avec son bouton
`startConfiguredGame()`.

## Critère de sortie

Après RED :
- patch runtime minimal ;
- sentinelle S4 GREEN ;
- ancien lancement Dungeon GREEN ;
- provider Dungeon GREEN ;
- Dungeon -> Tactical GREEN ;
- Save & Quit/reprise GREEN ;
- Dungeon après Survival GREEN ;
- Survival/Capture providers GREEN ;
- non-interférence GREEN ;
- Architecture + navigateur, Firefox, Tactical Dock GREEN ;
- clôture documentaire ;
- checkpoint S4 GREEN ;
- preview téléphone + validation utilisateur avant toute bascule d'autorité globale.

Aucun merge sur `main`.
