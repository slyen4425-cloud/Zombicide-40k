# GenSrpG — Phase 4 Storage — Challenge Library

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-challenge-library-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-challenge-library-2026-09-20`

Base exacte :
`c6d971d2de22c9e875e692102d9d1ac128a4ebf5`
(`checkpoint/gensrpg-phase4-storage-next-audit-8-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Périmètre unique

Migrer uniquement le transport JSON de :
`gensrpg_challenge_library_v1`.

Propriétaires :
- `dungeonCore051ExplorationPolish` ;
- `dungeonCore200Rebuild` ;
- `dungeonCore202ContentDensity`.

Source runtime exacte :
- taille : `8 174 580` ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Accès directs :
- 3 lectures ;
- 2 écritures.

## Autorité conservée

Dungeon garde :
- les 50 défis intégrés ;
- le merge par ID ;
- les modifications utilisateur ;
- la normalisation tableau ;
- les objets complets / compatibilité anciennes listes d'IDs ;
- la sélection et la fréquence des énigmes ;
- les objectifs de porte/coffre ;
- tous les `try/catch` historiques.

Core Storage ne possède que le transport JSON.

## Raccord déterministe

Source :
- `8 174 580` octets ;
- blob `16deeb169abbc31a7db04161902e9381fd6888ad`.

Cible :
- `8 174 580` octets ;
- blob `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

Exactement 5 expressions de transport sont remplacées :
- Core 0.51 : 1 read + 2 writes ;
- Core 2.00 : 1 fallback read ;
- Core 2.02 : 1 fallback read.

## TDD

Tests :
- `tests/gens_phase4_storage_challenge_library_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_challenge_library_owner_v1.test.cjs`.

Avant raccord :
- parité attendue GREEN ;
- owner guard attendu RED.

## Hors périmètre

- contenu des défis ;
- fréquence des énigmes ;
- gameplay-by-profile / miroir historique ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats/Tactical/Capture/Survie ;
- observer/timer/retry/wrapper ;
- merge sur `main`.

## Validation requise

Avant checkpoint GREEN :
- parité GREEN ;
- owner guard GREEN après raccord ;
- manifeste Phase 2 avancé uniquement des 5 accès Challenge Library ;
- Architecture+navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.
