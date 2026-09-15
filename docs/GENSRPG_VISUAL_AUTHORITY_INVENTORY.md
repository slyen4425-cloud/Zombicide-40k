# GenSrpG — Inventaire autorité visuelle Tactical

Date : 2026-09-15
Base : checkpoint `gensrpg-single-detection-authority-final-green-2026-09-15`

## Objectif

Étape 4 de la restructuration : converger vers **un seul propriétaire du rendu des murs** sans modifier le gameplay, les collisions, la portée, le LOS, les participants ou les règles de dégâts.

## Autorité canonique conservée

`assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js`

Cette couche possède le pipeline complet :

- `WALL_ASSET = assets/dungeon/creatures/dng_wall_block.jpg` ;
- `wallTileHtml()` : émet l'image du mur directement dans la case Tactical ;
- `ensureWallTile()` : rend idempotente la présence d'une seule tuile murale ;
- `renderGrid()` : utilise `wallTileHtml()` pour les cases `blocked` ;
- `patchDungeonMapHtml()` : injecte la tuile murale dans les murs du plateau Dungeon ;
- `paintLiveWalls()` : raccorde les murs déjà présents dans le DOM ;
- `hookDungeonRender()` : raccorde le rendu Dungeon ;
- `installGlobalPolish()` : installe ce pipeline sans MutationObserver global.

Le renderer Tactical UI de base est maintenant l'unique autorité visuelle active des murs.

## Dette murale historique

Les fonctions historiques restent disponibles pour comparaison/rollback, mais leurs appels actifs et leurs règles CSS murales ont été retirés.

| Couche | JS mural actif | CSS mural historique | Responsabilités conservées |
|---|---|---|---|
| V108 | **retiré** | **retiré** | cadrage pions, panneau actions, équipement, rechargement, consommables |
| V109 | **retiré** | **retiré** | timeline, portée, mains nues, attaque rapide |
| V111 | **retiré** | **retiré** | multi-dés, dock, reconstruction des attaques, onglets runtime, maintenance UI |
| V112 | **retiré** | **retiré** | détails, explications de dégâts, spatial, styles de fiche/dock |
| V113 | **retiré** | **retiré** | scope, détection et présentation D100 |

## Retrait JavaScript — terminé

1. ✅ V113 `paintWalls` retiré de l'exécution active ;
2. ✅ V112 `markWallCells` retiré de `maintain()` ;
3. ✅ V111 `paintWalls` retiré de `maintain()` ;
4. ✅ V109 `paintBuilderWalls` retiré de `enhance()` et hook Dungeon mural retiré de `install()` ;
5. ✅ V108 `paintWalls` / patch / hook mural retirés du chemin actif ;
6. 🔒 verrou global : le pipeline JS actif des murs appartient uniquement à `GensRpgTacticalCombatV2Ui`.

Checkpoint : `checkpoint/gensrpg-single-js-wall-authority-green-2026-09-15`.

## Retrait CSS — terminé

La dette CSS a d'abord été caractérisée sur :

`checkpoint/gensrpg-wall-css-debt-characterized-green-2026-09-15`

Puis retirée une couche à la fois :

1. ✅ V113 : règles murales retirées de `ensureStyle()` ; styles D100 conservés ;
2. ✅ V112 : règles murales retirées de `ensureStyle()` ; fiche, explications, dock et responsive conservés ;
3. ✅ V111 : règle murale retirée de `ensureStyle()` ; multi-dés, dock, boutons et responsive conservés ;
4. ✅ V109 : règle murale retirée de `ensureStyle()` ; timeline, portée, mains nues, attaque rapide et responsive conservés ;
5. ✅ V108 : règle murale retirée de `ensureStyle()` ; cadrage des pions, panneau actions, équipement, rechargement, consommables et responsive conservés ;
6. 🔒 verrou final : aucune couche V108/V109/V111/V112/V113 ne peut reprendre de règle CSS murale ; seul `GensRpgTacticalCombatV2Ui` possède le rendu total.

Les checkpoints verts intermédiaires permettent de revenir séparément après chaque retrait CSS.

La sentinelle Chromium `gens_tactical_wall_browser_v11411.test.cjs` vérifie le vrai asset, son décodage, l'unicité des tuiles et le patch Dungeon après chaque retrait.

Aucun changement de texture, taille, collision ou gameplay n'a été mélangé à cette consolidation.
