# GenSrpG — Phase 4 — Stockage Capture progress

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-capture-progress-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-capture-progress-2026-09-20`

Base exacte :
`54ba3c61af9e885239f1e3e397bf5386f6f6db41`
(`checkpoint/gensrpg-phase4-storage-core-bootstrap-order-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Périmètre unique

Famille JSON :
`gensrpg_capture_progress_v2_<profileId>`

Capture conserve la clé, les defaults, la normalisation, les réglages MJ et les writers.
Core Storage possède uniquement la sérialisation JSON générique.

## État historique

`index.html` de départ :
- taille : `8 174 618` octets ;
- blob : `476f91b7a5921c9f02f17ba72c801f4bec16a809`.

Accès historiques :
- 1 lecture JSON directe ;
- 6 écritures JSON directes ;
- fallback lecture `{}` puis fusion dans les defaults Capture ;
- aucune migration de schéma.

Writers :
- writer Capture de base ;
- `capturePlaytestFix128` ;
- `captureFix130` ;
- `captureFix134` ;
- `captureFix137` ;
- `captureFix140`.

## Raccord appliqué

Lecture :
`GensStorageV1.readJson(localStorage,captureCreatureProgressRulesKey(),{})`

Écriture :
`GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),value)`

Commit fonctionnel :
`6ef2ab5e7a8069c92ba722755ea7efeaeebb5d31`

Nouveau blob `index.html` :
`5d2b0a6da51fd70bd36f087cb9ab82a1af308226`

Taille inchangée :
`8 174 618` octets.

Aucun wrapper métier, observer, timer, retry ou nouveau propriétaire n'est ajouté.

## Parité verrouillée

`gens_phase4_storage_capture_progress_parity_v1.test.cjs` compare :
- absence / chaîne vide ;
- JSON valide / invalide ;
- `null`, primitives et tableau ;
- sérialisation normale ;
- erreur de sérialisation ;
- erreur d'écriture.

`gens_phase4_storage_capture_progress_owner_v1.test.cjs` vérifie :
- Core Storage reste générique ;
- Capture reste propriétaire de la clé et des règles ;
- les 6 writers passent par Core Storage ;
- les familles voisines MJ / difficulté restent hors périmètre.

## Inventaire Phase 2

L'ancien inventaire ne comptait que les blocs inline avec `id`, donc 5 des 7 accès historiques y figuraient.

Après raccord :
- total : `213 -> 208` ;
- non résolus : `70 -> 65` ;
- Capture : `28 -> 23` accès directs ;
- Capture non résolus : `18 -> 13`.

Les 2 accès de base sans identifiant inline sont également raccordés mais n'étaient pas comptés dans ce manifeste historique.

## Hors périmètre

- `gensrpg_dungeon_runtime_v2` ;
- états héros dynamiques ;
- Stats/Tactical ;
- autres familles Capture ;
- valeurs gameplay et UI ;
- `main`.

## Validation finale

HEAD fonctionnel validé :
`5b33877bcd1d9e7a3cd0699f0dffad876e543ebe`

Runs :
- Architecture + navigateur complet `35505304987` — SUCCESS ;
- Firefox `35505305004` — SUCCESS ;
- Tactical Dock `35505304993` — SUCCESS.

Scénarios navigateur importants passés :
- Monster Capture par le vrai Shell ;
- Capture dans la composition complète Phase 2 ;
- non-interférence des quatre modules ;
- Save & Quit / reprise ;
- preview Chromium.

## État

Raccord fonctionnel validé GREEN.
