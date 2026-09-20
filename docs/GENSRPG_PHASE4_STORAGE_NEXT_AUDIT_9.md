# GenSrpG — Phase 4 Storage — Audit suivant 9

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-9-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-9-2026-09-20`

Base exacte :
`f71065c03f28b8dacd6d5b449f7688fc948f925b`
(`checkpoint/gensrpg-phase4-storage-challenge-library-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Objet

Audit uniquement.
Choisir le prochain micro-lot JSON minimal après Challenge Library.
Aucun runtime, gameplay, asset ou stockage n'est modifié dans cet audit.

## Source exacte

`index.html` post-Challenge-Library :
- taille : `8 174 580` octets ;
- blob Git : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

Inventaire Phase 2 :
- accès directs : `191` ;
- résolus : `126` ;
- non résolus : `65` ;
- clés directes résolues : `23`.

Dungeon :
- accès : `159` ;
- résolus : `109` ;
- non résolus : `50` ;
- clés directes : `15`.

## Candidat retenu : Challenge History 0.67

Clé :
`gensrpg_dc067_challenge_history`.

Propriétaire unique :
`dungeonCore051ExplorationPolish`.

Accès directs exacts :
- 1 lecture JSON ;
- 1 écriture JSON.

Contrat historique :
- absence / chaîne vide / JSON invalide / erreur de lecture -> `[]` ;
- toute valeur non tableau -> `[]` ;
- les 12 derniers IDs sont exclus du tirage si possible ;
- si tous les défis sont récents, le pool complet redevient disponible ;
- l'ID choisi est ajouté à l'historique ;
- seules les 24 dernières entrées sont persistées ;
- erreur de sérialisation/écriture capturée silencieusement par le `try/catch` historique.

Core Storage ne doit posséder que le transport JSON.
Dungeon reste propriétaire de toute la logique anti-répétition.

Raccord cible ultérieur :
- lecture -> `GensStorageV1.readJson(localStorage,hk,[])` ;
- écriture -> `GensStorageV1.writeJson(localStorage,hk,hist.slice(-24))`.

Micro-diff déterministe préparé :
- taille cible : `8 174 580` octets ;
- blob cible : `30487d09481e11e5883faca1a6e49727d9cecfb6`.

## Candidats différés

### Pending Trap 0.48
`gensrpg_dc048_pending_trap_v1`
- get/set/remove ;
- état de gameplay transitoire ;
- audit dédié requis.

### Special Branch 0.52
`gensrpg_dc052_special_branch_v1`
- get/set/remove ;
- état de navigation de branche ;
- audit dédié requis.

### Dungeon Scene
`gensrpg_dungeon_scene_v1`
- JSON simple et candidat potentiel ultérieur ;
- non mélangé à ce lot pour conserver un périmètre unique.

### Economy Session dynamique
`gensrpg_dungeon_session_eco_160_<profileId>`
- clé dynamique ;
- reste différée.

### Gameplay-by-profile
- miroir historique principal hors scanner Phase 2 ;
- `removeItem` + marqueur scalaire ;
- reste différé.

### Dungeon runtime v2
- famille large multi-propriétaires ;
- audit dédié obligatoire.

## Interdits

- aucun runtime dans cet audit ;
- aucun changement du contenu des énigmes ;
- aucune modification de la fenêtre 12 / historique 24 ;
- aucun Trap/Special Branch/Scene/Economy Session ;
- aucun gameplay-by-profile ;
- aucun runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.
