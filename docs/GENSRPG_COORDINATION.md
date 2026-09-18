# GenSrpG — Coordination

Ce document complète la charte, la roadmap et `GENSRPG_CURRENT_WORK.md`.

## Rôle du fil directeur

Un seul fil est coordinateur. Il choisit le checkpoint vert, ouvre les lots, évite les conflits de propriétaires, vérifie SHA/diff/tests, crée les checkpoints et maintient les documents de reprise.

Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot ne fusionne directement dans `main` pendant la restructuration.

## État de coordination — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Dernier checkpoint vert utilisateur :
- `checkpoint/gensrpg-tactical-dock-legacy-layer-green-2026-09-17`
- SHA `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb`
- validation manuelle Dock : concluante.

Lot actif :
- Phase 1 sentinel gap audit ;
- branche `work/gensrpg-phase1-sentinel-gap-audit-post-dock-2026-09-17` ;
- base exacte `ea1ffe059a62bdae88dca46b2aeb28cbf3c784bb` ;
- checkpoint de départ : `checkpoint/gensrpg-start-phase1-sentinel-gap-audit-2026-09-18` ;
- runtime verrouillé : **aucun changement autorisé dans ce lot**.

Matrice : `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`.

## Ordre décidé après audit

1. sentinelle test-only lancement Survie ;
2. sentinelle Save & Quit + vraie reprise ;
3. sentinelle placeholder PvP actuel ;
4. sentinelle Capture sur comportement actuel uniquement ;
5. sentinelle explicite de non-interférence des quatre modules.

Le lancement Dungeon shell complet reste identifié comme partiellement couvert et sera rattaché à un petit lot Shell compatible, sans élargir artificiellement un chantier.

## Invariants protégés

- aucun nouveau MutationObserver global, timer de réparation, retry long ou wrapper global ;
- un propriétaire par responsabilité ;
- aucune règle gameplay codée en dur ;
- aucun changement de combat/détection dans les lots sentinelles ;
- aucune restauration Capture avant son chantier dédié ;
- aucun moteur PvP inventé ;
- `main` reste gelé.

## Signalement à conserver

Détection ennemie hors embuscade : doute utilisateur à caractériser plus tard dans une branche dédiée.

## Reprise dans un nouveau fil

Lire :
1. `GENSRPG_CHARTE.md`
2. `GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `GENSRPG_CURRENT_WORK.md`
4. `GENSRPG_COORDINATION.md`
5. `GENSRPG_PHASE1_SENTINEL_AUDIT.md`

Puis vérifier le SHA de `main`, le checkpoint vert et la branche active avant toute écriture.
