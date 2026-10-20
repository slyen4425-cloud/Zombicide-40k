# GenSrpG — Phase 12 / R14 — Extraction de l'éditeur de configuration d'univers RPG

**20 octobre 2026 — R14 GREEN structurel et automatisé : code certifié sur son SHA, sans fusion dans `main`.**

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
- **État de certification final** : tous les contrôles actifs et les contrôles d'historique décrits ci-dessous sont GREEN sur **un seul SHA**. Un test archivistique Tactical V114.5 reste historiquement rouge, avec preuve qu'il échoue déjà sur le code R13 GREEN. Il n'a été ni modifié ni masqué ; son statut historique est documenté séparément et ne constitue pas un test de régression du déplacement R14.
- Publication `main`, service worker production et laboratoires : **non modifiés**.

## Prochaine étape

1. **Accompli** : sentinelles d'architecture recertifiées pour le nouvel inventaire 151 scripts / 132 propriétaires, sans changement des règles d'unicité ni des contrats précédents.
2. **Accompli** : parité navigateur Chromium/Firefox du parcours RPG (ouverture, identité, XP par niveau, sauvegarde et rechargement). Le test de séparation Survie/Dungeon des personnalisations d'ennemis passe également en Chromium. Validation tactile manuelle sur smartphone encore conseillée ; elle n'est pas présentée comme réalisée.
3. **Accompli** : checkpoint GREEN créé exactement sur le SHA testé. Aucun prochain lot R15 ouvert automatiquement, Phase 12 EXIT **encore ouverte**.

## Certification GREEN — 20 octobre 2026

- **SHA unique certifié** : `39726aa1b00d8cf5e5a0ad5ff8af041093460fc9` sur `work/gensrpg-phase12-r14-builders-rpg-universe-editor-2026-10-20`.
- **Checkpoint de fin §25** : `checkpoint/gensrpg-phase12-r14-builders-rpg-universe-editor-green-2026-10-20`, créé sur ce SHA **seulement après** vérification par le connecteur GitHub du statut `success` des six contextes et de l'identité du HEAD.
- **GitHub Actions CI, cinq jobs GREEN** : https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39415175892 : `gensrpg/r14/r14-history` (5 sentinelles R10→R14), `gensrpg/r14/architecture` (8), `gensrpg/r14/core-tactical` (2), `gensrpg/r14/regression-modes` (3 contrôles actifs) et `gensrpg/r14/archived-v1145-baseline` (caractérisation de la sentinelle historique R13/R14).
- **GitHub Actions navigateur GREEN** : https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39415175867 : **Chromium et Firefox** ont exécuté les mêmes scénarios R13 et R14 (ouvrir/configurer/enregistrer/recharger le nom et 17 XP par niveau) avec résultats identiques. Une autre sentinelle Chromium a confirmé la préservation des personnalisations d'ennemis Survie/Dungeon et des ennemis personnalisés.
- **Réserve historique factuelle** : le test archivistique de l'intégration Tactical V114.5 demande un chargement historiquement inactif. Le contrôle `archived-v1145-baseline` exécute effectivement cette même sentinelle dans deux working trees Git R13 GREEN / R14 et observe le **même échec préexistant** ; fichier de test et fichiers Tactical cibles sont bit-identiques entre R13 et R14. Ce n'est pas présenté comme « test Tactical V114.5 vert ». Les tests Tactical actifs (session, Core Dice, stats et composition) sont verts.
- **Portée GREEN** : extraction structurelle à comportement fonctionnel comparable aux scénarios R13 testés. Pas de nouvelle autorité runtime, pas d'ajout de mécanique de jeu, pas de preuve prétendue pour une session manuelle mobile. Les 32 images historiques Survie, les laboratoires et la branche `main` ne sont pas modifiés.
- **Validation post-GREEN** : le rapport et `GENSRPG_CURRENT_WORK.md` pourront être engagés comme *documentation seulement* après le checkpoint, sans déplacer le pointeur GREEN ni appeler un nouveau commit « même SHA validé ».
