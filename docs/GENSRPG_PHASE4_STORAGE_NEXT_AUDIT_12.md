# GenSrpG — Phase 4 Storage — Audit suivant 12

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-storage-next-audit-12-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-next-audit-12-2026-09-20`.
- Base exacte / dernier GREEN : `08a93ef71f2d9fef656260e29bba812f376d2d0e`.
- Checkpoint GREEN précédent : `checkpoint/gensrpg-phase4-storage-economy-session-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.
- Aucun raccord runtime dans cet audit.

## État de départ

`index.html` :
- taille : `8 174 580` octets ;
- blob : `1545aba502777d9fb76decdcee90a89c7cf3f971`.

Cartographie Storage directe :
- total : `185` ;
- résolus : `120` ;
- non résolus : `65` ;
- clés résolues directes : `20`.

Dungeon :
- `153 / 103 / 50 / 12`.

Audit 12 a aussi détecté que les compteurs Storage étaient à jour mais que
`docs/GENSRPG_PHASE2_STORAGE_OWNERS.json.sourceIndexBlob` était resté sur une
ancienne empreinte. Cette empreinte descriptive a été réalignée sur
`1545aba502777d9fb76decdcee90a89c7cf3f971`, sans changement runtime.

## Inventaire des familles restantes

Les familles présentant `removeItem`, une compatibilité historique mixte,
un miroir de profil, un état runtime massif ou un mélange JSON/scalaires restent
différées :
- `gensrpg_dc048_pending_trap_v1` ;
- `gensrpg_dc052_special_branch_v1` ;
- préfixe challenge door `gensrpg_dc064_door_challenge_*` ;
- `gensrpg_dungeon_core01_device_hero_v1` ;
- `gensrpg_dungeon_runtime_v2` ;
- `gensrpg_forced_mode_reload_155` ;
- `gensrpg_session_profile_100_v1` ;
- `gensrpg_rpg_gameplay_by_profile_v1` et son miroir/seed Capture ;
- familles Capture shared entities ;
- Runtime Repair / profil tactique.

La priorité est restée un transport JSON simple déjà compatible avec
`GensStorageV1`, sans extension du service Core.

## Candidat retenu

Clé :
`gensrpg_dungeon_mj_rules_v145`.

Accès directs prouvés :
- 1 `getItem` JSON ;
- 2 `setItem` JSON ;
- 0 `removeItem`.

Propriétaires actifs :
1. `dungeonMj72_2Script` — domaine Dungeon ;
2. `gensStability151` — frontière Core/stabilité avec responsabilité Dungeon MJ déclarée.

Aucun autre propriétaire inline.
Aucun fichier JavaScript externe suivi par Git ne contient cette clé.
Le manifeste Phase 2 confirme exactement ces deux sources.

## Ordre de bootstrap

`assets/gensrpg/core/storage-v1.js` est chargé avant les deux propriétaires.
Un futur micro-raccord n'exige donc ni nouveau bootstrap, ni wrapper, ni retry,
ni autorité parallèle.

## Contrat lecteur

Propriétaire :
`window.dungeonMjRules151` dans `gensStability151`.

Defaults :
- `xpMultiplier: 1` ;
- `goldMultiplier: 1` ;
- `lootMultiplier: 1` ;
- `difficulty: 2` ;
- `enemyControl: "ai"` ;
- `initiativeMode: "strict"` ;
- `aiTactics: "standard"` ;
- `mixedBossMj: true` ;
- `eventFrequency: 2`.

Transport actuel :
`JSON.parse(localStorage.getItem("gensrpg_dungeon_mj_rules_v145")||"{}")`.

Le résultat est fusionné par :
`Object.assign(d,old||{})`.

Le `try/catch` historique englobe lecture, parse et fusion :
- absence/chaîne vide -> defaults ;
- JSON invalide -> defaults ;
- `null`/valeurs falsy -> defaults ;
- objet -> surcharge des defaults ;
- tableau/chaîne/valeurs truthy gardent la sémantique native `Object.assign` ;
- erreur `getItem` -> defaults.

La caractérisation compare ces cas au candidat
`GensStorageV1.readJson(localStorage,key,{})` et obtient la même sortie.

## Contrats writers distincts

### `saveDungeonMj151` — `gensStability151`

- reconstruit les valeurs depuis l'UI ;
- écrit la règle complète ;
- ferme ensuite `#dungeonMj151`.

Il n'y a pas de catch autour de l'écriture :
- erreur de sérialisation/écriture : propagée ;
- fermeture UI non exécutée après échec.

Le futur raccord doit conserver cet ordre et cette propagation.

### `saveDungeonMjUnified175` — `dungeonMj72_2Script`

- reconstruit les valeurs depuis l'UI unifiée ;
- écrit la même clé ;
- appelle ensuite `gensReconcile171("mj175-save")` puis
  `gensReconcile151("mj175-save")`.

Tout le writer est dans un `try/catch` externe :
- erreur de sérialisation/écriture : avalée historiquement ;
- les deux reconciles ne s'exécutent pas après un échec d'écriture.

Le futur raccord doit conserver cette frontière d'erreur différente de
`saveDungeonMj151`.

## Parité du transport Core

Audit :
`tests/gens_phase4_storage_next_audit_12_v1.test.cjs`.

La sentinelle rejoue :
- absence ;
- chaîne vide ;
- `null` ;
- nombres/booléens ;
- chaîne JSON ;
- tableaux ;
- objet vide ;
- JSON invalide ;
- objet MJ partiel + champ inconnu ;
- erreur de lecture ;
- valeurs d'écriture variées ;
- erreur de sérialisation circulaire ;
- erreur `setItem`.

Résultat : transport candidat Core équivalent au transport direct pour ce
sous-périmètre, sous réserve de conserver les catches et ordres propres aux
deux propriétaires.

## Micro-diff futur déterministe

Remplacements candidats, uniquement dans un lot séparé :

Lecture :
`JSON.parse(localStorage.getItem("gensrpg_dungeon_mj_rules_v145")||"{}")`
->
`GensStorageV1.readJson(localStorage,"gensrpg_dungeon_mj_rules_v145",{})`.

Deux écritures :
`localStorage.setItem("gensrpg_dungeon_mj_rules_v145",JSON.stringify(r))`
->
`GensStorageV1.writeJson(localStorage,"gensrpg_dungeon_mj_rules_v145",r)`.

Simulation en mémoire :
- taille cible : `8 174 580` octets ;
- blob cible déterministe :
  `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Aucun autre changement fonctionnel n'est requis.

## Décision Audit 12

**Retenir `gensrpg_dungeon_mj_rules_v145` comme prochain micro-lot Storage.**

Justification :
- responsabilité homogène : règles MJ Dungeon ;
- JSON pur ;
- 3 transports seulement ;
- zéro remove ;
- deux propriétaires explicitement cartographiés ;
- Core Storage chargé avant eux ;
- parité transport démontrée ;
- micro-diff déterministe ;
- pas d'extension de `GensStorageV1`.

Le raccord n'est volontairement pas appliqué dans Audit 12.

## Frontières du futur lot

Le futur lot MJ Rules ne devra modifier que les trois transports de cette clé et
les tests/manifestes/empreintes rendus obsolètes.

Hors périmètre :
- contenu et valeurs des règles MJ ;
- UI des panneaux MJ ;
- reconcile 151/171 ;
- Dungeon Scene ;
- Economy ;
- inventaire héros ;
- Pending Trap / Special Branch ;
- gameplay mirror ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats ;
- Tactical ;
- Capture ;
- Survival ;
- bootstrap ;
- assets.

Aucun observer, timer/retry, wrapper, monkey-patch ou seconde autorité.

## Validation Audit 12

HEAD validé avant clôture documentaire :
`daced49432f74752c48b8fb838302954c880ab7e`.

Runs :
- Architecture + navigateur complet : `35533486808` — SUCCESS ;
- Firefox : `35533486747` — SUCCESS ;
- Tactical Dock : `35533486690` — SUCCESS.

Le navigateur complet a repassé notamment Dungeon après Survie, Builder,
Config objet, fiche RPG, cache/pièges authored, Save & Quit/reprise, PvP,
Capture, non-interférence quatre modules, murs, preview et resolver d'assets.

Le diff Audit 12 ne contient aucun changement runtime.
La clôture documentaire doit elle-même repasser les trois workflows sur son SHA
exact avant création de
`checkpoint/gensrpg-phase4-storage-next-audit-12-green-2026-09-20`.
