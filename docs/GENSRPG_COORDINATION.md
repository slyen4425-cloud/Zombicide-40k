# GenSrpG — Coordination

Ce document complète la charte, la roadmap, `GENSRPG_CURRENT_WORK.md` et l'audit Phase 1.

## Rôle du fil directeur

Un seul fil est coordinateur. Règle : **1 lot = 1 branche = 1 périmètre homogène**.

Aucun lot de restructuration ne fusionne directement dans `main`.

## État — 2026-09-18

Production :
- `main` attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- production gelée.

Dernier lot vert :
- lancement Survie par le vrai Shell ;
- checkpoint `checkpoint/gensrpg-phase1-survival-shell-sentinel-green-2026-09-18` ;
- SHA `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e`.

Lot actif :
- **Save & Quit + vraie reprise Shell** ;
- branche `work/gensrpg-phase1-save-quit-resume-shell-sentinel-2026-09-18` ;
- checkpoint de départ `checkpoint/gensrpg-start-phase1-save-quit-resume-shell-sentinel-2026-09-18` ;
- base exacte `0e8301fb4555279c4ea47b23e23e2d91f7eb4e5e` ;
- modifications autorisées en première intention : tests + workflow + documentation uniquement.

## Ordre Phase 1 restant

1. Save & Quit + vraie reprise ;
2. placeholder PvP actuel ;
3. Capture sur comportement actuel uniquement ;
4. non-interférence explicite des quatre modules ;
5. compléter le lancement Dungeon Shell si la matrice finale le requiert.

## Invariants du lot actif

- traverser le vrai Shell et `resumeGame()` ;
- recréer/recharger réellement le contexte entre quitter et reprendre ;
- ne pas injecter artificiellement la valeur que le test cherche à protéger ;
- aucun correctif runtime dans le même lot si un vrai défaut est découvert ;
- `main` reste gelé.

## Signalement différé

Détection ennemie hors embuscade : caractérisation dédiée après Phase 1.
