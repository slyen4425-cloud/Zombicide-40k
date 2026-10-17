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

## Mise au point de propriétaire après premier test utilisateur (17 octobre 2026)

La règle d'unicité ci-dessus était trop large en confondant les **murs de l'arène Tactical** et les **terrains de la salle Dungeon**. Ce sont deux vues distinctes d'une même scène, pas deux écrivains autorisés sur les mêmes cases.

- **Dungeon généré** : `applyDungeonMapPolish079()` est la seule fonction qui choisit la texture de la salle selon biome, salle et case. `DungeonSourceRenderStability167877` l'invoque après chaque `DungeonCore01.render/show` sans écrire une texture concurrente, uniquement dans les pièces non-authored.
- **Dungeon authored** : `DungeonSourceRenderStability167877` conserve le rendu exact depuis le World Builder, sans réécriture par Tactical.
- **Tactical** : `GensRpgTacticalCombatV2Ui` reste propriétaire de ses cases et de son fallback mur JPEG / zoom Firefox, mais **ne patche plus `dungeonMapHtml` ni les murs `#dc047RoomBoard` à l'installation**. Quand la salle existe déjà, l'adaptateur y lit une seule fois les fonds affichés pour les présenter dans Tactical ; il ne change pas la salle ni la collision.
- **V108/V109/V111/V112/V113** : propriétaires historiques des autres contrôles, aucun nouveau peintre de mur natif.
- Les anciens points historiques ci-dessus décrivent le checkpoint du 15 septembre, non le propriétaire effectif depuis cette correction. Tests de séparation : `gens_tactical_visual_authority_characterization_v11411.test.cjs`, `gens_tactical_wall_zoom_firefox_v11411.test.cjs`, `gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs`.

**V114.5 et V114.11 retirés du chemin actif (17/10/2026)** : `GensRpgTacticalWallDiceStats16781145.maintain()` ne patche plus `dungeonMapHtml` et ne réécrit plus les murs natifs ; son `ensureStyle()` n'ajoute que le style des dés. `GensRpgTacticalVisualDice16781142.install()` ne sollicite plus le patch visuel du plateau Dungeon. Les deux modules conservent leurs moteurs de dés et liens de statistiques. L'autorité native est Dungeon 0.79 / 167877 ; l'arène Tactical conserve son fallback mur, et la continuité d'apparence est une **lecture** depuis le plateau d'origine, non une autorité concurrente.
