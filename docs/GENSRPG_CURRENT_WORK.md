# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier actif

- Chantier : murs blancs au zoom + cohérence visuelle de l'explication des dégâts
- Branche de travail : `work/gensrpg-wall-zoom-damage-display-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-wall-zoom-damage-display-2026-09-16`
- Base du chantier : `0c396bf7c0879cfde9f0ffa7a6324eb4e9a11ffd`
- Dernier checkpoint vert utilisateur avant ce chantier : `checkpoint/gensrpg-hero-sheet-visual-review-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Périmètre

1. Corriger uniquement l'explication visuelle des dégâts : le moteur de dégâts est déjà correct.
2. Reproduire puis corriger le mur blanc qui apparaît selon le zoom.
3. Conserver Tactical UI comme unique autorité de rendu des murs.
4. Ne pas ajouter de MutationObserver, heartbeat, repaint global ou nouvelle autorité murale.
5. Ne pas modifier les règles de gameplay, stats, progression, navigation ou sauvegarde.

## État au démarrage

- Dungeon testé manuellement : fluide et stable.
- Combat : calcul réel validé ; défaut d'affichage constaté sur `Puissance arme 3 + bonus stat 1 = 3 brut`, qui doit afficher 4 brut.
- Murs : texture présente mais peut devenir blanche à certains niveaux de zoom sur téléphone/Firefox.
- Le précédent test navigateur validait chargement/décodage du mur, mais pas les changements de zoom.

## Procédure de reprise

1. Lire `docs/GENSRPG_CHARTE.md`.
2. Lire ce fichier.
3. Vérifier la branche et le SHA avant toute modification.
4. Continuer par caractérisation/tests avant correction.
5. À la fin du jalon vert, créer `checkpoint/gensrpg-wall-zoom-damage-display-green-2026-09-16` (ou date réelle si différente), mettre ce fichier à jour et fournir un lien manuel de test si pertinent.

## Règle permanente de continuité

À chaque nouveau chantier : checkpoint de départ AVANT le premier changement, branche dédiée, mise à jour de ce fichier. À chaque jalon vert : checkpoint vert et mise à jour de ce fichier.
