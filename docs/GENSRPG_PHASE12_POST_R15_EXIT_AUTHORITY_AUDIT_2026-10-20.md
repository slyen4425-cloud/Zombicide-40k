# GenSrpG — Phase 12 / audit EXIT post-R15 : propriétaires et écritures globales

**20 octobre 2026. Audit documentaire et sentinelle statique : aucune modification de comportement ni de runtime. Phase 12 non terminée.**

## 1. Autorité du chantier / §25 et §26

- Dernier **R15 GREEN** : `checkpoint/gensrpg-phase12-r15-builders-character-entity-editors-green-2026-10-20`, SHA `95740b6353a116c7e66b5d1095338b81d8b223bf`. Les cinq contextes CI actifs ont été vérifiés `success` sur ce SHA, les deux commits postérieurs de la branche R15 n'affectent que les rapports.
- START d'audit préalable : `checkpoint/gensrpg-start-phase12-post-r15-exit-audit-2026-10-20` au **même SHA** ; branche séparée `work/gensrpg-phase12-post-r15-exit-audit-2026-10-20`.
- Source exacte §26 provenant du ZIP R13 utilisateur via les transformateurs R14 et R15 certifiés : `index.html` **1 729 855 octets**, Git blob **`9f35eb833a6ede4b91399854f19bb9bef59f45ab`** ; identité contrôlée avec le checkpoint GitHub. [Permalien de la source](https://github.com/slyen4425-cloud/Zombicide-40k/blob/95740b6353a116c7e66b5d1095338b81d8b223bf/index.html). Aucun transit du très gros fichier par le connecteur GitHub.
- Inspection locale avec l'AST TypeScript et une extraction de balises script sans modification de source. Sentinelle de non-dérive : `tests/gensrpg_phase12_post_r15_inline_authority_baseline.test.cjs` ; elle ne dépend pas de TypeScript sur le runner, se base sur le blob exact et l'expression `window.NOM =` et produit le même relevé.

## 2. État exact de la sortie après R15

| Inventaire sur le vrai R15 GREEN | Mesure |
|---|---:|
| Taille totale `index.html` | **1 729 855 octets** |
| Balises script | 152 |
| Scripts externes | 63 |
| Scripts inline actifs | **89** |
| JS inline encore présent | **935 765 octets** |
| Scripts inline dotés d'un `id` | 84 — **334 780 octets** |
| Scripts anonymes | 5 — **600 985 octets** |
| Premier anonyme multi-domaines, index script n°24 (indice zéro) | **542 293 octets**, **718 fonctions top-level** |
| Deuxième anonyme, index n°28 | **51 892 octets**, **61 fonctions top-level** |
| Autres anonymes | 219 octets (bootstrap), 6 337 octets (IIFE Dungeon), 244 octets (bootstrap) |
| Noms `window.NOM` affectés directement dans ces scripts inline | **209** |
| Cibles avec plusieurs scripts écrivains | **38** |

Les 84 scripts nommés incluent **81 identifiants affichant une intention Dungeon** (`dungeon*`, `dc*`, `gensrpgDungeon*`, `coreCombatPool*`) soit **319 305 octets**. *C'est un classement par nom, PAS une preuve que leurs effets appartiennent tous exclusivement à Dungeon.* Deux grands anonymes demeurent multi-domaines et leurs variables, états et effets d'initialisation interdisent un déplacement « en bloc » sans analyse des dépendances.

L'ancien `index.html` avant extraction D1 était de 7 934 204 octets. Le HTML s'est allégé de **6 204 349 octets** (environ 78,2 % en taille), mais ce chiffre contient l'externalisation des grosses données d'images. **Il ne prouve pas que 78 % de la séparation d'autorité est achevée.** La dette d'architecture est concentrée dans les appels et les réaffectations résiduels, pas uniquement dans le poids du fichier.

## 3. Résultat prioritaire — 38 écrivains globaux partagés

Sur le R15 **exact**, la recherche statique de `window.NOM =` dénombre **38 noms de propriétés globaux** écrits par au moins deux **blocs inline distincts**. Elle ne compte pas les scripts externes, les écritures calculées `window[key]` ou les propriétés d'autres objets : c'est donc un **minimum observé**, et non l'inventaire garanti de tous les propriétaires runtime.

| Contrat global historique | Nombre de scripts inline écrivains | Scripts repérés (indices de la liste des 152 tags) |
|---|---:|---|
| `renderDungeonCombatRound` | **11** | 58, 60, 61, 63, 65, 68, 69, 73, 94, 100, 136 |
| `dungeonRunAi156` | **8** | 51, 63, 64, 68, 73, 74, 79, 136 |
| `dungeonMapHtml` | **7** | 84, 89, 90, 91, 92, 93, 107 |
| `openDungeonCombatVictoryPopup` | **5** | 52, 53, 61, 76, 132 |
| `saveDungeonMj151` | **5** | 49, 52, 60, 61, 87 |
| `dungeonAdvanceTurn156` | **4** | 51, 65, 74, 136 |
| `dungeonAiLast023` | **4** | 63, 64, 68, 73 |

Les **31 autres** cibles recensées sont notamment : `closeAttackRoll`, `closeDungeonCombat`, `closeSpecialRoll`, `dc030EngageCombat`, `dc032LeaveAfterGameOver`, `dc033ForceHome`, `dc036ContinueAi`, `dc045ApplyHeroCombatMode`, `dc045HeroCombatEnabled`, `dc047AnswerPuzzle`, `dc047StealthPrompt`, `dc304DefeatExited`, `dungeonActiveProgressionConfig`, `dungeonBuildOrder156`, `dungeonCombatActive`, `dungeonCombatFlee169`, `dungeonCombatRestart169`, `dungeonEnsureLoot160`, `dungeonHandleLevelUp071`, `dungeonInitTurn156`, `dungeonLootCatalog160`, `enemyCardHtml`, `finishDungeonCombatVictory`, `generateDungeonMap`, `openDungeonMj151`, `openMerchant`, `openZombieRule`, `renderActiveEnemies`, `renderParticipantSelector`, `rollDungeonEnemyAttackSkill`, `startDungeonClassicCombat`.

L'inventaire exhaustif machine est recalculable par `node tests/gensrpg_phase12_post_r15_inline_authority_baseline.test.cjs --detail`. SHA-256 de la matrice exacte `NOM:index1,index2,...` triée : `71786039cf06f21b1728d454bb55e7007d986377f78bc4e434aef138af0432f7`.

**Interprétation stricte :** certaines affectations sont conditionnelles, d'autres enveloppent un propriétaire précédent (`oldRender`, `prev`), d'autres le remplacent. La répétition visible est une **preuve de surfaces de réaffectation concurrentes**, mais pas la preuve que onze implémentations restent actives simultanément ou que le jeu est actuellement cassé. Avant correction, relever les écritures *réellement exécutées*, leur ordre, les chemins utilisateurs et l'autorité finale y compris les modules externes.

## 4. Décision : priorité à la stabilité, pas à R16 automatique

1. **Dungeon combat/IA :** propriétaire unique à démontrer pour `renderDungeonCombatRound`, `dungeonRunAi156`, `dungeonAdvanceTurn156`, popups victoire et cycle des tours. Capturer la chronologie réelle des écrivains, prévoir une transition soustractive vers le propriétaire existant Tactical/Dungeon tel que prescrit par la charte, puis tester vrais combats, départ/retour/KO, dégâts, stats et sauvegardes.
2. **Dungeon carte/exploration :** `dungeonMapHtml` (7 surfaces d'écriture) et `generateDungeonMap` ; inventorier les variantes de carte, murs/portes/objets et édition, vérifier le choix du rendu officiel. Aucun « dernier script gagne donc c'est correct » sans parcours réel.
3. **Profil/stockage/modes :** le gros anonyme #24 et le reliquat #28 mélangent Shell, Core, Dungeon, Capture, Survie et données. Construire une cartographie AST des lectures/écritures d'état lexical et des appels inter-modes. Ne pas déplacer le bloc entier vers `core` ou `builders` ; aucun changement des sauvegardes historiques en phase d'audit.
4. **Scripts nommés :** ne pas ouvrir 81 micro-lots Dungeon. Regrouper seulement après preuve que l'ordre parser peut être préservé et qu'il existe **une autorité métier unique** ; si ces blocs sont des patchs qui se remplacent, les **consolider de façon soustractive** avant de leur attribuer un seul module de destination.
5. **Critère d'arrêt Phase 12 :** `index.html` ne contient plus de moteur/règles actifs inline (seuls bootstraps explicitement documentés permis) ; aucun changement d'autorité non audité ni résidu de patch multi-écrivain ; propriétaires Core/Shell/Survie/Dungeon/Tactical/Capture/PvP/Builders documentés ; CI navigateur Chromium/Firefox, Tactical et les quatre modes + sauvegarde/reprise et PWA vérifiés au même SHA ; validation manuelle smartphone distinguée de la CI.

**Conclusion de chantier :** R15 GREEN est conservé et **aucun R16 n'est créé dans cet audit**. Le prochain chantier utile n'est pas « extraire encore 5 Ko » : c'est un diagnostic de la chaîne **Dungeon combat/IA et rendu de carte**, isolé par checkpoint/branche propres si modification, pour supprimer les sources de vérité concurrentes. Le présent lot est exclusivement documentaire/test et ne change ni `index.html`, ni le moteur, ni la PWA, ni `main`, ni les laboratoires.

## 5. Résultat du chantier d'audit (GREEN)

- Sentinelle automatisée sur SHA `577352f0b7092d2a3e87630f7168926c5c8957e0` : **SUCCESS** dans le [run GitHub Actions 39430951106](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39430951106). Les étapes de vérification du SHA original R15, de diff runtime exact, des 152 scripts/935 765 octets et des 38 multi-écrivains sont toutes SUCCESS.
- **Checkpoint documentaire GREEN créé** : `checkpoint/gensrpg-phase12-post-r15-exit-authority-audit-green-2026-10-20` sur ce SHA certifié. Les modifications documentaires post-checkpoint n'altèrent ni le code R15 GREEN ni l'inventaire testé.
- Ce GREEN **valide le diagnostic statique, pas la résolution des 38 contrats**. Aucun bug métier n'a été déclaré réparé, aucun test tactile mobile prétendu et aucune phase globale clôturée.
