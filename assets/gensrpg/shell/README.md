# GenSrpG Shell

Point d’entrée cible pour l’accueil, la navigation générale, la fiche personnage hors combat et l’état de session/module actif.

## Runtime bootstrap

`runtime-bootstrap.js` est désormais le propriétaire unique de la **composition du runtime navigateur** extraite du module de performance mobile.

Il possède uniquement :

- l’ordre déclaratif de chargement des services Core et des runtimes encore legacy ;
- l’installation finale des bridges temporaires encore nécessaires ;
- l’exposition d’un statut de bootstrap.

Il ne possède **aucune règle de gameplay**, aucun calcul de stats, aucun combat et aucune UI de module. Ces responsabilités restent à leurs propriétaires respectifs.

`gens-mobile-combat-performance-16781022.js` conserve temporairement un handoff unique vers ce bootstrap tant que `index.html` n’a pas encore été allégé. Il ne doit plus contenir la liste de composition Core/Tactical/Survival.

Les futures implémentations doivent respecter `docs/GENSRPG_CHARTE.md`, supprimer progressivement les retries historiques et laisser les règles privées à leur module propriétaire.
