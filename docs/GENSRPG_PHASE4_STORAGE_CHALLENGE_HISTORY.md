# GenSrpG — Phase 4 Storage — Challenge History 0.67

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-challenge-history-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-challenge-history-2026-09-20`

Base exacte :
`d753527e04aa47191521255d58750718b15c6dff`
(`checkpoint/gensrpg-phase4-storage-next-audit-9-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Périmètre unique

Migrer uniquement le transport JSON de :
`gensrpg_dc067_challenge_history`.

Propriétaire :
`dungeonCore051ExplorationPolish`.

Source exacte :
- `index.html` : `8 174 580` octets ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

Accès directs ciblés :
- 1 lecture JSON ;
- 1 écriture JSON.

## Autorité conservée

Dungeon garde :
- le choix des défis ;
- la fenêtre anti-répétition de 12 IDs ;
- le fallback au pool complet si nécessaire ;
- l'ajout de l'ID choisi ;
- la persistance des 24 dernières entrées ;
- la normalisation tableau ;
- les `try/catch` historiques.

Core Storage ne possède que le transport JSON.

## Contrat historique

Lecture :
- absence / vide / invalide / erreur de lecture -> `[]` ;
- toute valeur non-tableau -> `[]`.

Écriture :
- persiste `hist.slice(-24)` ;
- erreur de sérialisation/stockage avalée par le `try/catch` historique.

## Raccord cible

Lecture :
`GensStorageV1.readJson(localStorage,hk,[])`.

Écriture :
`GensStorageV1.writeJson(localStorage,hk,hist.slice(-24))`.

Aucune migration de schéma.

## Micro-diff déterministe

Source :
- taille : `8 174 580` ;
- blob : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

Cible :
- taille : `8 174 580` ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

Exactement deux expressions de transport doivent changer.

## Tests

- `tests/gens_phase4_storage_challenge_history_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_challenge_history_owner_v1.test.cjs`.

Avant raccord :
- parité attendue GREEN ;
- owner guard attendu RED.

## Hors périmètre

- contenu des défis ;
- Challenge Library déjà migrée ;
- Pending Trap ;
- Special Branch ;
- Dungeon Scene ;
- Economy Session dynamique ;
- gameplay-by-profile ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats/Tactical/Capture/Survie ;
- observer/timer/retry/wrapper ;
- merge sur `main`.

## Validation requise

Avant checkpoint GREEN :
- parité GREEN ;
- owner guard GREEN après raccord ;
- manifeste Phase 2 avancé uniquement de 2 accès Challenge History ;
- fenêtre 12 / historique 24 inchangés ;
- Architecture+navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.
