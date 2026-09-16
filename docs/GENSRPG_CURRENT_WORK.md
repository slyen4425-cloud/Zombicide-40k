# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 2 : retrait Core 0.99 désactivé

- Branche : `work/gensrpg-combat-callsite-migration-2-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-2-2026-09-16`
- Base exacte : `2aa6ba574923229af105cbee1635eeb9efab18cb`
- Checkpoint vert précédent : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié.

## Décision de périmètre

Le lot 2 retire uniquement le script historique désactivé :

`<script type="application/x-gensrpg-disabled" id="dungeonCore099FinalTacticalAuthority"> ... </script>`

Ce bloc n'est pas exécuté par le navigateur. Il contient pourtant encore de vieilles autorités : wrappers `DungeonCore01`, listener document capture, timer, fonctions `dc099*` et fallback vers `openDungeonCombatSetup()`.

La carte runtime active et les sentinelles modernes placent l'autorité combat sur :

`GensRpgTacticalCombatV2Bridge.requestCombat(...) -> V113 scope/participants -> Tactical V2`

Core 0.99 n'appartient pas à cette chaîne active. Conformément à la charte, une couche morte n'est pas modernisée : elle est retirée de façon soustractive après caractérisation.

## Ce qui reste volontairement hors périmètre

Le CSS historique voisin reste intact dans ce lot :

- `#dungeonCore099FinalTacticalCss` ;
- `#dungeonCore100UiCleanup` et sa référence `.dc099Reachable`.

Même s'il semble historique, son retrait serait un chantier visuel distinct. Il sera caractérisé séparément avant toute suppression.

Ne pas toucher non plus à :

- `dc030EngageCombat` et ses fallbacks actifs ;
- embuscades ;
- détection ;
- `dc200StartCombat`, `startCombat`, `launchCombat200` ;
- adaptateurs de compatibilité Bridge ;
- V112/V113 ;
- mode MJ ;
- participants / enemyIds / reasons ;
- stats, XP, récompenses, loot ;
- déplacement, navigation, fiche héros, Save & Quit ;
- cache/PWA ;
- Survival, Capture, PvP, World Builder.

## Effet attendu sur l'inventaire

Avant lot 2 :

- `dc200StartCombat` : 13 ;
- `openDungeonCombatSetup` : 15 ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Le bloc Core 0.99 contient exactement une référence à `openDungeonCombatSetup`.

Après retrait :

- `dc200StartCombat` : 13 — inchangé ;
- `openDungeonCombatSetup` : 14 ;
- `launchCombat200` : 2 — inchangé ;
- `startCombat` : 6 — inchangé.

## Tests exigés

Avant suppression, poser un test qui devient vert uniquement si :

1. `#dungeonCore099FinalTacticalAuthority` a disparu ;
2. `window.dc099EngageCombat`, `window.dc099Paint` et `window.dc099SyncMainAction` ont disparu avec ce bloc ;
3. `#dungeonCore099FinalTacticalCss` reste présent ;
4. `#dungeonCore100UiCleanup` reste présent ;
5. le compteur `openDungeonCombatSetup` passe uniquement de 15 à 14 ;
6. les autres compteurs historiques sont inchangés ;
7. Bridge/V113 et les sentinelles architecture restent verts ;
8. Chromium et Firefox restent verts.

## Séquence

1. checkpoint de départ — fait ;
2. test rouge de retrait Core 0.99 ;
3. suppression exacte d'un seul bloc désactivé ;
4. mise à jour inventaire 15 -> 14 ;
5. raccord du test aux sentinelles ;
6. comparaison complète avec le checkpoint de départ ;
7. architecture + Chromium + Firefox ;
8. checkpoint vert ;
9. seulement ensuite caractériser le prochain groupe actif.

## Jalon vert précédent — lot UI manuel 1

Checkpoint : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16`
SHA : `2aa6ba574923229af105cbee1635eeb9efab18cb`

Deux boutons natifs ont été migrés vers `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` :

- `#dungeonCombatMenuBtn` ;
- `#dungeonCombatSheetBtn`.

Inventaire après lot 1 : `dc200StartCombat=13`, `openDungeonCombatSetup=15`, `launchCombat200=2`, `startCombat=6`.
Architecture, Chromium et Firefox verts. Aucun autre runtime gameplay modifié.

## Jalon XP + portrait

Checkpoint : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` sur `695be0e029fb49ee70966729474b35aa0a2d9c63`.
Validation utilisateur Firefox positive le 16/09/2026.

## Règle permanente de continuité

À chaque chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. checkpoint de départ avant le premier changement ;
3. branche créée depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant le chantier suivant.
