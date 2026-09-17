# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier terminé — fiche héros : flash/disparition des Talents

- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Base exacte / checkpoint vert combat 4F : `96043b4b04a069fc571aca38634df221341bb411`
- Checkpoint vert de base : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17`
- Checkpoint de départ : `checkpoint/gensrpg-start-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Checkpoint pré-correction : `checkpoint/gensrpg-pre-talent-owner-fix-2026-09-17` — `46ad1b99b6c4c5ae6e16dd2bfc198e1f7a37a150`
- Checkpoint vert de clôture prévu : `checkpoint/gensrpg-hero-sheet-talent-flash-green-2026-09-17` sur le HEAD final validé de ce lot.
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` n'a pas été modifiée pendant ce lot.

## Résultat

Le flash Talent était un conflit d'autorité visuelle dans la fiche héros native :

1. `renderDungeonSkillTree()` rendait le contenu Talent mais forçait aussi `#dungeonSkillTreePanel` en `display:block` en mode Dungeon ;
2. `applyDungeonSheetTabs()` est le propriétaire natif de la visibilité des sections de fiche et remasquait ensuite cette section sur l'onglet `character`.

La caractérisation sur les deux fonctions réelles extraites de `index.html` a reproduit exactement le conflit : `none -> block -> none`, puis `block` sur l'onglet Compétences. Run rouge de référence : `35233601877`.

Correction runtime : commit `7bfba34a0efd4568873d6903d8d25e5fb07aedef` (`fix: leave Talent visibility to hero sheet tabs`). La correction est strictement soustractive : `renderDungeonSkillTree()` ne récupère plus `#dungeonSkillTreePanel` et n'écrit plus son `display`. Le rendu Talent et la gestion de `#zombicideSkillPanel` restent inchangés ; `applyDungeonSheetTabs()` reste seul propriétaire de la visibilité de la section Talent.

Après correction, la trace est `none -> none -> none`, puis `block` uniquement sur l'onglet Compétences. Run de correction vert : `35235794216`.

## Régression conservée

Test canonique : `tests/gens_hero_sheet_talent_flash_v11411.test.cjs`.

Il lit directement le `index.html` du checkout, extrait les fonctions natives `renderDungeonSkillTree()` et `applyDungeonSheetTabs()`, et vérifie :

- aucun flash du panneau Talent sur l'onglet Personnage ;
- le panneau reste masqué lorsque `character` possède la fiche ;
- le panneau reste visible sur l'onglet Compétences ;
- aucun nouveau renderer Talent ni mécanisme de réparation n'est introduit.

La sentinelle dédiée `.github/workflows/gensrpg-hero-sheet-talent-flash.yml` est conservée en lecture seule.

## Systèmes protégés validés sans modification

Le run vert `35235794216` a également repassé :

- `tests/gens_v11411_native_ui_browser.test.cjs` ;
- `tests/gens_hero_sheet_art_runtime_v11411.test.cjs` ;
- `tests/gens_single_hero_sheet_art_authority_v11411.test.cjs` ;
- `tests/gens_manual_xp_progression_runtime_v1.test.cjs` ;
- `tests/gens_manual_xp_statpoints_characterization_v11411.test.cjs` ;
- `tests/gens_stats_editor_authority_characterization_v11411.test.cjs` ;
- `tests/gens_stats_editor_single_authority_v11411.test.cjs`.

Aucun changement runtime n'a été apporté à XP, progression, stats, portrait, combat Tactical, dock flottant, déplacement, sauvegarde ou navigation.

## Jalons verts précédents

- Combat lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.
- Fiche héros revue visuelle : `checkpoint/gensrpg-hero-sheet-visual-review-green-2026-09-16` — `0c396bf7c0879cfde9f0ffa7a6324eb4e9a11ffd`.
- Éditeur stats : `checkpoint/gensrpg-stats-editor-regression-green-2026-09-16` — `84344017659cc909ded580bc39d0c8d103deb5df`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, checkpoint avant changement, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.
