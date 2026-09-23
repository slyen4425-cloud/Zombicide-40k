# GenSrpG — Phase 5 / module-launch S1 — Shell registry raccord

Date : 2026-09-24

## Base

- Branche :
  `work/gensrpg-phase5-module-launch-s1-shell-registry-2026-09-24`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-launch-s1-shell-registry-2026-09-24`
- Base GREEN :
  `checkpoint/gensrpg-phase5-module-launch-raccord-runtime-preaudit-green-2026-09-24`
- SHA de base :
  `05360ddd5a48aed2ec80e6fb1d373e5d3d1bfdac`
- Runtime de base :
  `8170726` octets,
  blob `d9ee34d47fa888795db68cdc244d0c73d30ee523`.
- Production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission unique

Ajouter dans le propriétaire Shell natif, à côté de
`GensShellScreenReturnV1`, le registre public :

`GensShellModuleLaunchV1`.

S1 ne raccorde aucun provider et ne modifie aucun chemin de lancement existant.

## API cible

- `register(moduleId, handler)`
- `activeModule: gensShellActiveModuleV1`
- `startModuleSession(moduleId=gensShellActiveModuleV1())`

Modules admissibles :
- survival
- dungeon
- capture
- pvp

Un provider absent retourne `false`.

Un provider doit retourner strictement `true` pour signaler `handled`.

Les erreurs sont contenues à la frontière Shell et retournent `false`.

## Interdictions S1

- aucune modification des cinq wrappers `startConfiguredGame` ;
- aucun provider enregistré ;
- aucun appel du nouveau service depuis `startConfiguredGame` ;
- aucun second resolver de module ;
- aucun DOM ;
- aucun stockage ;
- aucun observer ;
- aucun listener ;
- aucun timer/retry/polling ;
- aucune modification Capture/Dungeon/Survival/PvP/Tactical/Builder/Stats ;
- aucun merge sur `main`.

## TDD

Sentinelle :
`tests/gens_phase5_module_launch_s1_shell_registry_v1.test.cjs`.

RED attendu sur la base :
absence de `GensShellModuleLaunchV1`.

Toutes les autres assertions doivent décrire la base saine :
- runtime exact ;
- resolver unique ;
- propriétaire Shell natif ;
- cinq wrappers historiques ;
- aucun raccord provider.

## Patch cible

Insertion uniquement entre :
- `window.GensShellScreenReturnV1=Object.freeze(...)`
- et `function goMenu()`.

Aucun autre endroit du runtime ne doit changer.

## Validation

Après patch :
- nouvelle sentinelle GREEN ;
- cartographies/empreintes réalignées uniquement si les sentinelles exactes l'exigent ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;
- preview téléphone si le lot modifie le runtime de production.

Aucun retrait historique dans S1.
