# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot de restructuration ne fusionne directement dans `main`.

## État — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Dernier état vert :
- `checkpoint/gensrpg-charte-index-recovery-green-2026-09-18`
- SHA `cadc1a133e1513218bed7f3af19fe176805bf871`
- architecture, Dock et Firefox : success.

Lot actif :
- sentinelle lancement Survie ;
- branche `work/gensrpg-phase1-survival-shell-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-survival-shell-sentinel-2026-09-18` ;
- base exacte `cadc1a133e1513218bed7f3af19fe176805bf871` ;
- modifications autorisées : tests + workflow + documentation uniquement.

## Ordre Phase 1 restant

1. lancement Survie par le vrai shell ;
2. Save & Quit + vraie reprise ;
3. placeholder PvP actuel ;
4. Capture sur comportement actuel uniquement ;
5. non-interférence explicite des quatre modules.

Le lancement Dungeon shell complet reste partiellement couvert et sera traité par un lot Shell dédié si la matrice finale le requiert.

## Invariants

- aucun runtime modifié dans le lot Survie ;
- aucun nouveau mécanisme global de réparation ;
- un propriétaire par responsabilité ;
- aucune règle gameplay codée en dur ;
- `main` reste gelé ;
- si `index.html` devient inaccessible par les outils, appliquer la règle 26 de la charte et demander le fichier à l'utilisateur avec le lien direct exact.

## Signalement différé

Détection ennemie hors embuscade : caractérisation dédiée après Phase 1.
