# GenSrpG — Coordination

## Règle

Un seul fil coordinateur.  
**1 lot = 1 branche = 1 périmètre homogène.**

`main` reste gelé pendant la restructuration.

## État — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Dernier checkpoint vert :
- `checkpoint/gensrpg-phase1-sentinel-gap-audit-green-2026-09-18`
- SHA `fcc9e6378263b0498170dbb7f4d110a7fe169f93`.

Lot actif :
- sentinelle lancement Survie par le vrai shell ;
- branche `work/gensrpg-phase1-survival-launch-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-survival-launch-sentinel-2026-09-18` ;
- base exacte `fcc9e6378263b0498170dbb7f4d110a7fe169f93`.

Périmètre :
- tests + workflow uniquement ;
- aucun runtime, aucune règle et aucun asset.

Propriétaire testé :
- Shell -> sélection Survie -> préparation -> `startConfiguredGame()`;
- guard Survie existant vérifié, non modifié.

## Ordre Phase 1 après ce lot

1. Save & Quit + vraie reprise ;
2. placeholder PvP ;
3. Capture actuel sans restauration ;
4. non-interférence explicite des quatre modules ;
5. rattacher le lancement Dungeon shell complet au plus petit lot Shell compatible.

## Invariants

- aucun observer global, timer de réparation, retry long ou wrapper global ajouté ;
- aucun changement combat/détection ;
- aucune restauration Capture ;
- aucun moteur PvP inventé ;
- aucun changement sur `main`.

## Signalement conservé

Détection ennemie hors embuscade : caractérisation dédiée plus tard.

## Reprise

Lire :
1. `GENSRPG_CHARTE.md`
2. `GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. `GENSRPG_CURRENT_WORK.md`
4. `GENSRPG_COORDINATION.md`
5. `GENSRPG_PHASE1_SENTINEL_AUDIT.md`
