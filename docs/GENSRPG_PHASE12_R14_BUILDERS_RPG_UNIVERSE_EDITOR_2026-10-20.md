# GenSrpG — Phase 12 / R14 — Extraction de l'éditeur de configuration d'univers RPG

**20 octobre 2026 — code R14 appliqué sur sa branche, GREEN non encore certifié.**

## Gouvernance et base (§§25–26)

- Base R13 GREEN **`e22de3ae8d0d4f07ef7972c80f838dbf96d9e9ec`**, checkpoint `checkpoint/gensrpg-phase12-r13-builders-enemy-editor-green-2026-10-20`, 7/7 CI R13 SUCCESS.
- Checkpoint START créé **avant la moindre modification** : `checkpoint/gensrpg-start-phase12-r14-builders-rpg-universe-editor-2026-10-20` sur le même SHA.
- Branche dédiée : `work/gensrpg-phase12-r14-builders-rpg-universe-editor-2026-10-20`. Aucune modification de `main`, des deux laboratoires ou des 32 assets Survie.
- Source §26 utilisateur : archive **`e1.zip`**, membre `index.html(1).txt`, **1 820 094 octets**, Git blob **`b5a39705baf83e9782695c14bede8b9dde6ddf52`**, SHA-256 `e54d03be07e7efb9b9cfa39d9289823ecc09b1eaf3524c39abfe5338ed60594b`. Différent de l'ancienne archive R10 homonyme `E1.zip`.

## Propriété et frontières

- **Propriétaire cible** : Builders (édition/présentation des paramètres RPG, configurateur d'univers, formulaires d'événements, rencontres et éléments).
- **41 déclarations de fonctions top-level historiques**, sélection explicite par noms et positions AST, total **47 416 octets de corps**, transférés **strictement byte-identiques**, sans déplacer de variables, d'initialisateurs, de listeners ni de moteur.
- Les appels existants à `saveGameProfiles`, `ensureRpgProfileData`, `applyGameProfile`, `syncRpgUniverseToDungeonRules`, et aux services de rendu restent **inchangés** : aucune nouvelle source de vérité ni redéfinition de ces fonctions n'a été créée. Leur couplage historique restant est conservé comme dette, non présenté comme nouvelle API.
- Exclusions explicites : `openRpgUniverseEditor`, `selectRpgUniverseProfile` (navigation et activation Shell), `reloadRpgGameplayFromProfileId`, `loadRpgGameplayByProfile`, `saveRpgGameplayByProfile`, `gensRollLocationEncounter`, états, règles de combat, spawn, stockage Core, Survie, Capture, Tactical et PvP.
- Script classique **synchrone avant l'anonyme d'origine** : l'ordre du parser et les noms de fonctions globales sont conservés. Le code externe contient des déclarations, aucune initialisation top-level.

## Application physique contrôlée

| Élément | R13 exact | R14 exact |
|---|---|---|
| `index.html` | **1 820 094 octets** / `b5a39705...` | **1 772 759 octets** / `dab5be5dedfa56c49d76d40a4cb824a0098903f0` |
| Corps anonyme n°24 R13 | 589 709 octets / `bc60b190...` | 542 293 octets / `feee6ec2b17c932864b804f14ed2b3b1cd064cad` |
| Module Builders R14 | absent | **47 750 octets** / `3faa1131bd6a9a2c4a672a4f18d49f49bcdb9107` |
| Scripts HTML | 150 | 151 |
| Déclarations déplacées | — | **41**, octets d'origine inchangés |
| Économie nette d'index | — | **47 335 octets** |

- Outil gardé par les empreintes `tools/gensrpg_phase12_r14_builders_rpg_universe_editor.cjs` : `--check-source`, `--apply`, `--verify`, `--restore-r13`.
- Workflow `.github/workflows/gensrpg-phase12-r14-controlled-apply.yml` : refuse une source ou un checkpoint différent, exécute les comparaisons de blobs, rollback exact, puis engage **quatre fichiers seulement**.
- **Application effective** : GitHub confirme les modifications de `index.html`, `assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js`, `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json` et `service-worker.js`. Blobs Git exacts du HTML et du module vérifiés sur la branche.
- Registre de propriétaires : 131 → **132** (nouveau propriétaire Builders), zéro duplication ajoutée. Pré-cache du script R14 et version cache `-r14-builders-rpg-universe-editor`.

## Contrôles disponibles et réserves

- **Exécuté localement sur la source certifiée** : extraction 41 fonctions, parsing VM du module et du reliquat, restauration R14→R13 strictement identique à l'octet ; calcul exact de toutes les empreintes attendues.
- **Exécuté par le workflow de transformation** : les quatre fichiers de code ont été effectivement engagés sur la branche ; les gardes du workflow conditionnent ce commit à `--apply`, `--verify`, `--restore-r13`, `node --check`, source Git, SHA et rollback. Ce constat ne remplace pas le relevé de conclusion d'un run.
- **Sentinelle dédiée** : `tests/gensrpg_phase12_r14_builders_rpg_universe_sentinel.test.cjs`; workflow `gensrpg-phase12-r14-builders-sentinels.yml`. Vérifie les 41 noms et globals, 151 scripts, inverse R13 exact, absence des fonctions protégées dans le module, propriétaire et PWA.
- **Manquent encore à la clôture** : l'état final de chaque suite Architecture/Chromium, Firefox, Tactical et de la sentinelle R14 sur **un unique HEAD final** ; adaptations justifiées de tests de cartographie qui attendent encore 150 scripts, 131 propriétaires et les empreintes R13 ; validation navigateur de l'ouverture, l'édition, la sauvegarde et la reprise des paramètres RPG. Les anciens tests ne doivent pas être affaiblis pour obtenir un vert artificiel.
- **Aucune CI GREEN revendiquée pour R14** ; si un test est rouge, garder R13 comme référence, corriger uniquement la couverture devenue obsolète ou revenir au checkpoint plutôt que masquer une régression.
- Publication `main`, service worker production et laboratoires : **non modifiés**.

## Prochaine étape

1. Confronter les vraies suites CI, adapter uniquement les attentes de recensement devenues incorrectes (ajout d'un script Builders, 132 propriétaires) sans perdre les tests historiques.
2. Confirmer le comportement d'éditeur d'univers RPG dans Chromium, Firefox puis manuellement sur mobile.
3. Seulement après **toutes les validations sur le même SHA**, créer le checkpoint `checkpoint/gensrpg-phase12-r14-builders-rpg-universe-editor-green-2026-10-20` et actualiser CURRENT_WORK. La Phase 12 globale **reste ouverte** même après ce jalon.
