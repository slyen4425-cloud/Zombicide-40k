# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 3 : retrait des dépendances actives à l'ancien setup Dungeon

- Branche : `work/gensrpg-combat-callsite-migration-3-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-3-2026-09-16`
- Base exacte : `b77225582f9b854b2b0e658029ebb783fc31aab7`
- Checkpoint vert précédent : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16`
- Commit runtime du retrait actif : `f3e8ebb9489520602b1f37ce64853750fde3e09e`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié.

## Résultat du lot 3

Le lot 3 a été réalisé progressivement, sans migration en masse.

### 1. Fallback Core 0.53

Le chemin normal du bouton principal reste `dc030EngageCombat()`.

Son ancien fallback vers `openDungeonCombatSetup()` a été remplacé par :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{reason:"manual-setup",entry:"dc053MainActionFallback"})`

Les gardes `combatOn53()` / `dc045HeroCombatEnabled()` et `coreCanAct53()` restent en amont.

### 2. Core 0.30

L'ancienne définition de `dc030EngageCombat` de Core 0.30, déjà écrasée plus loin, a été retirée au lieu d'être modernisée. La navigation et `dc030RefreshCombatButton()` restent en place.

### 3. Core 0.34

Core 0.34 reste le seam Dungeon de déclenchement manuel : il prépare uniquement l'UI Dungeon et les ennemis vivants puis délègue au propriétaire Tactical via :

`GensRpgTacticalCombatV2Bridge.requestCombat(...)`

avec `reason: "manual-setup"` et `entry: "dc030EngageCombat"`.

Il ne rouvre plus ni ne rerend l'ancien setup.

### 4. Core 0.45

Le garde du module « Combat direct des héros » reste appliqué à `dc030EngageCombat`.

Le wrapper séparé de `openDungeonCombatSetup` a été retiré : il constituait une deuxième couche de contrôle devenue inutile.

### 5. Embuscade Core 0.76

Le chemin normal reste `dc030EngageCombat()` afin de conserver la chaîne d'embuscade existante.

Uniquement si cette entrée manque, le fallback passe directement par le Bridge avec :

- les `enemyIds` vivants ;
- `reason: "embuscade"` ;
- `entry: "dc076AmbushFallback"`.

### 6. Flow 171

La réinstallation ultérieure de `window.openDungeonCombatSetup` a été retirée. Flow 171 conserve ses règles de victoire, d'accès et de flux, mais ne reprend plus l'autorité sur le démarrage Tactical.

## État de l'ancien setup

Après ce lot :

- `openDungeonCombatSetup` : **1 occurrence** ;
- cette occurrence est la définition historique native conservée comme rollback capturé par le Bridge ;
- aucun Core Dungeon actif ne l'appelle ou ne la réinstalle.

Inventaire attendu :

- `dc200StartCombat` : 13 — inchangé ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 — inchangé ;
- `startCombat` : 6 — inchangé.

## Propriétaires après le lot

- Dungeon : décide qu'un combat doit commencer, applique les gardes de module/mouvement et fournit le scope ennemi ;
- `GensRpgTacticalCombatV2Bridge.requestCombat(...)` : contrat unique entre Dungeon et Tactical ;
- Tactical/V113 : scope final, participants et résolution du combat ;
- l'ancien `openDungeonCombatSetup` n'est plus un propriétaire actif.

## Tests permanents du lot 3

- `tests/gens_core053_bridge_fallback_lot3.test.cjs` ;
- `tests/gens_open_dungeon_setup_retirement_lot3.test.cjs` ;
- inventaire des callsites ;
- contrat Bridge unique ;
- autorité combat ;
- scope/détection V113 ;
- progression / XP / récompenses ;
- architecture ;
- Chromium / preview ;
- Firefox.

Les deux tests spécifiques du lot 3 sont raccordés aux sentinelles d'architecture permanentes.

## Ce qui n'a pas été touché

- `dc200StartCombat`, `startCombat`, `launchCombat200` ;
- logique Tactical V112/V113 ;
- calcul des participants et règles de combat ;
- stats, XP, récompenses, loot ;
- déplacement hors des gardes existantes ;
- navigation générale, fiche héros, Save & Quit ;
- cache/PWA ;
- Survival, Capture, PvP, World Builder ;
- CSS historique Core 0.99/1.00.

## Validation finale avant checkpoint vert

Le checkpoint vert du lot 3 ne doit être créé que lorsque, sur le même SHA final :

1. architecture et les deux sentinelles lot 3 sont vertes ;
2. Chromium / preview est vert ;
3. Firefox est vert ;
4. la comparaison avec `b77225582f9b854b2b0e658029ebb783fc31aab7` confirme le périmètre ;
5. aucun workflow temporaire d'écriture ne reste ;
6. `main` est intact.

## Jalons verts précédents

- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
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
