# GenSrpG — Phase 4 Storage — Audit suivant 8

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-next-audit-8-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-next-audit-8-2026-09-20`

Base exacte :
`d579cb0d1ec4e065e2baa9f6c7bd770fb391fcf1`
(`checkpoint/gensrpg-phase4-storage-economy-rules-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Pourquoi un Audit 8

L'Audit 7 avait sélectionné le seed Capture de
`gensrpg_rpg_gameplay_by_profile_v1`
à partir du manifeste Phase 2.

Pendant le lot d'implémentation, une sentinelle a révélé une limite du scanner Phase 2 :
il ne scanne que les scripts inline portant un `id`, alors que le gros script principal anonyme contient aussi un propriétaire historique de cette même clé.

Le lot partiel
`work/gensrpg-phase4-storage-gameplay-by-profile-2026-09-20`
est donc abandonné sans merge et sans checkpoint GREEN.
Aucune de ses modifications runtime ne sert de base à cet audit.

## Source exacte

`index.html` Economy GREEN :
- taille : `8 174 580` octets ;
- blob : `16deeb169abbc31a7db04161902e9381fd6888ad`.

Inventaire Phase 2 au départ :
- accès directs : `196` ;
- résolus : `131` ;
- non résolus : `65` ;
- clés directes résolues : `24`.

## Candidat réaudité : gameplay-by-profile — DIFFÉRÉ

Clé :
`gensrpg_rpg_gameplay_by_profile_v1`.

### Propriétaire historique principal hors scanner Phase 2

Dans le gros script principal anonyme :
- `loadRpgGameplayByProfile()` : 1 lecture directe ;
- `saveRpgGameplayByProfile()` : 1 écriture directe ;
- `setStoredRpgGameplay()` : 1 écriture directe supplémentaire ;
- `clearOldGameplayMirrorOnce()` : 1 `removeItem` direct.

Ce miroir est explicitement documenté dans le runtime comme compatibilité V16.100.3 et n'est plus la source de vérité.

Le même bloc possède aussi le marqueur scalaire :
`gensrpg_rpg_gameplay_mirror_cleared_v1004`.

### Seed Capture

Dans `builtinMonsterCapture162` :
- 1 lecture JSON directe ;
- 1 écriture JSON conditionnelle ;
- seed uniquement si `map[MC162_ID]` est absent.

### Décision

Ne pas migrer cette famille maintenant :
- plusieurs propriétaires réels ;
- historique de compatibilité ;
- `removeItem` absent de l'API JSON Core actuelle ;
- marqueur scalaire voisin à ne pas forcer dans `GensStorageV1`.

Un lot dédié miroir/compatibilité sera requis si cette famille doit être nettoyée.

## Nouveau candidat : Challenge Library — RETENU

Clé :
`gensrpg_challenge_library_v1`.

Propriétaires :
- `dungeonCore051ExplorationPolish` ;
- `dungeonCore200Rebuild` ;
- `dungeonCore202ContentDensity`.

Accès directs exacts :
- Core 0.51 : 1 lecture + 2 écritures ;
- Core 2.00 : 1 lecture fallback ;
- Core 2.02 : 1 lecture fallback ;
- total : 3 lectures + 2 écritures.

Contrat :
- transport JSON tableau ;
- Core 0.51 normalise ensuite les non-tableaux vers `[]` ;
- Core 0.51 garantit les 50 énigmes intégrées et conserve les modifications utilisateur ;
- l'écriture après merge reste protégée par le `try/catch` historique ;
- `saveChallengeLibrary069` normalise toujours vers tableau ;
- Core 2.00 et 2.02 gardent leur fallback uniquement si `loadChallengeLibrary069` n'existe pas ;
- aucune logique de fréquence, sélection, porte, coffre ou puzzle ne change.

Raccord cible ultérieur :
- 3 lectures -> `GensStorageV1.readJson(...,[])` ;
- 2 écritures -> `GensStorageV1.writeJson(...)` ;
- aucune migration de schéma.

Micro-diff déterministe préparé :
- taille cible : `8 174 580` ;
- blob cible : `bfe9149e8150f15017bfcffe1a00fb797791aa83`.

## Différés

- gameplay-by-profile / miroir historique ;
- `gensrpg_dungeon_runtime_v2` ;
- Stats dynamique ;
- Tactical mixed state ;
- Runtime Repair mixed JSON/scalaires ;
- marqueurs scalaires.

## Interdits

- aucun runtime dans cet audit ;
- aucun changement du contenu des 50 énigmes ;
- aucun changement fréquence/portes/coffres/puzzles ;
- aucun gameplay-by-profile ;
- aucun runtime_v2 ;
- aucun Stats/Tactical/Capture/Survie ;
- aucun observer/timer/retry/wrapper ;
- aucun merge sur `main`.
