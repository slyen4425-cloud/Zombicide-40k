# GenSrpG — Phase 4 Storage — Audit suivant 7

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-7-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-7-2026-09-20`

Base exacte :
`d579cb0d1ec4e065e2baa9f6c7bd770fb391fcf1`
(`checkpoint/gensrpg-phase4-storage-economy-rules-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Objet

Audit uniquement.
Choisir le prochain micro-lot JSON minimal après Economy Rules.
Aucun runtime, gameplay, asset ou stockage n'est modifié dans cet audit.

## Source exacte

`index.html` post-Economy-Rules :
- taille : `8 174 580` octets ;
- blob Git : `16deeb169abbc31a7db04161902e9381fd6888ad`.

## Inventaire de départ

- accès directs : `196` ;
- résolus : `131` ;
- non résolus : `65` ;
- clés directes résolues : `24`.

## Candidats inspectés

### `gensrpg_rpg_gameplay_by_profile_v1` — RETENU

Propriétaire unique :
`builtinMonsterCapture162`.

Sous-responsabilité isolée :
seed de la configuration gameplay du profil Monster Capture embarqué.

Contrat exact :
- 1 lecture JSON directe ;
- fallback `{}` sur absence, chaîne vide, `null`, valeur falsy, JSON invalide ou erreur de lecture ;
- les primitives truthy et tableaux conservent leur sémantique historique stricte ;
- le seed n'écrit que si `map[MC162_ID]` est absent ;
- valeur seed = clone JSON de `MC162_GAMEPLAY` ;
- 1 écriture JSON directe conditionnelle ;
- erreurs d'écriture capturées par le `try/catch` externe avec warning ;
- aucune migration ou remplacement d'une valeur utilisateur existante.

Le bloc `builtinMonsterCapture162` possède d'autres seeds persistants, mais ils utilisent d'autres clés et restent strictement hors périmètre.

Raccord cible ultérieur :
- lecture -> `GensStorageV1.readJson(localStorage,key,{})||{}` sous les limites de try/catch historiques ;
- écriture -> `GensStorageV1.writeJson(localStorage,key,map)`.

Micro-diff déterministe préparé :
- taille cible : `8 174 580` octets ;
- blob cible : `0b9c41c39db0d073c7b9ed580f66140b8d9bcda2`.

### `gensrpg_challenge_library_v1` — différé

Toujours partagé entre :
- `dungeonCore051ExplorationPolish` ;
- `dungeonCore200Rebuild` ;
- `dungeonCore202ContentDensity`.

Plusieurs générations Dungeon participent au contrat ; audit dédié requis.

### `gensrpg_dungeon_runtime_v2` — différé

Famille large, multi-propriétaires et multi-sources.
Audit dédié obligatoire.

### Autres exclusions maintenues

- Stats dynamique : futur service Stats ;
- Tactical adapter : mélange runtime Dungeon + état héros dynamique ;
- Runtime Repair : mélange JSON et scalaires ;
- valeurs scalaires : pas de forçage dans `GensStorageV1`.

## Décision

Le prochain micro-lot devra traiter uniquement :
`gensrpg_rpg_gameplay_by_profile_v1`
dans le sous-bloc de seed gameplay de `builtinMonsterCapture162`.

Les autres seeds Capture restent directs et intacts.

## Interdits maintenus

- aucun autre stockage de `builtinMonsterCapture162` ;
- aucun changement du profil/demo Monster Capture ;
- aucun changement des capacités, créatures, règles Capture ou équipements ;
- aucun Challenge Library ;
- aucun `gensrpg_dungeon_runtime_v2` ;
- aucun Stats/Tactical/Runtime Repair ;
- aucune migration de schéma ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.
