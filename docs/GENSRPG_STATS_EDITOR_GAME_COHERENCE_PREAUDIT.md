# GenSrpG — Pré-audit cohérence Stats éditeur -> jeu

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-stats-editor-game-coherence-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-stats-editor-game-coherence-preaudit-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-survival-hero-availability-green-2026-09-23` ;
- SHA de base :
  `80a17a4ea9c9fdb685c0a27ff7c926e854d55e94` ;
- runtime :
  taille `8171571`, blob `6e76a99af5fb839db5ffb20a2e67fd1572bf13ea` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime n'est modifié dans ce pré-audit.

## Signalement utilisateur

Dans le jeu :
- les valeurs affichées ne correspondent pas aux valeurs définies dans l'éditeur ;
- plusieurs valeurs différentes peuvent apparaître pour une même caractéristique dans le même onglet ;
- une confusion visuelle sur les Stats d'Aldren avait déjà été signalée précédemment.

## Chaîne actuelle à caractériser

1. valeur de définition héros : `hero.dungeonStats[id]` ;
2. valeur persistante de partie : `state.rpgAttributes[id]` ;
3. valeur canonique : `GensCleanRpgStats167874.value(hero,id)` ;
4. snapshot Core : `GensCleanRpgStats167874.coreSnapshot(hero)` ;
5. fiche en jeu :
   `GensHeroEditorDynamic167897.gameStatValues(def)` ;
6. rendu :
   valeur principale + ligne `Base héros ... · Total ...`.

Observation structurelle :
- la ligne `Base héros` lit la définition `dungeonStats` ;
- le `Total` lit l'API canonique ;
- l'API canonique privilégie `state.rpgAttributes` lorsqu'une valeur runtime existe.

Cette différence peut être légitime si elle représente une progression réelle,
mais elle devient une incohérence si un changement de valeur de base dans
l'éditeur laisse un ancien état runtime qui n'est plus aligné avec la définition.

## Questions du pré-audit

1. Lorsqu'une valeur héros est modifiée dans l'éditeur, quelle donnée doit être
   autoritaire pour une nouvelle partie ?
2. Un ancien `state.rpgAttributes` doit-il conserver uniquement les gains de
   progression, ou figer aussi l'ancienne valeur de base ?
3. La fiche affiche-t-elle plusieurs sources de vérité ou seulement base + total
   explicitement justifiés ?
4. Le Core Snapshot reçoit-il la même valeur canonique que la fiche ?
5. La sauvegarde d'un héros met-elle à jour la définition sans migrer
   correctement l'état runtime existant ?

## Procédure

1. caractériser les writers de `dungeonStats` et `rpgAttributes` ;
2. ajouter une sentinelle du vrai raccord éditeur -> sauvegarde -> runtime -> fiche ;
3. ne pas injecter directement la valeur attendue dans l'état runtime ;
4. si RED, identifier le premier writer/reader fautif ;
5. seulement ensuite ouvrir un lot correctif séparé.

## Interdictions

- aucun correctif runtime dans ce pré-audit ;
- aucun nouveau wrapper/observer/timer/retry ;
- aucun changement de formule de combat ;
- aucun changement progression/XP ;
- aucun changement Survie/Capture/Tactical/Builder ;
- aucun traitement détection/embuscade ;
- aucun merge sur `main`.


## Conclusion du pré-audit

SHA technique :
`f5ad07f5c0623bfab3ab6a2b17f8011fc603e9b6`.

Triple CI sur ce SHA :
- Architecture + navigateur complet `35858550651` — SUCCESS ;
- Firefox `35858550682` — SUCCESS ;
- Tactical Dock `35858550671` — SUCCESS.

La sentinelle confirme la coexistence de deux niveaux de données :
- définition héros : `dungeonStats` ;
- état de partie persistant : `rpgAttributes`.

Le Core et le Snapshot privilégient l'état runtime lorsqu'il existe.
Ce comportement peut produire une différence visible entre « Base héros » et
« Total », mais aucun défaut moteur n'est démontré par les tests actuels.

Retour manuel utilisateur :
- fonctionnement global revenu dans l'ordre ;
- quelques petits défauts de rafraîchissement peuvent momentanément faire croire
  à une incohérence de Stats ;
- ces défauts visuels sont différés ;
- aucune correction runtime n'est justifiée dans ce lot.

Décision :
- clôture GREEN du pré-audit ;
- aucune modification Stats ;
- conserver une dette UI/rafraîchissement séparée ;
- reprendre la roadmap Phase 5.

Checkpoint cible :
`checkpoint/gensrpg-stats-editor-game-coherence-preaudit-green-2026-09-23`.
