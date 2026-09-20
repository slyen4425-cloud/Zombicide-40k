# GenSrpG — Phase 4 Storage — Manual MJ Effects

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-manual-mj-effects-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-manual-mj-effects-2026-09-20`

Base exacte :
`3a389423cd10d0ba6dda054791469f37637548a4`
(`checkpoint/gensrpg-phase4-storage-next-audit-5-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## Périmètre unique

Migrer uniquement :
`gensrpg_manual_mj_effects_v1`

Propriétaire :
`dungeonCore046ManualMjAssist`.

État source exact :
- `index.html` : 8 174 603 octets ;
- blob : `739ca52610308d085ecf2635c5bc748f70c79a11` ;
- 1 lecture JSON directe ;
- 1 écriture JSON directe ;
- aucun `gensrpg_dungeon_runtime_v2` dans le bloc.

## Contrat historique

Lecture :
`JSON.parse(localStorage.getItem(KEY) || "[]")`.

Dungeon conserve :
- le garde `Array.isArray` ;
- fallback `[]` si absence, JSON invalide, erreur de lecture ou type non-tableau.

Écriture :
`localStorage.setItem(KEY, JSON.stringify(a || []))`.

Les erreurs de sérialisation ou de stockage ne sont pas avalées : elles restent propagées.

## Autorité cible

Core Storage possède uniquement le transport JSON :
- lecture -> `GensStorageV1.readJson(localStorage,KEY,[])` ;
- écriture -> `GensStorageV1.writeJson(localStorage,KEY,a||[])`.

Dungeon Manual MJ reste propriétaire :
- de la clé ;
- du type tableau attendu ;
- des IDs d'effets ;
- des cibles héros/ennemis ;
- des noms ;
- des durées et du ticking de tours ;
- du rendu et de l'UI MJ.

Aucune migration de schéma.

## Micro-diff déterministe

Source :
- taille : `8 174 603` ;
- blob : `739ca52610308d085ecf2635c5bc748f70c79a11`.

Cible :
- taille : `8 174 580` ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

Exactement deux helpers changent :
- `loadEffects()` ;
- `saveEffects(a)`.

## Tests

- `tests/gens_phase4_storage_manual_mj_effects_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_manual_mj_effects_owner_v1.test.cjs`.

La parité verrouille notamment :
- absence / chaîne vide / `null` ;
- JSON invalide ;
- primitives et objet non-tableau ;
- tableau valide ;
- erreur de lecture ;
- écriture de `a || []` ;
- propagation des erreurs de sérialisation et de stockage.

La garde owner est volontairement ajoutée avant le raccord : elle doit être RED tant que les deux accès directs existent.

## Hors périmètre

- `gensrpg_dungeon_runtime_v2` ;
- Economy et état de session dynamique ;
- Challenge Library ;
- Gameplay-by-profile ;
- Stats ;
- Tactical ;
- Capture ;
- Survie ;
- gameplay/UI Manual MJ ;
- observer/timer/retry/wrapper ;
- tout merge sur `main`.

## Validation requise

Avant checkpoint GREEN :
- parité GREEN ;
- garde owner GREEN après raccord ;
- manifeste Phase 2 avancé de 2 accès seulement ;
- sentinelles d'empreinte réalignées uniquement si le blob exact l'exige ;
- Architecture + navigateur complet GREEN ;
- Firefox GREEN ;
- Tactical Dock GREEN.
