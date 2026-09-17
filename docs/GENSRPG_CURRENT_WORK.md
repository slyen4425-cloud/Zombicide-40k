# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — fiche héros : flash/disparition des Talents

- Branche : `work/gensrpg-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Base exacte / checkpoint vert combat 4F : `96043b4b04a069fc571aca38634df221341bb411`
- Checkpoint vert de base : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17`
- Checkpoint de départ de ce lot : `checkpoint/gensrpg-start-hero-sheet-talent-flash-diagnostic-2026-09-17`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant ce lot.

## Périmètre strict

Mission unique : diagnostiquer puis, uniquement si la cause est parfaitement identifiée dans la fiche héros, corriger le cas où les éléments liés aux Talents apparaissent brièvement puis disparaissent après ouverture de la fiche.

Protégés / hors périmètre : XP, progression, stats, portrait, combat Tactical, dock flottant, déplacement, sauvegarde et navigation. Aucun nouveau renderer Talent, MutationObserver global, timer/retry de réparation, wrapper d'autorité ou listener global n'est autorisé.

## Diagnostic en cours

Le propriétaire métier du contenu Talent est le renderer natif `renderDungeonSkillTree()` dans `index.html`. La visibilité des sections de fiche Dungeon est, elle, pilotée par le système natif d'onglets `applyDungeonSheetTabs()`.

Sur la base 4F, ces deux chemins écrivent actuellement le même `display` de `#dungeonSkillTreePanel` :

1. `renderDungeonSkillTree()` force le panneau visible en Dungeon ;
2. `applyDungeonSheetTabs()` le reclasse en section `dtab-skills` et le masque lorsque l'onglet courant est `character`.

Cet ordre est compatible avec le symptôme « visible brièvement puis disparaît ». La caractérisation navigateur doit être ajoutée et observée rouge avant toute correction runtime.

Les couches historiques de portrait vérifiées sont hors de la fiche ou inertes sur ce point. L'ancien chantier `work/dungeon-v16.78.98-stat-talent-cleanup` et le checkpoint `checkpoint/gensrpg-hero-sheet-visual-review-green-2026-09-16` ne contiennent pas de correction déjà prête pour ce conflit d'autorité Talent.

## Prochaine étape

1. Ajouter une sentinelle navigateur qui exécute les fonctions réelles extraites de `index.html` et prouve le flash sur l'onglet Personnage.
2. Faire constater le test rouge sur la branche.
3. Si la caractérisation confirme le conflit, appliquer une correction minimale et soustractive dans le propriétaire canonique, sans toucher aux systèmes protégés.
4. Repasser fiche héros + stats + portrait + XP et la batterie architecture/Chromium avant tout checkpoint vert.

## Jalons verts précédents

- Combat lot 4F : `checkpoint/gensrpg-combat-callsite-migration-4f-green-2026-09-17` — `96043b4b04a069fc571aca38634df221341bb411`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.
- Fiche héros revue visuelle : `checkpoint/gensrpg-hero-sheet-visual-review-green-2026-09-16` — `0c396bf7c0879cfde9f0ffa7a6324eb4e9a11ffd`.
- Éditeur stats : `checkpoint/gensrpg-stats-editor-regression-green-2026-09-16` — `84344017659cc909ded580bc39d0c8d103deb5df`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, checkpoint avant changement, branche dédiée, caractériser avant correction, checkpoint vert sur le SHA exact validé, puis mettre ce fichier à jour avant le chantier suivant.
