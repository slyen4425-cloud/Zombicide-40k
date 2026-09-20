# GenSrpG — Phase 4 Storage — MJ Rules

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-storage-mj-rules-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-storage-mj-rules-2026-09-20`.
- Base exacte / dernier GREEN : `7dc5efd6eca596fdf58a1d391bcafa1685ceb633`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-storage-next-audit-12-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission

Raccorder uniquement la persistance JSON de :

`gensrpg_dungeon_mj_rules_v145`

vers `GensStorageV1`, sans déplacer l'autorité métier ni modifier règles, UI,
reconciles, bootstrap ou autres familles Storage.

Source d'audit :
`docs/GENSRPG_PHASE4_STORAGE_NEXT_AUDIT_12.md`.

## Propriétaires prouvés

### `gensStability151`

Contient :
- le lecteur `dungeonMjRules151` ;
- un writer via `saveDungeonMj151`.

Responsabilité déclarée :
frontière de stabilité Core incluant les paramètres Dungeon MJ.

### `dungeonMj72_2Script`

Contient :
- un second writer via le panneau MJ unifié.

Responsabilité déclarée :
Dungeon MJ scene state / helpers / persistence.

Aucune autre occurrence inline ou dans les fichiers JS suivis n'a été trouvée.

## Transports ciblés

Lecture actuelle :

`JSON.parse(localStorage.getItem("gensrpg_dungeon_mj_rules_v145")||"{}")`

Cible :

`GensStorageV1.readJson(localStorage,"gensrpg_dungeon_mj_rules_v145",{})`

Deux écritures actuelles :

`localStorage.setItem("gensrpg_dungeon_mj_rules_v145",JSON.stringify(r))`

Cible :

`GensStorageV1.writeJson(localStorage,"gensrpg_dungeon_mj_rules_v145",r)`

Aucun `removeItem`.

## Contrat du lecteur

Defaults inchangés :

- `xpMultiplier:1`
- `goldMultiplier:1`
- `lootMultiplier:1`
- `difficulty:2`
- `enemyControl:"ai"`
- `initiativeMode:"strict"`
- `aiTactics:"standard"`
- `mixedBossMj:true`
- `eventFrequency:2`

Le lecteur conserve son `try/catch` historique et :

`Object.assign(d,old||{})`

Doivent rester identiques :
- absence / chaîne vide ;
- JSON invalide ;
- null / valeurs falsy ;
- objets partiels ;
- tableaux / chaînes truthy selon la sémantique native `Object.assign` ;
- erreur de `getItem`.

## Contrat writer `saveDungeonMj151`

Ordre historique :

1. reconstruire `r` depuis l'UI ;
2. écrire `r` ;
3. fermer le panneau `#dungeonMj151`.

Pas de catch autour du write :
- erreur JSON ou storage propagée ;
- fermeture UI non exécutée après échec.

Le raccord Core ne doit pas absorber cette erreur.

## Contrat writer `saveDungeonMjUnified175`

Ordre historique :

1. reconstruire `r` depuis l'UI unifiée ;
2. écrire `r` ;
3. `gensReconcile171("mj175-save")` ;
4. `gensReconcile151("mj175-save")`.

Tout ce chemin est dans un catch externe historique :
- erreur JSON/storage avalée ;
- les reconciles ne s'exécutent pas après l'échec.

Le raccord Core doit conserver cette frontière distincte.

## TDD

Avant raccord runtime :

1. conserver `tests/gens_phase4_storage_next_audit_12_v1.test.cjs` ;
2. ajouter `tests/gens_phase4_storage_mj_rules_parity_v1.test.cjs` ;
3. ajouter `tests/gens_phase4_storage_mj_rules_owner_v1.test.cjs` ;
4. brancher les deux nouveaux tests dans Architecture ;
5. la garde owner doit être RED avant le raccord ;
6. la parité doit être GREEN avant et après.

Après raccord :
- Audit 12 GREEN ;
- parité GREEN ;
- owner guard GREEN ;
- uniquement les fingerprints/manifeste réellement obsolètes sont réalignés ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.

## Source exacte et cible déterministe

Source :
- taille `8 174 580` ;
- blob `1545aba502777d9fb76decdcee90a89c7cf3f971`.

Candidat déjà vérifié localement :
- taille `8 174 580` ;
- blob `5b9b9ae780f735eadef049afeb10acf0b57441fe`;
- 1 lecture Core ;
- 2 écritures Core ;
- 0 anciens transports ciblés.

## Frontières

Hors lot :
- contenu/valeurs MJ ;
- rendu des formulaires MJ ;
- reconcile 151/171 ;
- Dungeon Scene ;
- Economy ;
- inventaire héros ;
- Pending Trap / Special Branch ;
- gameplay-by-profile ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats ;
- Tactical ;
- Capture ;
- Survival ;
- bootstrap ;
- assets.

Aucun observer, timer/retry, wrapper ou monkey-patch.

## Critère de sortie

GREEN uniquement si :
- 0 accès directs ciblés restent ;
- 1 Core read + 2 Core writes sont présents ;
- les deux frontières d'erreur distinctes sont préservées ;
- le diff runtime reste limité à ces 3 transports ;
- la cartographie Storage avance seulement du nombre réellement migré ;
- les trois validations requises passent sur le HEAD final ;
- un checkpoint GREEN dédié est créé ;
- `main` reste inchangé.
