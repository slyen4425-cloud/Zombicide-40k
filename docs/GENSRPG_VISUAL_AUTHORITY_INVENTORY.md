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

## Dette murale historique

Les fonctions historiques restent utiles pour comparaison/rollback, mais leurs appels actifs ont été retirés progressivement.

| Couche | État | Autorité murale | Responsabilités conservées |
|---|---|---|---|
| V108 | **retirée** | fonctions `paintWalls`, `patchDungeonMapHtml` et `hookDungeonRender` conservées mais plus appelées par `install()` ; `hookUiRender()` ne repeint plus les murs | cadrage pions, panneau actions, équipement, rechargement, consommables |
| V109 | **retirée** | fonctions `paintBuilderWalls` et `hookDungeonRender` conservées mais plus appelées par `enhance()`/`install()` | timeline, portée, mains nues, attaque rapide |
| V111 | **retirée** | fonction `paintWalls` conservée mais plus appelée par `maintain()` | multi-dés, dock, reconstruction des attaques, onglets runtime, maintenance UI |
| V112 | **retirée** | fonction `markWallCells` conservée mais plus appelée par `maintain()` ; son ancien hook de détection reste lui-même inactif | détails, explications de dégâts, spatial |
| V113 | **retirée** | fonction `paintWalls` conservée mais plus appelée par `install()` ni `maintain()` | scope et détection V113 |

## Ordre de retrait

1. ✅ V113 `paintWalls` retiré de l'exécution active ;
2. ✅ V112 `markWallCells` retiré de `maintain()` ;
3. ✅ V111 `paintWalls` retiré de `maintain()` ;
4. ✅ V109 `paintBuilderWalls` retiré de `enhance()` et hook Dungeon mural retiré de `install()` ;
5. ✅ V108 `paintWalls` / patch / hook mural retirés du chemin actif ;
6. 🔒 verrou global : le pipeline JS actif des murs appartient uniquement à `GensRpgTacticalCombatV2Ui`.

Chaque retrait doit :

1. conserver les fonctions historiques exportées tant que le chantier n'est pas clos ;
2. modifier une seule autorité active à la fois ;
3. passer les tests historiques, architecture et Chromium ;
4. créer un checkpoint vert avant le retrait suivant.

La sentinelle Chromium `gens_tactical_wall_browser_v11411.test.cjs` vérifie le vrai asset, son décodage, l'unicité des tuiles et le patch Dungeon avant/après chaque retrait.

### Point restant après le retrait JS

Les couches historiques contiennent encore certaines **règles CSS murales** dans leurs blocs `ensureStyle()`. Elles utilisent actuellement le même asset canonique et ne sont plus accompagnées de repaint JS, mais elles constituent encore une autorité visuelle résiduelle. Elles seront retirées séparément, module par module, avec la même discipline de checkpoint et Chromium. Le verrou final “un seul propriétaire total des murs” ne sera déclaré qu'après cette seconde passe CSS.

Aucun changement de texture, taille, collision ou gameplay ne doit être mélangé à cette consolidation.
