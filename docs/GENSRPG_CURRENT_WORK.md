# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier actif

- Chantier : latences runtime — XP manuel / popup de niveau + portrait héros transitoirement obsolète
- Branche de travail : `work/gensrpg-runtime-latency-xp-portrait-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-runtime-latency-xp-portrait-2026-09-16`
- Base exacte du chantier : `8d35fc5bbff9d30ee146d72c8ab7e34c68d16d90`
- Dernier checkpoint vert validé utilisateur : `checkpoint/gensrpg-wall-zoom-damage-display-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Retour manuel utilisateur au démarrage

Le checkpoint précédent est validé manuellement :

- murs : fonctionnement correct, y compris zoom ;
- XP/progression : fonctionnement correct ;
- affichage dégâts : fonctionnement correct.

Deux latences visibles restent à caractériser :

1. après attribution manuelle d'XP, le popup de gain de niveau apparaît avec un délai perceptible ;
2. au passage au tour de Lyra puis ouverture immédiate de sa fiche, le portrait d'Aldren peut rester affiché brièvement avant d'être remplacé par celui de Lyra.

## Périmètre

1. Mesurer et identifier la cause exacte de chaque latence avant correction.
2. Distinguer une latence propre à la preview/raw.githack d'une latence du runtime lui-même.
3. Pour l'XP manuel : conserver exactement les règles de progression et les seuils actuels ; ne modifier que le chemin de notification si nécessaire.
4. Pour le portrait : conserver l'autorité visuelle unique existante ; ne pas ajouter de polling, MutationObserver, timer de repaint ou seconde autorité d'image.
5. Ne pas modifier combat, stats, mouvement, navigation, sauvegarde, murs ou progression métier.

## Validation attendue

- attribution manuelle d'XP : popup de niveau déclenché dans le même cycle logique que la progression, sans attendre un refresh ultérieur ;
- changement de héros : la fiche ouverte immédiatement après le changement doit afficher le portrait du héros courant dès le premier rendu ;
- absence de régression sur fiche héros, Save & Quit, murs, combat et preview ;
- tests navigateur mobile si le problème est lié au rendu/ordonnancement.

## Règle permanente de continuité

À chaque nouveau chantier : checkpoint de départ AVANT le premier changement, branche dédiée depuis ce checkpoint, mise à jour de ce fichier, caractérisation avant correction, puis checkpoint vert sur le SHA exact validé.
