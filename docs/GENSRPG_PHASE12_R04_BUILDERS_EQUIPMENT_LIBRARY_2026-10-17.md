# Phase 12 R04 — Builders / bibliothèque d'équipements — clôture du lot

Date : 17 octobre 2026. **Statut : GREEN technique/CI**. La Phase 12 globale reste ouverte.

## Traçabilité §25 / §26

- Source vérifiée : `c7.zip` / `index.html(16).txt`, **2 862 906 octets**, Git blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b` = R03 GREEN.
- Point de départ : `checkpoint/gensrpg-start-phase12-r04-builders-equipment-library-2026-10-17`, SHA `c311e8b721fcb789c89f2d1035a60f7e3ca3eec2`.
- Travail : `work/gensrpg-phase12-r04-builders-equipment-library-2026-10-17`.
- Jalon code/CI final : **`645f5fa9b849c1732e2c11f625548665067294ec`**.
- Checkpoint GREEN final : **`checkpoint/gensrpg-phase12-r04-builders-equipment-library-green-2026-10-17`**, pointant sur le même SHA.
- `main` toujours à `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## R04 — transformation

Propriétaire Builders ; 26 déclarations de fonctions de bibliothèque/éditeur d'équipements multi-modes extraites byte-identiques vers `assets/gensrpg/builders/equipment-library-editor-v1.js`, **27 860 octets** / blob `27cadba87c766b5293ac3a7fe3ddffb8510adc40`.

HTML résiduel **2 835 125 octets** / blob `554bf6100aeb0f40bfc098dc90863af7d2d5e439` (gain **27 781 octets HTML** par rapport à R03). Chargement classique synchrone avant le grand script restant. **L'appel `refreshCustomEquipmentIntoItems();` est conservé dans le monolithe à sa position d'origine** pour maintenir l'ordre d'initialisation. Aucune modification des moteurs de jeu, des règles de combat, des sessions générales ou de l'IndexedDB.

Le cache PWA versionné pré-cache le nouveau module. Le manifeste propriétaire recense le nouvel asset Builders. L'historique R04→R03→R02→R01 est contrôlé byte-exact en mémoire sans abaisser les signatures historiques.

## Contrôles

- [Application déterministe 38988466500](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38988466500) **SUCCESS** : source et sorties épinglées, parser JS, un propriétaire, init conservée et rollback.
- [Adaptation des tests historiques 38988745257](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38988745257) **SUCCESS**. Les sentinelles anciennes ont été adaptées aux nouveaux blobs/chemins avec vérifications strictes.
- [Architecture et Chromium 38989338985](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989338985) **SUCCESS**, incluant `architecture-sentinels` et `browser-sentinel`.
- [Firefox 38989339009](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989339009) **SUCCESS**.
- [Tactical dock 38989338929](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989338929) **SUCCESS**.
- Six checks GitHub SUCCESS au **même SHA `645f5fa9b849c1732e2c11f625548665067294ec`**.
- Pas d'essai manuel Android, de PWA installée hors ligne, ni d'accord manuel utilisateur attestés. GREEN = code et CI. Pas de fusion de production.

## Reprise

R05 non commencé. Ne pas confondre `c7.zip` (source R03) avec l'index R04 : [HTML R04 exact au SHA GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/645f5fa9b849c1732e2c11f625548665067294ec/index.html). Pour la suite, choisir la prochaine responsabilité réelle au sein du monolithe, ouvrir un checkpoint/une branche propres et préserver les autres modules. Ne pas ouvrir un chantier Dungeon D10 par inertie.
