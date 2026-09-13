# GenSrpG — Combat RPG tactique V2

Base de travail : `stable/v16.78.102.2-best-stable-2026-09-13` (`6a2092a2f2ba9b16ec36c441995f39cbf2d07a24`).

## Principe

Le nouveau combat RPG est construit comme un moteur séparé. Il ne réutilise pas la timeline historique, ses watchdogs, ses chaînes de wrappers de rendu ni ses temporisations. L'ancien combat reste intact comme solution de secours tant que le V2 n'est pas validé sur téléphone.

Le moteur de combat V2 ne manipule pendant un tour que son petit état local : grille, positions, PV, mouvement restant, action restante, initiative, attaques et effets de combat. Les données GenSrpG existantes seront lues une fois au début du combat puis réécrites une fois à la fin ou lors d'une sauvegarde explicite.

## Règles de la fondation 0.1

- Grille rectangulaire 4 à 40 cases par axe.
- Cases bloquées et occupation exclusive des cases.
- Déplacement orthogonal et pathfinding déterministe.
- Budget de mouvement par acteur.
- Initiative déterministe et passage de tour sans timer.
- Portée minimale et maximale par attaque.
- Ligne de vue réelle : un mur bloque un tir.
- Une créature située sur la ligne de tir donne une couverture partielle.
- Défense, esquive et couverture réduisent la probabilité de toucher.
- Armure réduit les dégâts physiques sauf attaque `ignoreArmor`.
- IA minimale : attaque si possible, sinon avance par le meilleur chemin puis attaque si elle arrive à portée.
- Victoire/défaite calculée uniquement depuis les acteurs vivants du combat.

## Architecture cible

1. **Engine** — pur calcul, aucun DOM, aucun `localStorage`, aucun `setTimeout`.
2. **Adapter GenSrpG** — capture héros, équipements, compétences, ennemis, PV et stats au démarrage ; applique le résultat au runtime à la fin.
3. **Battlefield UI** — grille tactile dédiée, pions, surbrillance des cases, portée, ligne de vue, couverture et timeline visuelle.
4. **AI** — déplacement tactique, préférence de portée, couverture, focus et compétences.
5. **Bridge exploration** — la détection reste sur la grille Dungeon ; quand une rencontre démarre, la salle devient un champ de bataille V2 puis revient en exploration après victoire/fuite.

## Contraintes de migration

- Ne pas supprimer l'ancien combat avant validation complète du V2.
- Ne pas modifier la branche stable V16.78.102.2.
- Les caractéristiques dynamiques, dont les statistiques créées par l'utilisateur, restent la source de données du personnage ; elles sont seulement snapshotées à l'entrée du combat.
- Les armes gardent leur identité et leur portée devient une distance tactique en cases.
- Les tests du runtime Dungeon, des stats canoniques, des équipements et de la V16.78.102.2 doivent rester verts pendant toute la refonte.

## Prochain jalon

Rendre le moteur visible : adaptateur de données GenSrpG + première grille tactile de combat V2 avec héros/ennemis réels, déplacement, sélection d'une cible et attaque à portée. Aucune interception automatique de l'ancien combat avant validation de cette grille en mode expérimental.
