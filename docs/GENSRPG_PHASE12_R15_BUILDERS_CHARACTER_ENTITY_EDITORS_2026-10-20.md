# GenSrpG — Phase 12 / R15 — Builders character and entity editors — GREEN

**20 octobre 2026 : extraction physique R15 et CI/browser validés sur le SHA unique `95740b6353a116c7e66b5d1095338b81d8b223bf`.** Phase 12 globale toujours ouverte.

## Gouvernance

- Source GREEN R14 : `checkpoint/gensrpg-phase12-r14-builders-rpg-universe-editor-green-2026-10-20`, SHA `39726aa1b00d8cf5e5a0ad5ff8af041093460fc9`.
- START §25 préalable : `checkpoint/gensrpg-start-phase12-r15-builders-character-entity-editors-2026-10-20` **sur le SHA R14 GREEN exact**, vérifié par comparaison GitHub. Branche unique `work/gensrpg-phase12-r15-builders-character-entity-editors-2026-10-20`.
- Source §26 réelle : `index.html` R14 **1 772 759 octets**, Git blob `dab5be5dedfa56c49d76d40a4cb824a0098903f0`; copie issue du ZIP utilisateur exact du checkpoint R13 et du transformateur R14 vérifié. Aucun HTML géant récupéré en lecture GitHub, aucune ancienne archive R10 substituée.
- GREEN R15 créé **après** les 5 contextes de statut `success`, sur le SHA unique `95740b6353a116c7e66b5d1095338b81d8b223bf` : `checkpoint/gensrpg-phase12-r15-builders-character-entity-editors-green-2026-10-20`. La documentation ci-après est **postérieure** au checkpoint et ne déplace pas la version certifiée.

## Responsabilité unique et périmètre

- **Builders / configuration et saisie d'entités** : 54 déclarations historiques de fonctions de l'éditeur de héros, équipements de départ, niveaux et progression de héros, créatures contrôlables, bibliothèques de compagnons, éditeur de caractéristiques et capacités des entités partagées.
- **Original byte-identique** : 42 990 octets de corps de fonctions transférés sans modification vers `assets/gensrpg/builders/legacy-character-entity-editors-v1.js`. 54 fonctions globales conservées, aucune nouvelle autorité runtime, aucune variable d'état ni initialisation déplacée. Le script externe est **classique synchrone au même emplacement** que l'anonyme #28 original. Aucun autre script conservé n'a changé de contenu.
- **Exclusions** : `showAbilityInfo`, `gensRefreshDynamicTagSelects` (aides génériques), `useCustomHeroNow` (activation Shell), `loadSharedEntities`, `saveSharedEntities`, `migrateSharedEntitiesToFamilyStorage` (stockage Core), `applyCustomHeroesMulti` (état runtime), `gensStarterCreatures` (données) et toutes les logiques Capture, gameplay et initialisations restent à leur propriétaire historique.
- Les fonctions de formulaires appellent les API Core/Shell/Capture déjà utilisées auparavant, sans les redéfinir. Les `const`/`let` globaux historiques restent dans le script restant et sont résolus après le chargement du parser.
- **Risque de comportement métier** : l'enregistrement de créatures contrôlables exige une famille RPG/Dungeon active ; les sentinelles navigateur utilisent le véritable profil Dungeon via l'API existante. Le formulaire de nom de héros tronque les entrées trop longues ; le jeu n'a pas été modifié pour contourner cette limite.

## Mesures exactes et inverse

| Objet | Source R14 certifiée | R15 certifiée |
|---|---|---|
| `index.html` | **1 772 759 o**, `dab5be5dedfa56c49d76d40a4cb824a0098903f0` | **1 729 855 o**, `9f35eb833a6ede4b91399854f19bb9bef59f45ab` |
| Script anonyme ciblé | **94 882 o**, `50e5b25ce6d3d9bf41c6e684f5548cc5842be935` | **51 892 o**, `629d27c9df8e7fea52c311248da189a065f69a6a` |
| Propriétaire Builders R15 | absent | **43 415 o**, `318aad27b69593f338ace5f3602dfd7fa351c274` |
| Balises script | 151 (62 externes) | **152 (63 externes)** |
| Registre propriétaires | 132 | **133** |
| Corps inline actifs | 978 755 o | **935 765 o** |
| Économie nette HTML | — | **42 904 o** |

- Outil contrôlé `tools/gensrpg_phase12_r15_builders_character_entity_editors.cjs` : source et 54 positions bloquées par empreintes ; fonctions `--check-source`, `--apply`, `--verify`, `--restore-r14`. Reconstitution de l'ancien HTML R14 **octet par octet**. Inverse historique des R14, R13, R12, R11, R10 conservé.
- Workflow one-shot `.github/workflows/gensrpg-phase12-r15-controlled-apply.yml` : vérifie START, SHA source et les blobs attendus, pré-cache SW/version et registre propriétaires ; ne commit que **4 artefacts** de jeu/manifest : nouvel owner, `index.html`, `service-worker.js`, `docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json`.
- Les autres différences dans la branche correspondent aux tests CI, adaptateurs d'inverse historiques et documentation ; aucune modification des moteurs actifs anciens ou de leur source de vérité.

## Certifications GitHub Actions sur un SHA

SHA exact **`95740b6353a116c7e66b5d1095338b81d8b223bf`** : les contextes `gensrpg/r15/history`, `gensrpg/r15/architecture`, `gensrpg/r15/tactical`, `gensrpg/r15/regression-modes`, `gensrpg/r15/browser-parity` sont tous `success`.

- [Run CI 39421460106](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39421460106) : **19 tests Node actifs** répartis en 6 sentinelles d'historique R10–R15, 8 de cartographie/owner, 2 Core Dice/Tactical, 3 de non-régression inter-modes. Les 4 jobs sont `success` sur le même SHA.
- [Run navigateur 39421460053](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39421460053) : **Chromium et Firefox** comparent les **mêmes actions** R14 puis R15 — créer et sauver une créature (PV personnalisés 31), créer et sauver un héros (PV 7), relire les données après rechargement ; verdict identique et GREEN dans les 2 navigateurs. Ils reprennent également la parité historique de l'éditeur RPG et des sauvegardes entre R13 et le code installé, ainsi que le test Chromium Survie/Dungeon des ennemis personnalisés.
- **Gouvernance GREEN** : avant création du checkpoint, comparaison `HEAD R15 = SHA certifié`, `START R15 = R14 GREEN` et `main = e8681f9823573ced8aec59c8ddc47a72b02bc663` toutes `identical`. Aucun laboratoire ou image Survie historiquement gelée modifié.
- Une ancienne sentinelle Tactical V114.5 est historiquement rouge **déjà au R13** et demeure documentée sous R14 GREEN. Elle n'a pas été supprimée ni modifiée ; les contrôles Tactical actifs continuent de réussir.
- **Test manuel tactile sur smartphone non effectué** ; la certification ci-dessus prouve la parité des parcours couverts, pas chaque écran possible des quatre modes.

## Suite de Phase 12

**Ne pas ouvrir mécaniquement R16.** Il reste environ **936 Ko de corps inline actifs**, dont un grand bloc anonyme multi-domaines de **542 293 octets**, et un reliquat de ~52 Ko dans le deuxième anonyme ; une phase EXIT exige de reconnaître des responsabilités uniques, de distinguer les vrais bootstraps et de définir un critère d'arrêt, sans micro-lots ni transfert de plusieurs moteurs en bloc. Prochain chantier : audit post-R15 avec son **propre checkpoint START §25**, cartographie AST §26 de l'index exact R15, puis décision justifiée avant tout déplacement.
