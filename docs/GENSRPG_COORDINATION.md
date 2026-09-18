# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot de restructuration ne fusionne directement dans `main`.

## État — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Lot Survie validé :
- branche `work/gensrpg-phase1-survival-shell-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-survival-shell-sentinel-2026-09-18` ;
- base `cadc1a133e1513218bed7f3af19fe176805bf871` ;
- SHA fonctionnel vert avant fermeture documentaire `aca4d8b449c37367525644781500f8972aae645d` ;
- Architecture `35311890710` — success ;
- Firefox `35311890711` — success ;
- Tactical Dock `35311890705` — success ;
- checkpoint final prévu : `checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18`.

Résultat :
- lancement Survie par le vrai Shell désormais couvert ;
- aucun runtime/gameplay modifié ;
- aucun changement Dungeon/Tactical ;
- sentinelle branchée à `.github/workflows/gensrpg-architecture-sentinels.yml`.

## Ordre Phase 1 restant

1. Save & Quit + vraie reprise ;
2. placeholder PvP actuel ;
3. Capture sur comportement actuel uniquement ;
4. non-interférence explicite des quatre modules ;
5. compléter le lancement Dungeon Shell si la matrice finale le requiert.

## Invariants

- chaque lot suivant possède sa branche et son checkpoint de départ ;
- aucun nouveau mécanisme global de réparation ;
- un propriétaire par responsabilité ;
- aucune règle gameplay codée en dur ;
- `main` reste gelé ;
- si `index.html` devient inaccessible par les outils, appliquer la règle 26 de la charte.

## Signalement différé

Détection ennemie hors embuscade : caractérisation dédiée après Phase 1.
