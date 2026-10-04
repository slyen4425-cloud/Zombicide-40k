# GenSrpG — Phase 9 — Pré-audit saveActiveEnemies([]) dans Capture139

Date : 2026-10-04

## Base

- Base GREEN : `checkpoint/gensrpg-phase9-capture139-base-profile-retirement-green-2026-10-04`
- SHA de base : `77d68ab0764c7715969a24d102a725d1a3d03a74`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture139-active-enemies-preaudit-2026-10-04`
- Branche : `work/gensrpg-phase9-capture139-active-enemies-preaudit-2026-10-04`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission

Caractériser la dépendance historique `saveActiveEnemies([])` encore appelée par Capture139, sans mutation runtime, puis sélectionner un seul seam minimal sous TDD.

## Rule 26 validée

Runtime exact reçu depuis le permalink du HEAD d'ouverture :

- HEAD documentaire d'ouverture : `6ce3be7243b83037e10ce70830e9f6cd9c56630f`
- taille `index.html` : `8167048` octets ;
- blob Git : `3438e75b607d0b9bb68eb1d3edc2d97b3bd662ed` ;
- SHA-256 local : `e26a4087dc14327cdaa73c0482df39b76cdf9614bcc1d99a9f38666d5603e137`.

La copie utilisateur correspond exactement au runtime GitHub requis.

## Caractérisation exacte

### 1. Autorité de stockage

`ACTIVE_ENEMIES_KEY` vaut :

`gensrpg_active_enemies_v1`

`loadActiveEnemies()` lit directement cette clé depuis `localStorage`.

`saveActiveEnemies(a)` :
1. écrit cette clé dans `localStorage` ;
2. appelle `renderActiveEnemyButtons()` ;
3. appelle `updateDungeonExploreButtons()` ;
4. appelle `z40kSchedulePush()`.

Cette fonction n'est donc pas un simple setter de stockage.

### 2. Ownership réel : legacy partagé Survie/Dungeon, avec effets Dungeon

`trackSpawnedEnemyInstances(type,qty)` utilise explicitement `isDungeonMode()`.

- En Dungeon, le runtime accepte les ennemis Dungeon intégrés, utilise PV/endurance Dungeon et tamponne `dungeonRoom`.
- Hors Dungeon, le même état d'ennemis actifs est utilisé par le flux de spawn historique / Survie.
- `generateRealSpawn()` appelle `trackSpawnedEnemyInstances(...)` pour les vagues/spawns non Dungeon.

Le stockage `ACTIVE_ENEMIES_KEY` n'est donc pas une autorité Capture et n'est pas non plus une autorité Dungeon pure : c'est une **autorité legacy de session ennemis partagée Survie/Dungeon**.

Cependant, `saveActiveEnemies()` mélange cette persistance legacy avec un effet UI explicitement Dungeon via `updateDungeonExploreButtons()`.

### 3. Synchronisation

`z40kSchedulePush()` planifie `z40kPushState()`.

`z40kSnapshot()` copie toutes les clés `localStorage` non exclues dans l'état partagé. `ACTIVE_ENEMIES_KEY` n'est pas exclue.

Donc chaque `saveActiveEnemies()` peut aussi déclencher la synchronisation distante du snapshot de session contenant l'état ennemi actif.

Capture139 appelle donc actuellement une autorité qui :
- écrit un état de session Survie/Dungeon ;
- rafraîchit une UI Dungeon ;
- peut déclencher une synchronisation globale.

### 4. Consommateurs

Le runtime exact montre de nombreux consommateurs réels dans :
- combat RPG/Dungeon ;
- talents et capacités ennemis ;
- spawn/vagues legacy ;
- Dungeon Core ;
- Dungeon MJ ;
- exploration Dungeon ;
- Tactical bridge Dungeon.

Le système est encore réellement actif pour Survie/Dungeon et ne doit pas être retiré globalement.

### 5. Capture

Dans le bloc `captureFix139` :
- aucune lecture `loadActiveEnemies()` ;
- aucune utilisation de `ACTIVE_ENEMIES_KEY` ;
- aucun ennemi Capture n'est stocké via cette autorité ;
- le seul contact est `saveActiveEnemies([])` pendant le lancement.

Le public entry `GensCaptureV1` ne référence ni `loadActiveEnemies` ni `saveActiveEnemies`.

Conclusion :
**Capture ne consomme pas cet état ; elle le nettoie seulement.**

### 6. Pourquoi le reset existe encore

Le reset est un héritage de l'ancien lancement générique de session.

Le runtime possède déjà les nettoyages transitoires généraux hors Capture139 :
- `newGame()` -> `saveActiveEnemies([])` avant le pré-game ;
- `switchGameModeFromHome()` -> reset si une session active est quittée ;
- `openGensBuiltInGame()` -> reset si une session active est quittée ;
- le lancement legacy générique Survie conserve son propre reset ;
- les démarrages Dungeon conservent leur propre reset.

Le chemin utilisateur normal vers le bouton « DÉMARRER LA PARTIE » Capture traverse le pré-game ouvert par `newGame()`, qui a déjà nettoyé cet état transitoire.

Le reset dans Capture139 est donc une **deuxième prise de responsabilité inter-module au moment du lancement Capture**, et non une nécessité métier Capture.

## Décision d'ownership

- `ACTIVE_ENEMIES_KEY` : état legacy de session ennemis partagé Survie/Dungeon.
- `saveActiveEnemies()` : autorité legacy mixte persistance + UI Dungeon + sync, à ne pas déplacer ni dupliquer dans ce lot.
- Capture : **aucun ownership** de cet état.
- Shell/pré-game général : conserve les nettoyages transitoires de changement/nouvelle partie déjà existants.

## Seam minimal sélectionné

Retirer **uniquement** du bloc `captureFix139` :

`try{saveActiveEnemies([])}catch(e){}`

Conserver intégralement :
- définition `saveActiveEnemies()` ;
- `ACTIVE_ENEMIES_KEY` ;
- tous les consommateurs Survie/Dungeon ;
- resets `newGame()` / changements de jeu ;
- vrais démarrages Dungeon ;
- lancement Survival ;
- `renderActiveEnemyButtons()` ;
- `updateDungeonExploreButtons()` ;
- `z40kSchedulePush()`.

Aucun nouveau service, wrapper, fallback, timer, observer, polling ou second stockage.

## RED TDD attendu

La sentinelle doit exiger :
1. Capture139 ne référence plus `saveActiveEnemies` ni `loadActiveEnemies` ;
2. `saveActiveEnemies()` reste intact comme autorité legacy existante ;
3. sa clé `ACTIVE_ENEMIES_KEY` reste inchangée ;
4. le nettoyage général `newGame()` reste présent ;
5. les vrais démarrages Dungeon gardent leur reset ;
6. `GensCaptureV1` reste routing-only ;
7. starter kits, monde Capture, participants, or pré-game et turn manager Capture restent inchangés ;
8. les E2E Capture, victoire/reprise, vrai Dungeon et non-interférence restent disponibles.

## Hors périmètre

- découper ou moderniser `saveActiveEnemies()` ;
- créer un service Core ennemi ;
- migrer `ACTIVE_ENEMIES_KEY` ;
- modifier `updateDungeonExploreButtons()` ;
- modifier la synchronisation ;
- retirer les resets Survie/Dungeon ;
- `isDungeonMode()` ;
- seed `gameStyle:"dungeon"` ;
- Combat Dynamique / Exploration / Builder / Map Actor ;
- `main`.

## État

Pré-audit ownership : **ÉTABLI**.

Seam minimal : **SÉLECTIONNÉ**.

Prochaine étape : écrire et constater le RED dédié avant toute mutation runtime.

## Clôture GREEN — retrait Capture139

Le seam sélectionné a été appliqué sous TDD :
- retrait unique de `try{saveActiveEnemies([])}catch(e){}` dans `captureFix139` ;
- aucune modification de la définition `saveActiveEnemies()`, de sa clé, de ses consommateurs Survie/Dungeon ou des resets généraux ;
- aucune nouvelle autorité.

Runtime final :
- taille : `8167007` octets ;
- blob Git : `9eff1bfddc9e4fab82f7a181eb9996ecce9c6ae4`.

RED dédié :
- Architecture `37216705469` — FAILURE attendu.

Triple CI fonctionnelle GREEN :
- Architecture + Browser `37225278513` — SUCCESS ;
- Firefox `37225278411` — SUCCESS ;
- Tactical Dock `37225278415` — SUCCESS.

Les fingerprints cumulés ont été repinés mécaniquement sur le nouveau runtime. Aucun code gameplay supplémentaire n'a été modifié.

Checkpoint de fermeture prévu :
`checkpoint/gensrpg-phase9-capture139-active-enemies-retirement-green-2026-10-04`.

État : **GREEN fonctionnel, fermeture documentaire en cours**.
