# GenSrpG — Phase 12 / diagnostic de propriété réelle Dungeon (20 octobre 2026)

**Statut : audit navigateur / statique GREEN, moteur et gameplay non modifiés.** La Phase 12 reste ouverte et les 38 cibles d'écriture globale ne sont pas « réparées » par ce diagnostic.

## Gouvernance et source

- Source de code : **R15 GREEN** `checkpoint/gensrpg-phase12-r15-builders-character-entity-editors-green-2026-10-20` à `95740b6353a116c7e66b5d1095338b81d8b223bf`.
- Source de l'audit initial : `checkpoint/gensrpg-phase12-post-r15-exit-authority-audit-green-2026-10-20` à `577352f0b7092d2a3e87630f7168926c5c8957e0`, qui comprend la sentinelle du recensement des 38 multi-écrivains.
- START **avant travail** : `checkpoint/gensrpg-start-phase12-dungeon-authority-trace-2026-10-20`, même SHA que le dernier audit ; branche dédiée `work/gensrpg-phase12-dungeon-authority-trace-2026-10-20`. Pas de R16 ouvert ni changement de propriétaire runtime.
- Source exacte §26 : `index.html` **1 729 855 octets**, Git blob **`9f35eb833a6ede4b91399854f19bb9bef59f45ab`**, copie locale reconstruite depuis le ZIP utilisateur R13 et les transformateurs certifiés R14→R15, vérifiée avec GitHub. [Permalien SHA R15](https://github.com/slyen4425-cloud/Zombicide-40k/blob/95740b6353a116c7e66b5d1095338b81d8b223bf/index.html).

## Preuve exécutable et CI

- Sentinelle `tests/gensrpg_phase12_dungeon_authority_parser_trace.cjs` : le runner sert le **HTML de code R15 exact** et, dans une seconde page isolée seulement, insère des points de lecture après chacun des **152 scripts**. La sonde ne réassigne aucune fonction, ne déclenche aucun combat et ne commite jamais l'HTML instrumenté. Une première page charge l'HTML **non modifié** : les corps des huit fonctions finales doivent être **strictement identiques** dans les deux pages.
- Résultat [GitHub Actions **39434522603**](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/39434522603) : **Chromium et Firefox SUCCESS**, 152/152 points d'observation et ordre préservé, 0 erreur de page non instrumentée et 0 erreur de page instrumentée. Test supplémentaire : une carte factice **2×2** (sol, mur, porte, coffre) rend exactement le même HTML avec/sans sondes ; visuels `dc080Grid`, porte et mur présents. **Ce n'est pas un parcours joueur de génération/entrée de salle**.
- La CI vérifie en amont le blob index exact, la sentinelle de base des 38 recouvrements et un `git diff --exit-code` sur **index, SW, assets/gensrpg et manifeste owners** par rapport au SHA R15 GREEN.
- **Checkpoint d'audit GREEN** : `checkpoint/gensrpg-phase12-dungeon-authority-trace-green-2026-10-20` sur le SHA certifié **`905856d0cb4ce04068daf8f7d9bd08b46d556799`**. Avant sa création : statut `gensrpg/phase12/dungeon-authority-trace` SUCCESS sur ce SHA, HEAD identique, `main` identique et **zéro fichier runtime changé**. Les modifications documentaires après ce checkpoint ne déplaceront pas sa référence.

## Diagnostic AST et chargement : propriétaire effectif après amorçage

Les numéros de script ci-dessous sont les **indices zéro** de `index.html` R15. Les événements indiquent un *changement d'identité* de la fonction au cours du chargement réel, pas une simple recherche textuelle de `window.NOM =`.

| API et destination historique | Évolutions réellement observées à l'amorçage | Propriétaire effectif **après chargement** |
|---|---|---|
| `renderDungeonCombatRound` | Déclaration initiale #24 ; remplacements/wrappers #58, #60, #61, #63, #65, #68, #69, #73, #94, #100 ; composants externes #131, #133, #134 ; entrée finale #136 | **`dungeonCore303TimelineRootFix` #136**, fonction de gestion timeline ; elle délègue le visuel à `__dc214RenderCombat` |
| `__dc214RenderCombat` | Propriétaire visuel **`core214-single-authority-v1.js` #134** ; wrapper UI d'aptitudes objets **`dungeon-core-316.js` #135** | **Core 2.14 + extension UI 3.16**, réutilisé par Core 3.03 et non remplacé à nouveau ensuite |
| `dungeonRunAi156` | Nouvelle fonction #51, #63, #64, #68, #73, #74, #79 ; désactivation héritage #134, finale #136 | **`function(){}`**, explicitement neutralisée par **Core 3.03 #136** |
| `dungeonAdvanceTurn156` | #51, #65, #74 ; désactivation #134, finale #136 | **`function(){}`**, explicitement neutralisée par **Core 3.03 #136** |
| `dungeonMapHtml` | Fonction initiale #24 puis **sept** implémentations successives #84, #89, #90, #91, #92, #93, **#107** | **`dungeonCore080FinalMapRenderer` #107**, rendu final des cartes observé ; antérieures intégralement remplacées |
| `generateDungeonMap` | #24, #84, **#93** | **`dungeonCore060` #93** au chargement |
| `openDungeonCombatVictoryPopup` | #24, #52, #53, #61, #76, externe #120, **#132** | **`dungeonCore212RenderVictory` #132** au chargement |
| `__dc302RenderCombat` | **#136** | même fonction que l'entrée `renderDungeonCombatRound` du Core 3.03 |

Les deux moteurs **ancien tour 156** et **timeline 3.03** ne restent donc pas simultanément propriétaires de `dungeonRunAi156`/`dungeonAdvanceTurn156` *après amorçage*. En revanche, leurs implémentations historiques sont toujours chargées et exécutent du code d'initialisation avant d'être neutralisées. **Ne pas déduire qu'elles peuvent toutes être supprimées sans effet** : elles peuvent créer des écouteurs, enregistrer des états, être capturées dans des fermetures ou être appelées avant le dernier script.

## Interprétation architecturale, avec risques

1. **Combat :** la couche **Core 3.03** est l'API finale du rendu/tour, mais s'appuie sur les fonctions **Core 2.14** et sur l'extension de boutons d'objet **Core 3.16**. Cette délégation est identifiée : ce n'est pas, dans le parcours de chargement testé, trois boucles d'IA actives. Il reste à vérifier **la partie réelle** : composition d'équipes, attaque et animation, affichage du résultat, progression du tour, ennemi IA, KO, sauvegarde/reprise, fermeture de fenêtres. Aucune de ces actions n'est simulée par la présente sentinelle.
2. **Carte :** `dungeonMapHtml` voit une succession de **7 fonctions complètes** sans chaînage ancien rendu → nouveau, avant Core 0.80. Ce point est un **bon candidat de consolidation soustractive** après validation du vrai parcours d'exploration, des murs, objets, portes, évènements et états de partie. L'affichage 2×2 artificiel ne démontre pas la possibilité de supprimer les six sources antérieures : elles ont pu contribuer à des initialisations ou à des captures de références.
3. **Risque de nommage / autorité :** les commentaires historiques « core », « fix », « single authority », « final » ne sont pas des preuves suffisantes. Il faut comparer **l'identité runtime**, les contrats, les scripts externes et les effets au démarrage. Le rôle de ce rapport est d'empêcher une fusion de couches par renommage, un masquage CSS ou un nouveau wrapper supérieur.
4. **Limites** : la sonde observe la page au chargement sur Chromium/Firefox et huit API précisément choisies. Elle ne prouve pas le fonctionnement de l'IA **dans un combat réel**, ne couvre pas les assignations dynamiques plus tardives, tous les 38 noms du recensement ni le rendu tactile mobile. Elle n'est pas une validation métier de tous les modes.

## Décision avant tout nouveau lot de code

**Ne pas supprimer automatiquement les anciens scripts.** D'abord construire une sentinelle **sur un scénario réel Dungeon** (profil créé/chargé depuis l'application, génération de carte, interaction et combat, animation d'un tour IA, reprise), en capturant les fonctions propriétaires à chaque étape sans créer de seconde autorité. Ensuite isoler **un lot substantiel** de consolidation par propriétaire (carte Dungeon ou compatibilité ancienne timeline) avec son nouveau START §25, source exacte §26, rollback bit-identique et les tests Chromium/Firefox/Tactical + autres modes sur **un même SHA**. Une suppression de wrappers sans ce contrat viole §§3, 14, 17, 21 de la charte.

**Invariants de livraison :** aucune ligne de `index.html` modifiée, aucun asset/engine/PWA modifié, `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`, laboratoires et 32 images historiques Survie intouchés ; aucune publication.
