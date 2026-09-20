# GenSrpG — Phase 4 Storage — Capture Gameplay-by-Profile

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-gameplay-by-profile-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-gameplay-by-profile-2026-09-20`

Base exacte :
`3e549bc6d53cd8c93918f3c56781b8bd71c1c98b`
(`checkpoint/gensrpg-phase4-storage-next-audit-7-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Périmètre unique

Migrer uniquement :
`gensrpg_rpg_gameplay_by_profile_v1`

Propriétaire :
`builtinMonsterCapture162`.

Sous-responsabilité ciblée :
seed de configuration gameplay du profil Monster Capture embarqué.

État source exact :
- `index.html` : `8 174 580` octets ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad` ;
- 1 lecture JSON directe ;
- 1 écriture JSON directe conditionnelle.

## Contrat historique

Lecture :
`JSON.parse(localStorage.getItem(key)||"{}")||{}`
dans le `try/catch` interne.

Parité à conserver :
- absence / chaîne vide -> `{}` ;
- `null`, `false`, `0`, chaîne vide JSON -> `{}` via `||{}` ;
- JSON invalide / erreur de lecture -> `{}` ;
- primitives truthy et tableaux restent acceptés selon la sémantique historique.

Seed :
- uniquement si `!map[MC162_ID]` ;
- valeur = clone JSON de `MC162_GAMEPLAY` ;
- une valeur utilisateur existante n'est jamais remplacée.

Écriture :
`localStorage.setItem(key,JSON.stringify(map))`.

Les erreurs d'écriture/sérialisation remontent au `try/catch` externe historique, qui journalise `Seed gameplay Capture`.

## Autorité cible

Core Storage possède uniquement le transport JSON :
- lecture -> `GensStorageV1.readJson(localStorage,key,{})||{}` ;
- écriture -> `GensStorageV1.writeJson(localStorage,key,map)`.

Monster Capture reste propriétaire :
- de la clé ;
- du profil `MC162_ID` ;
- de `MC162_GAMEPLAY` ;
- de la condition de seed ;
- du clone ;
- de la politique de non-écrasement ;
- du warning externe.

Les autres seeds et stockages de `builtinMonsterCapture162` restent directs et hors périmètre.

## Micro-diff déterministe

Source :
- taille : `8 174 580` ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Cible :
- taille : `8 174 580` ;
- blob : `0b9c41c39db0d073c7b9ed580f66140b8d9bcda2`.

Exactement deux lignes de transport doivent changer.

## Tests

- `tests/gens_phase4_storage_gameplay_by_profile_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_gameplay_by_profile_owner_v1.test.cjs`.

La garde owner est volontairement ajoutée avant raccord : elle doit être RED tant que les deux accès directs ciblés existent.

## Hors périmètre

- tout autre seed Capture ;
- créatures/capacités/règles de capture/équipements ;
- Challenge Library ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats/Tactical/Runtime Repair ;
- observer/timer/retry/wrapper ;
- tout merge sur `main`.

## Validation requise

Avant checkpoint GREEN :
- parité GREEN ;
- garde owner GREEN après raccord ;
- autres stockages Capture inchangés ;
- manifeste Phase 2 avancé de 2 accès seulement ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.
