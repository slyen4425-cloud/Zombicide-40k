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


## Implémentation appliquée

Commit runtime :
`6e1d975e3d4d87a4c16df734d474e10fdafd1784`

Micro-diff :
- `loadEffects()` -> `GensStorageV1.readJson(localStorage,KEY,[])` puis garde `Array.isArray` conservé ;
- `saveEffects(a)` -> `GensStorageV1.writeJson(localStorage,KEY,a||[])` ;
- aucun autre code du bloc Manual MJ modifié ;
- aucun `gensrpg_dungeon_runtime_v2`.

État final exact de `index.html` :
- taille : `8 174 580` octets ;
- blob : `a070af09f9cb1fcda78987e83bc117d7544d1b6c`.

Le workflow temporaire d'application exacte a été retiré après le raccord.

### Preuve TDD

Avant le raccord :
- parité Manual MJ : SUCCESS ;
- garde d'autorité : RED attendu, car les deux accès directs existaient encore ;
- run Architecture concerné : `35515673649`.

Après raccord :
- 0 lecture directe Manual MJ ;
- 0 écriture directe Manual MJ ;
- exactement 1 lecture Core ;
- exactement 1 écriture Core ;
- fallback tableau `[]` inchangé ;
- erreurs d'écriture toujours propagées.

### Manifeste Phase 2

Avant :
- accès directs : `200` ;
- résolus : `135` ;
- non résolus : `65` ;
- clés directes résolues : `26`.

Après :
- accès directs : `198` ;
- résolus : `133` ;
- non résolus : `65` ;
- clés directes résolues : `25`.

Dungeon :
- accès : `168 -> 166` ;
- résolus : `118 -> 116` ;
- non résolus : `50` inchangés ;
- clés directes : `18 -> 17`.

Les seuls réalignements supplémentaires concernent des sentinelles/cartographies qui figeaient l'ancien blob global ou les anciens totaux de stockage ; aucune règle métier de ces tests n'a été assouplie.

## Validation finale — GREEN

HEAD fonctionnel validé avant clôture documentaire :
`ab00bfeeecb1f55e5818044ffef0db29d447aa88`

Runs :
- Architecture + navigateur complet `35515980174` — SUCCESS ;
- Firefox `35515980167` — SUCCESS ;
- Tactical Dock `35515980168` — SUCCESS.

Le navigateur complet a notamment repassé :
- lancement Survie et Fouiller/arts ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet moderne ;
- fiche RPG sans flash Survie ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Monster Capture et composition complète ;
- non-interférence quatre modules ;
- murs Tactical ;
- preview ;
- resolver d'assets et tokens tardifs.

Aucun merge sur `main`.

### Suite

Après validation de ce commit documentaire :
1. créer `checkpoint/gensrpg-phase4-storage-manual-mj-effects-green-2026-09-20` ;
2. ouvrir un nouvel audit stockage depuis ce checkpoint ;
3. ne pas attaquer `gensrpg_dungeon_runtime_v2` sans audit dédié ;
4. conserver Stats/Tactical/Runtime Repair hors du Core JSON générique.
