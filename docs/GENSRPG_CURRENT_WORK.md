# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 3 : fallback Core 0.53

- Branche : `work/gensrpg-combat-callsite-migration-3-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-3-2026-09-16`
- Base exacte : `b77225582f9b854b2b0e658029ebb783fc31aab7`
- Checkpoint vert précédent : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié.

## Cartographie avant modification

Après les lots 1 et 2, `openDungeonCombatSetup` reste présent 13 fois dans le monolithe. Ces références ne sont pas homogènes :

- 1 définition native historique ;
- 1 redéfinition `gensrpgDungeonFlowFix171` ;
- 4 occurrences dans les anciennes entrées Core 0.30 / 0.34 ;
- 3 occurrences dans le wrapper du module « Combat direct des héros » Core 0.45 ;
- 2 occurrences dans le fallback du bouton principal Core 0.53 ;
- 2 occurrences dans le fallback d'embuscade Core 0.76.

Le Bridge couvre le scope V113, participants, ennemis et raisons de détection, mais ne remplace pas à lui seul toutes les gardes historiques de module/mouvement. Il est donc interdit dans ce lot de migrer `dc030EngageCombat`, l'embuscade ou le wrapper Core 0.45.

## Périmètre strict du lot 3

Modifier uniquement le fallback exceptionnel de `dungeonCore053Stability` :

Chemin normal conservé :

`dc01Explore -> dc030EngageCombat()`

Chemin de secours actuel :

`else if(typeof openDungeonCombatSetup==="function") openDungeonCombatSetup()`

Cible :

`else if(typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat==="function") window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{reason:"manual-setup",entry:"dc053MainActionFallback"})`

Le fallback ne doit s'exécuter que lorsque `dc030EngageCombat` est absent. Le chemin normal et ses wrappers de mouvement restent inchangés.

## Gardes déjà présentes avant le fallback

Core 0.53 vérifie déjà avant le clic :

- `combatOn53()` -> `dc045HeroCombatEnabled()` : module « Combat direct des héros » ;
- `coreCanAct53()` : appareil/héros autorisé pour le tour courant ;
- présence d'ennemis vivants.

Ces gardes doivent rester textuellement présentes et dans le même ordre logique.

## Hors périmètre

Ne pas toucher à :

- `dc030EngageCombat` et ses wrappers Core 0.34 / 0.45 / 0.91 / 0.98 ;
- `dc076StartAmbushCombat` et l'embuscade ;
- la définition native ou la redéfinition FlowFix de `openDungeonCombatSetup` ;
- `dc200StartCombat`, `startCombat`, `launchCombat200` ;
- V112/V113 ;
- participants, enemyIds, détection, mouvement, mode MJ ;
- stats, XP, récompenses, loot ;
- navigation, fiche héros, Save & Quit ;
- cache/PWA ;
- Survival, Capture, PvP, World Builder.

## Inventaire attendu

Avant lot 3 :

- `dc200StartCombat` : 13 ;
- `openDungeonCombatSetup` : 13 ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Le fallback Core 0.53 contient deux occurrences textuelles de `openDungeonCombatSetup` (`typeof` + appel).

Après lot 3 :

- `dc200StartCombat` : 13 — inchangé ;
- `openDungeonCombatSetup` : 11 ;
- `launchCombat200` : 2 — inchangé ;
- `startCombat` : 6 — inchangé.

## Tests exigés avant correction puis checkpoint vert

1. poser un test rouge ciblé sur le vrai script `#dungeonCore053Stability` ;
2. vérifier que le chemin normal `dc030EngageCombat()` reste prioritaire ;
3. vérifier que `combatOn53()` et `coreCanAct53()` restent en place ;
4. vérifier que le fallback passe directement par `GensRpgTacticalCombatV2Bridge.requestCombat` avec `reason: "manual-setup"` et `entry: "dc053MainActionFallback"` ;
5. vérifier qu'aucune référence `openDungeonCombatSetup` ne reste dans Core 0.53 ;
6. inventaire exact `13 / 11 / 2 / 6` ;
7. Bridge/V113/architecture verts ;
8. Chromium/preview et Firefox verts ;
9. comparaison complète avec le checkpoint de départ avant checkpoint vert.

## Jalon vert précédent — lot 2

Checkpoint : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16`
SHA : `b77225582f9b854b2b0e658029ebb783fc31aab7`

Le script désactivé `#dungeonCore099FinalTacticalAuthority` a été retiré sans toucher au CSS voisin. Inventaire après lot 2 : `dc200StartCombat=13`, `openDungeonCombatSetup=13`, `launchCombat200=2`, `startCombat=6`. Architecture, Chromium et Firefox verts.

## Jalons antérieurs

- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. checkpoint de départ avant le premier changement ;
3. branche créée depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant le chantier suivant.
