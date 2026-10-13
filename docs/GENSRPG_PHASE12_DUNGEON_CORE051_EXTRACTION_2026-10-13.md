# GenSrpG — Phase 12 / D2 — Core051 Exploration Polish

Date : 13 octobre 2026.

## Point de départ et propriétaire

- Dernier SHA triple-CI GREEN : `11813ebc8d40ba976041f0be78d698cf2314b2dc`.
- Checkpoint §25 : `checkpoint/gensrpg-start-phase12-dungeon-core051-extraction-2026-10-13`.
- Branche de travail dédiée : `work/gensrpg-phase12-dungeon-core051-extraction-2026-10-13`. `main` reste gelée.
- ZIP fourni par le propriétaire : `a3.zip` contenant `index.html(3).txt` (contenu certifié : 7 911 489 octets, Git blob `2921ebadacf6f660e815d9ff7712e44cd765fbdd`). Aucun ancien ZIP utilisé.
- Propriétaire : Dungeon, bloc `dungeonCore051ExplorationPolish` (IIFE, `primaryDomain=dungeon`, sans `crossDomains`).

## Extraction strictement contrôlée

- Source : bloc inline `<script id="dungeonCore051ExplorationPolish">`.
- Corps extrait : 47 962 octets, blob `d7ec321ffa05b8749de5d7bf9e8264e55b24f919`.
- Cible : `assets/gensrpg/dungeon/core051-exploration-polish-v1.js`.
- Index après extraction prévu : 7 863 589 octets, blob `e5f8895495f969597a6c209fcc29afd66b7a0636` (47 900 octets nets retirés).
- Conserver exactement le code, l'identifiant script, la synchronisation parser et les dépendances Core051→Core052.
- Application : `tools/gensrpg_phase12_dungeon_core051_extract_apply.py --apply`, publication par GitHub Actions sur la seule branche D2. Validation : `--verify`, JS syntaxique, extraction D1 toujours reconstructible.
- Les anciennes sentinelles lisant un index complet ou le graphe JS sont repinnées sur la nouvelle source physique ; aucun snapshot historique Phase 2 réécrit.

## Exigences GREEN

Le simple ajout des fichiers ou le succès de l'application contrôlée ne signifie **pas** GREEN. Exiger les tests réels Dungeon et la non-interférence Survie, Capture, PvP, Tactical ; Architecture/Chromium, Firefox et Tactical SUCCESS sur le **même SHA final**. Revoir toute CI rouge avant checkpoint. Aucune modification de `main`, des labos ou des 32 assets Survie historiques.
