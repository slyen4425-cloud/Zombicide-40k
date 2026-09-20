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


## Implémentation appliquée

Commit runtime :
`7d6d5897ec24959240ca3d9147e1ce6aeb2c5e82`

Micro-diff :
- lecture Challenge History -> `GensStorageV1.readJson(localStorage,hk,[])` ;
- écriture Challenge History -> `GensStorageV1.writeJson(localStorage,hk,hist.slice(-24))` ;
- aucune autre ligne runtime modifiée.

État final exact de `index.html` :
- taille : `8 174 580` octets ;
- blob : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

Dungeon reste propriétaire :
- du choix des défis ;
- de la fenêtre anti-répétition de 12 IDs ;
- du fallback au pool complet ;
- de l'historique limité aux 24 dernières entrées ;
- de la normalisation tableau ;
- des `try/catch` historiques.

### Manifeste Phase 2

Avant :
- accès directs : `191` ;
- résolus : `126` ;
- non résolus : `65` ;
- clés directes : `23`.

Après :
- accès directs : `189` ;
- résolus : `124` ;
- non résolus : `65` ;
- clés directes : `22`.

Dungeon :
- accès : `159 -> 157` ;
- résolus : `109 -> 107` ;
- non résolus : `50` inchangés ;
- clés directes : `15 -> 14`.

`gensrpg_dc067_challenge_history` a quitté le manifeste des accès directs.

### Réalignements de sentinelles

Les audits stockage historiques ont été réalignés uniquement sur :
- le nouveau blob déterministe ;
- les nouveaux compteurs ;
- l'état migré de Challenge History.

La garde owner dédiée impose :
- 0 lecture/écriture `localStorage` directe ;
- exactement 1 lecture Core ;
- exactement 1 écriture Core ;
- fenêtre 12 et historique 24 inchangés.

## Validation fonctionnelle — GREEN

HEAD fonctionnel validé :
`71963332b45eabddc5b761678d17d7e1727353de`

Runs :
- Architecture + navigateur complet `35526358499`, tentative 2 — SUCCESS ;
- Firefox `35526358631` — SUCCESS ;
- Tactical Dock `35526358507` — SUCCESS.

La première tentative navigateur a échoué uniquement sur le flake historique d'overlay Tactical qui interceptait le clic Survie ; la relance a passé ce scénario puis toute la batterie.

Aucun merge sur `main`.
