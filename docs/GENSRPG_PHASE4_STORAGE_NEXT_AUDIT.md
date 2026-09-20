# GenSrpG — Phase 4 — Audit stockage suivant

Date : 2026-09-20

Base :
`checkpoint/gensrpg-phase4-storage-zone-graphs-green-2026-09-20`

SHA :
`ae2acee5bd2858363d2a66997f2aabf3acb46c80`

## État après Builders

Le domaine Builders ne contient plus d'accès direct `localStorage` dans la cartographie active.

Inventaire direct restant :
- total : 214 ;
- résolus : 143 ;
- dynamiques : 71.

Le gros runtime Dungeon `gensrpg_dungeon_runtime_v2` reste hors périmètre tant qu'il n'a pas son propre audit.

## Candidat retenu

`assets/gensrpg/gens-world-summary-167820.js`

Raisons :
- domaine Shell ;
- un seul accès direct au stockage ;
- lecture seule ;
- aucune écriture ni suppression ;
- helper local `readJson(key,fallback)` générique ;
- sémantique compatible avec `GensStorageV1.readJson()` ;
- Core storage déjà chargé avant World Summary dans Pages et `preview.html`.

## Familles de clés lues

World Summary lit uniquement :
- `gensrpg_shared_entities_v1__<profileId>` ;
- `gensrpg_shared_entities_v1__family__creature`.

Ces clés restent possédées par la donnée Capture ; World Summary ne devient pas propriétaire de leur schéma. Il ne fait qu'en produire un résumé Shell.

## Sous-lot suivant

Raccorder uniquement le helper de lecture World Summary à :
`GensStorageV1.readJson(localStorage,key,fallback)`.

Invariants :
- mêmes clés ;
- même fallback ;
- JSON invalide -> fallback ;
- `null` -> fallback ;
- lecture seule ;
- aucune migration de format ;
- aucune modification Capture ;
- aucune modification du rendu ou des calculs de résumé ;
- aucun `index.html`.
