# GenSrpG — Inventaire autorité visuelle Tactical

Date : 2026-09-15
Base : checkpoint `gensrpg-single-detection-authority-final-green-2026-09-15`

## Objectif

Étape 4 de la restructuration : converger vers **un seul propriétaire du rendu des murs** sans modifier le gameplay, les collisions, la portée, le LOS, les participants ou les règles de dégâts.

## Autorité canonique à conserver

`assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js`

Cette couche possède déjà le pipeline complet :

- `WALL_ASSET = assets/dungeon/creatures/dng_wall_block.jpg` ;
- `wallTileHtml()` : émet l'image du mur directement dans la case Tactical ;
- `ensureWallTile()` : rend idempotente la présence d'une seule tuile murale ;
- `renderGrid()` : utilise `wallTileHtml()` pour les cases `blocked` ;
- `patchDungeonMapHtml()` : injecte la tuile murale dans les murs du plateau Dungeon ;
- `paintLiveWalls()` : raccorde les murs déjà présents dans le DOM ;
- `hookDungeonRender()` : raccorde le rendu Dungeon ;
- `installGlobalPolish()` : installe ce pipeline sans MutationObserver global.

C'est donc le renderer Tactical UI de base qui doit devenir l'unique autorité visuelle des murs.

## Dette encore active au début de cette étape

Les fonctions historiques restent utiles pour comparaison/rollback, mais leurs appels actifs doivent disparaître progressivement.

| Couche | Autorité murale encore active | Cible |
|---|---|---|
| V108 | `patchDungeonMapHtml`, `hookDungeonRender`, `paintWalls` | retirer du `install()` après validation |
| V109 | `hookDungeonRender`, `enhance()` → `paintBuilderWalls` | retirer uniquement le repaint mural, conserver timeline/portée/mains nues/attaque rapide |
| V111 | `maintain()` → `paintWalls` | retirer uniquement le repaint mural, conserver multi-dés/dock/refresh |
| V112 | `maintain()` → `markWallCells` | retirer uniquement le repaint mural, conserver détails/explications/spatial |
| V113 | `install()` → `paintWalls` | retirer le repaint final historique, conserver scope/détection V113 |

## Ordre de retrait

1. V113 `paintWalls` : couche finale redondante, renderer canonique chargé juste après la chaîne d'intégration ;
2. V112 `markWallCells` ;
3. V111 `paintWalls` ;
4. V109 `paintBuilderWalls` et hook Dungeon mural ;
5. V108 `paintWalls` / patch/hook mural historiques ;
6. verrou global : aucun repaint historique actif, seul `GensRpgTacticalCombatV2Ui` possède les murs.

Chaque retrait doit :

1. conserver les fonctions historiques exportées tant que le chantier n'est pas clos ;
2. modifier une seule autorité active à la fois ;
3. passer les tests historiques, architecture et Chromium ;
4. créer un checkpoint vert avant le retrait suivant.

Aucun changement de texture, taille, collision ou gameplay ne doit être mélangé à cette consolidation.
