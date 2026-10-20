# GenSrpG — CURRENT_WORK officiel (20 octobre 2026)

## Phase 12 / R13 — GREEN confirmé, Phase 12 globale ouverte

- **Dernier checkpoint GREEN — point de reprise unique** : `checkpoint/gensrpg-phase12-r13-builders-enemy-editor-green-2026-10-20` → **`e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec`** ; **7/7 CI SUCCESS sur le même SHA**. Checks : `architecture-sentinels`, `browser-sentinel`, `dock-chromium`, `dock-firefox`, `dock-contract`, `firefox-wall-zoom`, `builders-rollback`.
- **R13 START §25 avant tout code** : `checkpoint/gensrpg-start-phase12-r13-builders-enemy-editor-2026-10-19` → `0426ebe0ed619851c3c8ca9ed60afc33e39807ae`. Branche de travail `work/gensrpg-phase12-r13-builders-enemy-editor-2026-10-19`.
- **Source §26** : archive utilisateur `E1.zip` certifiée R10 ; transformations contrôlées R11 → R12 ; R12 GREEN 1 863 745 octets / blob `b0d0c73292e4374fc4f23e86edffad5c1b39a7b6`. Ne pas réutiliser un ancien index sans preuve de sa correspondance au checkpoint courant.
- **Extraction R13 GREEN** : **31 déclarations Builders/éditeur d'ennemis, 43 725 octets de fonctions originelles**, déplacées byte-identiques dans `assets/gensrpg/builders/legacy-enemy-editor-v1.js` (44 044 octets, blob `47b8d0e2b65bfffca4128d29c345b7e82af2a5fe`). `index.html` : **1 820 094 octets**, blob `b5a39705baf83e9782695c14bede8b9dde6ddf52`, soit **43 651 octets retirés**. Script classique synchrone, globals, source, propriétaire, pré-cache PWA et rollback R13→R12 protégés ; rollback historique R12→R09 maintenu.
- **Limites** : extraction physique et preuves automatiques uniquement ; pas de refonte des règles de combat/spawn, du moteur Core, de Capture, PvP, Survie ou Dungeon. Tests automatiques verts ≠ validation manuelle complète de la bibliothèque des ennemis. Le compteur de propriétaires de production passe de 130 à **131** sans doublon.
- **Production gelée** : `main` `e8681f9823573ced8aec59c8ddc47a72b02bc663` ; aucun merge ni modification des deux laboratoires.
- **Étape suivante** : nouvel audit EXIT **substantiel** (restes inline multi-domaines, responsabilités et coût) sur le R13 GREEN. **Ne pas annoncer la fin de Phase 12**, ne pas multiplier les micro-lots. Si un autre lot est justifié, créer **son propre START §25 avant toute modification**, appliquer §26 pour la source exacte, puis refaire CI et rollback complets.
- **Précédent checkpoint R12 GREEN** : `checkpoint/gensrpg-phase12-r12-dungeon-rpg-rules-talents-green-2026-10-19`, `0426ebe0ed619851c3c8ca9ed60afc33e39807ae` ; R12 et R13 ont chacun leurs checkpoints indépendants.

Charte : `docs/GENSRPG_CHARTE.md` §§1–5, 25–26 ; plan : `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md` Phase 12 ; rapport complet R13 : `docs/GENSRPG_PHASE12_R13_BUILDERS_ENEMY_EDITOR_2026-10-19.md`.
