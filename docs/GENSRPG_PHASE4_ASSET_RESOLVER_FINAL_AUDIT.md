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

## État après B.5

### B.5 — tokens tardifs héros / ennemis — RÉSOLU

Le sous-lot B.5 est raccordé au resolver central :
- Core 2.13 / 2.14 / 3.10 ne possèdent plus leur table Aldren/Lyra/Brom ;
- les chemins built-in héros passent par `GensAssetResolverV1.dungeonHeroPath()` ;
- Core 3.09 / 3.10 consultent `GensAssetResolverV1.dungeonCreaturePath()` pour les IDs Dungeon built-in ;
- la priorité des images/avatar personnalisés et définitions existantes est conservée ;
- les fallbacks legacy non-`dng_*` restent en dernier recours, hors responsabilité du catalogue built-in ;
- aucun gameplay/token layout/persistance n’a été déplacé.

Blob `index.html` après B.5 :
`207353f408d8c60213b512f73184bb9ec666b75d`.

### B.6 — loot logique Dungeon — RÉSOLU

Les 8 IDs `dloot_*` appartiennent désormais à `DUNGEON_ITEM_FILES` et sont résolus par `GensAssetResolverV1.dungeonItemPath()`.

Core 0.23 :
- ne possède plus `DC023_LOOT_ART` ;
- ne possède plus `DC023_ASSET_ROOT` ;
- conserve son rôle de décorateur/synchronisation loot ;
- conserve la priorité d’un `image_data` explicite ;
- ne modifie aucune règle de drop, rareté, prix ou économie.

Blob `index.html` après B.6 :
`ff11682d74be7921a591a9b76080eaf337c071be`.

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

Le premier service Phase 4 « resolver d’assets » est **clôturable**.

L’audit final ne trouve plus de duplication logique de résolution pour :
- créatures Dungeon ;
- héros built-in ;
- objets built-in ;
- tokens tardifs héros / ennemis ;
- loots `dloot_*`.

Les chemins UI/tuiles exacts du bloc 65 restent volontairement au module Dungeon : ils ne sont pas un resolver commun concurrent. Leur rangement physique appartient à la Phase 11.

Validation fonctionnelle finale B.6 :
- Architecture + navigateur complet `35461321604` — SUCCESS ;
- Firefox `35461321689` — SUCCESS ;
- Tactical Dock `35461321634` — SUCCESS.

Étape suivante après checkpoint documentaire : **Phase 4 / stockage et migrations**.

Aucun déplacement physique d’asset n’est effectué dans ce lot.
