# GenSrpG — Phase 4 — Audit final du resolver d’assets

Date : 2026-09-19

Branche :
`work/gensrpg-phase4-asset-resolver-final-audit-2026-09-19`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-asset-resolver-final-audit-2026-09-19`

Base :
`c050f4516b6c3f312047929495e5e6f270139545`
(`checkpoint/gensrpg-phase4-asset-resolver-item-paths-green-2026-09-19`)

Blob exact `index.html` audité :
`388d1b49adbe5d9ac80a4b5474f51b0b2b0b7fc9`.

## Déjà centralisé

Le service `assets/gensrpg/core/asset-resolver-v1.js` possède désormais :
- racine Dungeon canonique ;
- créatures `dng_*` ;
- héros built-in Aldren / Lyra / Brom ;
- objets built-in ;
- priorité d’override conservée par les consommateurs.

Les blocs historiques V164/V165/V166, le helper héros principal et `dungeonItems()` délèguent au Core.

## Duplications de resolver encore actives

### B.5 — tokens tardifs héros / ennemis

Trois couches Dungeon actives reconstruisent encore la table Aldren/Lyra/Brom :
- `dungeonCore213Stability.heroImg()` ;
- `dungeonCore214SingleAuthority.heroArt()` ;
- `dungeonCore310PersistenceAndTokens.heroArt()`.

Deux couches gardent encore un fallback direct `ROOT + enemyId + ".png"` :
- `dungeonCore309VisualFixes.enemyArt()` ;
- `dungeonCore310PersistenceAndTokens.enemyArt()`.

Ces chemins représentent les mêmes entités déjà couvertes par `GensAssetResolverV1.dungeonHeroPath()` et `dungeonCreaturePath()`. Ils doivent donc déléguer au Core dans un sous-lot homogène, sans toucher aux règles de tokens, positions, persistance ou combat.

### B.6 — loot logique Dungeon

`dungeonCore023StabilityFix` possède encore la table logique :
- `dloot_old_coin` ;
- `dloot_silver_idol` ;
- `dloot_beast_fang` ;
- `dloot_runic_shard` ;
- `dloot_black_pearl` ;
- `dloot_dragon_scale` ;
- `dloot_royal_relic` ;
- `dloot_void_gem`.

C’est une vraie résolution ID logique -> fichier physique. Elle doit rejoindre le resolver Core dans un sous-lot séparé, avec parité navigateur et sans modifier loot/drop/gameplay.

## Ce qui reste légitimement Dungeon

Le bloc `dungeonCore055ExactAssets` n’est pas un second resolver d’entités. Il choisit des assets de présentation exacts du Dungeon :
- marqueurs entrée/sortie ;
- sols/murs ;
- coffre selon rareté ;
- pièges ;
- escaliers ;
- icônes de scène.

Il ne contient pas de mapping de héros, objets, ennemis ou loots logiques. Le déplacer maintenant ferait du Core partagé le propriétaire de détails de présentation Dungeon, contraire à la frontière de modules.

Même règle pour les couches de sols/portes/map : leurs chemins physiques restent une dette de découpage/asset layout du module Dungeon, pas une raison pour élargir le resolver commun avec de la sémantique UI.

## Décision

Le premier service Phase 4 « resolver d’assets » n’est pas encore clôturable.

Ordre minimal restant :
1. B.5 — supprimer les duplications de chemins héros/ennemis dans les couches de tokens tardives ;
2. B.6 — extraire le mapping logique des loots `dloot_*` vers le Core ;
3. audit final de non-duplication ;
4. checkpoint de clôture du resolver ;
5. passer ensuite au service Phase 4 suivant : **stockage / migrations**.

Aucun déplacement physique d’asset n’est effectué dans ce lot.
