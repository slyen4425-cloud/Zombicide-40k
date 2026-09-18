# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot de restructuration ne fusionne directement dans `main`.

## État — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Dernier checkpoint vert confirmé :
- lancement Survie par le vrai Shell ;
- branche `work/gensrpg-phase1-survival-shell-sentinel-2026-09-18` ;
- checkpoint `checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18` ;
- SHA `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`.

Lot Save & Quit / reprise validé fonctionnellement :
- branche `work/gensrpg-phase1-savequit-resume-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-savequit-resume-sentinel-2026-09-18` ;
- base `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e` ;
- SHA fonctionnel vert avant fermeture documentaire `4bf7203703e2002562ed2d074771519abf4b1e0c` ;
- Architecture `35316032731` — success ;
- Firefox `35316032787` — success ;
- Tactical Dock `35316032860` — success ;
- checkpoint final `checkpoint/gensrpg-phase1-savequit-resume-sentinel-green-2026-09-18`.

Résultat :
- Save & Quit + vraie reprise par le Shell désormais couverts ;
- lancement Dungeon depuis le Shell racine couvert par le même scénario ;
- aucun runtime/gameplay/asset/stockage modifié ;
- sentinelle branchée à `.github/workflows/gensrpg-architecture-sentinels.yml`.

## Ordre Phase 1 restant

1. placeholder PvP actuel ;
2. Capture sur comportement actuel uniquement ;
3. non-interférence explicite des quatre modules.

Le lot séparé de lancement Dungeon Shell n'est plus nécessaire tant que cette sentinelle reste verte.

## Invariants

- chaque lot suivant possède sa branche et son checkpoint de départ ;
- aucun nouveau mécanisme global de réparation ;
- un propriétaire par responsabilité ;
- aucune règle gameplay codée en dur ;
- `main` reste gelé ;
- si `index.html` devient inaccessible par les outils, appliquer la règle 26 de la charte.

## Signalement différé

Détection ennemie hors embuscade : caractérisation dédiée après Phase 1.
