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


## Validation technique complète S4

SHA technique validé :
`54d9aba4acb3456e3c01f00c1aa5c6f629c92095`.

CI :
- Architecture + navigateur complet : `35975357431` — SUCCESS ;
- Firefox : `35975357435` — SUCCESS ;
- Tactical Dock : `35975357498` — SUCCESS.

Runtime final candidat :
- taille `8172529` ;
- blob `696014056409dda9b6ef25ace58dfd9d5f9e2718`.

Providers publics :
- Survival : raccordé ;
- Capture : raccordé ;
- Dungeon : raccordé ;
- PvP : absent.

Le bouton production et les cinq propriétaires historiques restent inchangés.
Aucun mécanisme one-shot ne reste chargé.

### Note de validation

Le legacy `Dungeon après Survival` a présenté une occurrence aléatoire
`battle-already-open` lors d'une première exécution. Une relance du même job,
sur le même SHA, a passé ce scénario avant de poursuivre. Aucun correctif gameplay
n'a été appliqué pour cette occurrence.

Le test navigateur S4 a ensuite été corrigé d'une erreur syntaxique de génération
(`\\n` littéral après le premier `require`), sans changement runtime.

Le SHA documentaire de clôture doit repasser la triple CI avant checkpoint GREEN final.
