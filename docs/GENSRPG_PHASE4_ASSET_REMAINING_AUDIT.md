# GenSrpG — Phase 4 — Audit du resolver d’assets restant — 2026-09-19

## Base auditée

Checkpoint :
`checkpoint/gensrpg-phase4-asset-resolver-item-paths-green-2026-09-19`

SHA :
`c050f4516b6c3f312047929495e5e6f270139545`

`index.html` exact :
- taille : 8 175 046 octets ;
- blob : `388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9`.

Aucun changement runtime n’est autorisé dans ce lot d’audit.

## Déjà raccordé au Core

Le service `assets/gensrpg/core/asset-resolver-v1.js` est chargé avant le gros propriétaire historique héros/objets.

Déjà migré et GREEN :
- chemins génériques créatures des blocs 164/165/166 ;
- helper historique héros `dungeonBuiltinHeroGithubArt168()` ;
- objets built-in de `dungeonItems()`.

Le Core possède actuellement :
- `dungeonCreaturePath(id)` ;
- `dungeonHeroPath(id)` ;
- `dungeonItemPath(id)` ;
- `ROOTS.dungeon.creatures`.

## Constructions de chemins Dungeon encore actives dans index.html

L’inventaire du blob exact montre encore des constructions JS dans plusieurs couches :

- `gensDungeonCore01Js` : assets de passages / escaliers ;
- `dungeonCore023StabilityFix` : images de loot ;
- `dungeonCore052SpecialExploration` : passages/coffres/pièges/escaliers ;
- `dungeonCore053Stability` : fallbacks de carte ;
- `dungeonCore054MapAndStart` : assets mini-carte ;
- `dungeonCore055ExactAssets` : assets UI exacts ;
- `dungeonCore078FloorSets` : sols dynamiques ;
- `dungeonCore079MapPolish` : sols/couverts ;
- `dungeonCore080FinalMapRenderer` : sols/porte/coffre ;
- `dungeonCore200Rebuild` : visuel de coffre de scène ;
- `dungeonCore213Stability` : fallback héros Aldren/Lyra/Brom ;
- `dungeonCore214SingleAuthority` : fallback héros Aldren/Lyra/Brom ;
- `dungeonCore309VisualFixes` : fallback image ennemi ;
- `dungeonCore310PersistenceAndTokens` : fallback héros Aldren/Lyra/Brom + fallback ennemi.

Les URLs statiques CSS de sols/murs ne sont pas une fonction de résolution JS. Elles restent hors extraction Core Phase 4 ; leur réorganisation physique appartient à la Phase 11.

## Autorité finale des pions

### Core 2.13

`dungeonCore213Stability` peint `.dc213HeroToken`.

Son `heroImg(id)` :
1. respecte `CHARS[id].image || avatar` ;
2. sinon possède sa propre table Aldren/Lyra/Brom ;
3. concatène directement `assets/dungeon/creatures/`.

### Core 2.14

`dungeonCore214SingleAuthority` retire les tokens 2.13 puis peint `.dc214Hero`.

Son `heroArt(id)` reproduit la même règle et la même table locale.

### Core 3.09

`dungeonCore309VisualFixes` décore les `.dc214Enemy` avec une image ennemi.
Il n’est pas le dernier propriétaire de pions car Core 3.10 est chargé ensuite.

### Core 3.10

`dungeonCore310PersistenceAndTokens` retire explicitement :
- `.dc213HeroToken` / `.dc213EnemyToken` ;
- `.dc214Hero` / `.dc214Enemy` ;
- ainsi que les anciens tokens 2.09/2.11/2.12.

Puis il peint :
- `.dc310Hero` ;
- `.dc310Enemy`.

Il constitue donc la dernière autorité de repaint des pions dans la composition actuelle.

Son `heroArt(id)` conserve encore la même table Aldren/Lyra/Brom locale après `image || avatar`.

Son `enemyArt(e)` délègue déjà d’abord à `gensDungeonCreatureArt165()`, puis possède un fallback historique direct. Ce fallback doit être caractérisé séparément avant modification car ses sémantiques pour les IDs non `dng_*` ne doivent pas changer accidentellement.

## Prochain sous-lot recommandé

Sous-lot homogène : **consommateurs de portrait héros des pions Dungeon**.

Périmètre :
- `dungeonCore213Stability.heroImg()` ;
- `dungeonCore214SingleAuthority.heroArt()` ;
- `dungeonCore310PersistenceAndTokens.heroArt()`.

Correction attendue :
- conserver `image || avatar` comme priorité ;
- déléguer uniquement le fallback built-in à `GensAssetResolverV1.dungeonHeroPath(id)` ;
- supprimer les trois tables locales Aldren/Lyra/Brom ;
- aucune modification de position, déplacement, persistance, combat ou peinture de pions.

À ne pas mélanger :
- ennemi 3.09/3.10 ;
- coffres / sols / portes ;
- loot ;
- bloc 65 ;
- déplacement physique d’assets.

## Ordre après ce sous-lot

1. caractériser précisément les fallbacks ennemis 3.09/3.10 et les overrides/custom IDs ;
2. caractériser l’autorité finale des chemins de coffres/portes/sols avant de toucher 052–080/200 ;
3. traiter le loot séparément si sa table reste une vraie résolution dupliquée ;
4. laisser les URLs CSS statiques et tout déplacement physique à la Phase 11.

## Invariants

- aucun fallback inter-module ;
- aucun déplacement de fichier visuel en Phase 4 ;
- aucune nouvelle couche de compatibilité ;
- aucun observer/timer/retry ajouté ;
- aucun changement gameplay ;
- un seul propriétaire Core du chemin canonique, les modules restant propriétaires du choix fonctionnel de l’asset.
