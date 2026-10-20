# GenSrpG — Phase 12 / R13 — Builders Enemy Library & Editor

**19 octobre 2026 — START réalisé et transformation candidate certifiée localement, GREEN interdit avant CI.**

## Origine et conformité charte

- R12 GREEN : `checkpoint/gensrpg-phase12-r12-dungeon-rpg-rules-talents-green-2026-10-19`, SHA `0426ebe0ed619851c3c8ca9ed60afc33e39807ae`, 7/7 CI SUCCESS.
- Checkpoint §25 **avant tout changement de code** : `checkpoint/gensrpg-start-phase12-r13-builders-enemy-editor-2026-10-19` → même SHA. Branche : `work/gensrpg-phase12-r13-builders-enemy-editor-2026-10-19`.
- Provenance §26 : la copie R12 locale provient de la source utilisateur E1.zip certifiée R10, après transformations déterministes R11 et R12 ; taille **1 863 745 octets** et Git blob **`b0d0c73292e4374fc4f23e86edffad5c1b39a7b6`**, exactement le blob R12 GREEN.
- AST TypeScript/JavaScript de l'anonyme n°23 : **0 diagnostic de parsing** ; toutes les 31 déclarations sélectionnées sont des fonctions top-level pures au sens de déclaration (pas de code d'initialisation top-level déplacé), noms uniques, corps d'origine conservés. L'ancien anonyme représente 633 434 octets.
- Propriété : **Builders — bibliothèque et éditeur d'ennemis / créatures**. Exclure runtime ennemis (conversion vers Zombie, spawn, combat), sauvegarde générique, Core, autres modes et tous états variables.
- Propriétaire candidat `assets/gensrpg/builders/legacy-enemy-editor-v1.js` avec un seul script classique synchrone immédiatement avant le monolithe d'origine.
- **31 fonctions / 43 725 octets** historiques dont `enemyImageChanged`, `renderEnemyAbilitiesEditor`, `renderEnemyPhasesEditor`, `enemyFormObject`, `openEnemyEditor`, `saveEnemyEditor`, `renderEnemyLibrary`, `closeEnemyManager`.

## Résultats de la transformation candidate (stricts, non GREEN)

- Sortie `index.html` proposée : **1 820 094 octets** / Git blob **`b5a39705baf83e9782695c14bede8b9dde6ddf52`**, soit **43 651 octets** de moins.
- Nouveau fichier JS proposé : **44 044 octets** / Git blob **`47b8d0e2b65bfffca4128d29c345b7e82af2a5fe`**.
- Monolithe restant : Git blob **`bc60b190f9295f9bcb0e4f94cf26b919873c66ac`** ; parser VM valide et mêmes instructions non sélectionnées.
- Inverse local R13→R12 byte-identique. Application pilotée par `tools/gensrpg_phase12_r13_builders_enemy_editor.cjs` sur runner avec refus de toute autre empreinte source, contrôle de l'ordre parser, SHA exact des sorties, propriétaire et version/pré-cache PWA.
- Preuve complète encore requise : sentinelles historiques, Architecture et navigateur, Firefox, Tactical, R13→R12→R11→R10→R09 ; pas de checkpoint final sans succès sur un SHA unique.
- Aucune modification autorisée de `main` gelé `e8681f9823573ced8aec59c8ddc47a72b02bc663`, ni laboratoires Combat/Exploration. Validation manuelle future de la bibliothèque ennemis recommandée.

**Phase 12 EXIT encore ouverte** ; ne pas fractionner ce périmètre en micro-lots ni préjuger de R14.

## Certification finale — 20 octobre 2026

- **Résultat** : R13 **GREEN**, 7/7 checks GitHub Actions SUCCESS sur le **même SHA de code** `e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec`. Les sept jobs sont `architecture-sentinels`, `browser-sentinel`, `dock-chromium`, `dock-firefox`, `dock-contract`, `firefox-wall-zoom`, `builders-rollback`.
- **Checkpoint immutable** : [`checkpoint/gensrpg-phase12-r13-builders-enemy-editor-green-2026-10-20`](https://github.com/slyen4425-cloud/Zombicide-40k/tree/checkpoint/gensrpg-phase12-r13-builders-enemy-editor-green-2026-10-20), créé **après** les sept succès, sur `e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec`.
- **Changement de code** : 31 déclarations propriétaires Builders déplacées sans modifier leurs corps ; les seules adaptations ultérieures concernent les sentinelles de source, d'ordre de chargement, d'inventaire des 131 propriétaires et la réversibilité. Aucun changement de gameplay autoritaire revendiqué.
- **Preuves** : `index.html` 1 820 094 octets, Git blob `b5a39705baf83e9782695c14bede8b9dde6ddf52` ; module Builders 44 044 octets, Git blob `47b8d0e2b65bfffca4128d29c345b7e82af2a5fe`. Rollback R13→R12 byte-identique et chaîne historique protégée ; navigateur Architecture SUCCESS.
- **Hors périmètre** : pas de test manuel déclaré, pas de fusion vers `main`, pas de changement des laboratoires. La **Phase 12 globale reste ouverte** ; choisir seulement un prochain lot réellement justifié, avec START §25 et source §26 exacts.
