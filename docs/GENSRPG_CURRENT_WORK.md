# GenSrpG — CURRENT_WORK officiel (16 octobre 2026)

**Phase 12 : D1–D9, R01 et R02 GREEN. R03 Shell Hub UI actif en préflight ; R03 NON GREEN.** Le dernier code certifié reste R02 `b5f923fa0426467827c12696ad9a4a02f24e3b6f` et le checkpoint `checkpoint/gensrpg-phase12-r02-legacy-visual-data-extraction-green-2026-10-16`.

## R03 — extrait contrôlé de la présentation du Hub des quatre modes

- **Base exacte §25 :** `e8700f10aca7d4f3b9c85aa3cd4dc11aae6530ab` (un seul commit documentaire au-dessus du code R02 GREEN, CI Architecture/Firefox/Tactical SUCCESS ; blobs runtime identiques à R02).
- **Checkpoint de départ créé avant toute édition :** `checkpoint/gensrpg-start-phase12-r03-shell-hub-family-ui-extraction-2026-10-16` sur ce SHA.
- **Branche unique :** `work/gensrpg-phase12-r03-shell-hub-family-ui-extraction-2026-10-16`.
- **Source §26 certifiée :** `c6.zip` / `index.html(15).txt`, 2 869 485 octets, Git blob `062c4cd37634f504cc75ce3329d6e69e19b5f547` (exact code R02 GREEN).
- **Périmètre choisi, propriétaire :** Shell — six déclarations de fonctions contiguës `renderGensRpgUniverseCards`, `renderGensSurvivalUniverseCards`, `renderGensFamilyGamesIfVisible`, `openGensFamily`, `gensFamilyForProfileId`, `renderGensGameHomeLight` ; écran famille/cards/Hub. Aucune nouvelle logique de gameplay.
- **À ne pas déplacer ici :** `openGensBuiltInGame`, `newGame`, `resumeGame`, nettoyage de sélection, interruptions de sessions, IndexedDB, mutations de sauvegardes, Core/Dungeon/Capture/Survie/Tactical, PvP placeholder.
- **Extraction calculée localement et réversible, NON appliquée sur GitHub :** six fonctions = 6 651 octets de code ; nouvel index projeté 2 862 906 octets, blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b` ; nouveau JS projeté `assets/gensrpg/shell/legacy-hub-family-ui-v1.js`, blob `e45f3b4e419a10b030c47bc921bded1ec0dc723b`. Rollback vers R02 exact vérifié localement. **Il n'y a pas encore de nouveau runtime poussé ni de CI R03.**
- **Gates avant GREEN :** parser-order classique synchrone, une seule copie de chaque fonction, parité des cartes Survie/Aventure/Capture et placeholder PvP, chargement GitHub Pages/preview, service worker et hors-ligne, sauvegardes intactes, rollbacks R03→R02→R01, Architecture/Chromium, Firefox et Tactical SUCCESS au même SHA, puis checkpoint final GREEN.
- **Risques :** fonctions globales héritées utilisées par attributs onclick, environnement lexical commun entre scripts classiques, sentinelles historiques vérifiant encore le blob R02 et inventaires de propriétaires ; ne pas contourner les sentinelles sans restauration historique exacte.
- **Autres pistes R02** : conservées en attente, sans fusion ni suppression. `main` gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; deux laboratoires et 32 images historiques Survie hors périmètre.

## Après R03

Continuer R03–R07 selon frontières et responsabilités prouvées dans le monolithe de 1 264 265 octets ; préférer un lot cohérent à des dizaines de Core Dungeon mécaniques. Le source R02 `c6.zip` a été certifié pour ce lot ; recontrôler le SHA et demander un nouveau ZIP §26 pour tout index ultérieur.
