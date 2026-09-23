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


## Candidat runtime S1

TDD RED acquis au SHA :
`08d15900e001bd5b69b5d81717d38a120c8937fc`.

Run Architecture RED :
`35931646797`.

Échec unique attendu :
`Raccorder le registre Shell module-launch S1`.

Firefox et Tactical restaient GREEN.

Runtime raccordé par mécanisme one-shot temporaire, supprimé dans le même commit.

Commit runtime :
`438f3a3feaae2d2e3c7c1891c25be58a375631cb`.

Empreinte après S1 :
- taille `8171576` octets ;
- blob `12be0fdbaa5c05f7852933b48a3dd5df09da6145`.

Diff runtime :
- insertion de 19 lignes uniquement ;
- registre `GensShellModuleLaunchV1` placé entre ScreenReturn et `goMenu()` ;
- aucun provider enregistré ;
- aucun appel production au nouveau registre ;
- aucun second resolver ;
- les cinq wrappers `startConfiguredGame` sont inchangés.

Mécanismes temporaires vérifiés absents après le commit :
- `.github/runtime-patches/gens_phase5_module_launch_s1_shell_registry.patch` ;
- `.github/workflows/gensrpg-phase5-apply-module-launch-s1.yml`.

Le hash cible erroné d'un premier essai one-shot a provoqué un échec avant commit runtime.
Il a été corrigé avant toute modification persistante du runtime.

### Validation obligatoire du candidat

Déclencher maintenant la triple CI complète sur un SHA documentaire descendant de
`438f3a3f...`.

Ne créer aucun checkpoint GREEN avant :
- Architecture + navigateur complet SUCCESS ;
- Firefox SUCCESS ;
- Tactical Dock SUCCESS.

Aucun merge sur `main`.


## Validation technique GREEN avant clôture documentaire

SHA technique final :
`3056eb3a16e9c85f4976d47592e033890414d2ad`.

CI :
- Architecture + navigateur complet : run `35934434891` — SUCCESS ;
- Tactical Dock : run `35934434987` — SUCCESS ;
- Firefox wall : run `35934435046` — SUCCESS.

La batterie navigateur complète a notamment validé :
- Survie après Dungeon ;
- Fouiller et arts Survie ;
- retours `goMenu` ;
- Dungeon map -> Tactical V2 ;
- Capture victoire + reprise inter-module ;
- Dungeon après Survie ;
- Dungeon Builder réel ;
- Config objet moderne ;
- fiche RPG sans flash Survie ;
- `openChar` sans Core 0.28 ;
- cache / retour / pièges authored ;
- Save & Quit + reprise ;
- PvP placeholder ;
- Monster Capture ;
- Capture en composition complète ;
- non-interférence des quatre modules ;
- murs ;
- preview ;
- résolution d'assets ;
- Equipment.

Runtime final S1 inchangé depuis le commit runtime :
- taille `8171576` ;
- blob `12be0fdbaa5c05f7852933b48a3dd5df09da6145`.

Les réalignements ultérieurs concernent uniquement les cartographies et sentinelles
d'empreinte qui suivent le runtime courant ; aucune assertion métier n'a été supprimée
ni affaiblie.

Les mécanismes temporaires sont absents :
- `.github/runtime-patches/gens_phase5_module_launch_s1_shell_registry.patch` ;
- `.github/workflows/gensrpg-phase5-apply-module-launch-s1.yml`.

## Clôture finale obligatoire

La présente clôture documentaire change le SHA.

Avant le checkpoint GREEN final, ce nouveau SHA doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Checkpoint cible :
`checkpoint/gensrpg-phase5-module-launch-s1-shell-registry-green-2026-09-24`.

Après checkpoint GREEN :
- créer une preview téléphone complète avec la même composition que GitHub Pages ;
- obtenir la validation utilisateur ;
- seulement ensuite ouvrir S2 — provider Survival.

Aucun merge sur `main`.
