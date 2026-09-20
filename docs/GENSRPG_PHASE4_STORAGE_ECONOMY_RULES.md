# GenSrpG — Phase 4 Storage — Dungeon Economy Rules

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-economy-rules-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-economy-rules-2026-09-20`

Base exacte :
`0cc5c00d340d8f46922e8ebb310859b6190e1ca4`
(`checkpoint/gensrpg-phase4-storage-next-audit-6-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Périmètre unique

Migrer uniquement :
`gensrpg_dungeon_economy_rules_160`

Propriétaire :
`dungeonEconomy160`.

État source exact :
- `index.html` : 8 174 580 octets ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c` ;
- 1 lecture JSON directe des règles ;
- 1 écriture JSON directe des règles.

## Frontière d'autorité

Core Storage possédera uniquement le transport JSON de `DUNGEON_ECO_RULES_160`.

Dungeon Economy reste propriétaire :
- des valeurs par défaut ;
- du merge `Object.assign` ;
- de `chestMode` ;
- de `randomSearchChance` ;
- de `merchantMode` ;
- de `sellLootEnabled` ;
- de l'UI MJ ;
- des coffres, fouilles, marchands, loot et récompenses.

Restent explicitement directs et hors périmètre :
- session dynamique `gensrpg_dungeon_session_eco_160_<profileId>` : 1 lecture + 1 écriture ;
- inventaire héros via `key(heroId)` : 1 écriture.

## Contrat historique

Lecture :
`Object.assign(d, JSON.parse(localStorage.getItem(DUNGEON_ECO_RULES_160) || "{}"))`
dans le `try/catch` historique.

Parité à conserver :
- absence / chaîne vide -> defaults ;
- JSON invalide / erreur de lecture -> defaults ;
- `null` -> defaults ;
- objets -> merge dans defaults ;
- primitives/tableaux -> sémantique native `Object.assign` inchangée.

Écriture :
`localStorage.setItem(DUNGEON_ECO_RULES_160, JSON.stringify(r || dungeonEconomyRules160()))`.

Les erreurs de sérialisation et de stockage restent propagées.

## Raccord cible

Lecture :
`GensStorageV1.readJson(localStorage,DUNGEON_ECO_RULES_160,{})`
sous le même `try/catch`.

Écriture :
`GensStorageV1.writeJson(localStorage,DUNGEON_ECO_RULES_160,r||dungeonEconomyRules160())`.

Aucune migration de schéma.

## Micro-diff déterministe

Source :
- taille : `8 174 580` ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

Cible :
- taille : `8 174 580` ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Exactement deux lignes de transport doivent changer.

## Tests

- `tests/gens_phase4_storage_economy_rules_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_economy_rules_owner_v1.test.cjs`.

La garde owner est volontairement ajoutée avant le raccord : elle doit être RED tant que les deux accès directs des règles existent.

## Hors périmètre

- session Economy dynamique ;
- inventaire héros ;
- loot/coffres/fouilles/marchands ;
- UI MJ ;
- `gensrpg_dungeon_runtime_v2` ;
- Challenge Library ;
- Gameplay-by-profile ;
- Stats/Tactical/Capture/Survie ;
- observer/timer/retry/wrapper ;
- tout merge sur `main`.

## Validation requise

Avant checkpoint GREEN :
- parité GREEN ;
- garde owner GREEN après raccord ;
- session dynamique et inventaire héro inchangés ;
- manifeste Phase 2 avancé de 2 accès constants seulement ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.
