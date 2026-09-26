# GenSrpG — Carte du runtime réellement actif

Date : 2026-09-15
Base production auditée : `main` au commit `e8681f9823573ced8aec59c8ddc47a72b02bc663` (V16.78.114.11)
Branche de refonte courante : `work/gensrpg-wall-css-authority-cleanup-2026-09-15`

## Principe de sécurité

La restructuration reste progressive et soustractive. `main` n'est pas modifié pendant les travaux d'architecture.

La référence de retour arrière complète est :

`backup/gensrpg-v16.78.114.11-architecture-baseline-2026-09-15`

Elle conserve exactement le gros `index.html` de V16.78.114.11 ainsi que tous les assets et tests correspondants.

Chaque jalon structurel validé possède en plus son propre checkpoint Git. Parmi les jalons principaux :

- `checkpoint/gensrpg-architecture-sentinels-green-2026-09-15`
- `checkpoint/gensrpg-force-snapshot-green-2026-09-15`
- `checkpoint/gensrpg-runtime-bootstrap-green-2026-09-15`
- `checkpoint/gensrpg-combat-authority-characterized-green-2026-09-15`
- `checkpoint/gensrpg-v112-start-authority-removed-green-2026-09-15`
- `checkpoint/gensrpg-bridge-single-entry-green-2026-09-15`
- `checkpoint/gensrpg-combat-callsite-inventory-green-2026-09-15`
- `checkpoint/gensrpg-single-detection-authority-final-green-2026-09-15`
- `checkpoint/gensrpg-observer-guard-retired-green-2026-09-15`
- `checkpoint/gensrpg-single-js-wall-authority-green-2026-09-15`
- `checkpoint/gensrpg-single-wall-authority-green-2026-09-15`

## 1. Les trois niveaux à ne pas confondre

Le runtime réel reste composé de trois niveaux :

1. `index.html` source ;
2. `_site/index.html` construit par GitHub Pages ;
3. modules chargés dynamiquement au runtime.

Invariant :

`index.html source != _site/index.html construit != runtime après chargements dynamiques`

Le titre HTML historique n'est pas une autorité de version. Le SHA Git, la composition testée et les modules effectivement chargés font foi.

## 2. Composition statique Pages

Le workflow Pages garantit toujours la chaîne Dungeon historique puis les modules GenSrpG nécessaires. Le module :

`assets/gensrpg/gens-mobile-combat-performance-16781022.js`

reste la dernière entrée statique GenSrpG de transition.

Cette position n'a pas été modifiée pendant la restructuration afin de ne pas mélanger nettoyage d'architecture et changement d'ordre de chargement.

## 3. RuntimeBootstrap — séparation validée

Avant restructuration, le module performance mobile cumulait cache/dés/performance et composition dynamique Tactical/Survie.

La composition dynamique appartient maintenant à :

`assets/gensrpg/core/runtime-bootstrap-v1.js`

Le module performance conserve uniquement ses responsabilités de performance et effectue un handoff vers ce bootstrap.

Le bootstrap garde volontairement l'ordre historique de transition :

1. `gens-rpg-tactical-combat-v2.js`
2. `gens-rpg-tactical-combat-v2-adapter.js`
3. `gens-rpg-tactical-combat-v2-rules.js`
4. `gens-rpg-tactical-combat-v2-integration.js`
5. `gens-rpg-tactical-combat-v2-ui.js`
6. `gens-rpg-tactical-combat-v2-bridge.js`
7. `gens-survival-mode-isolation-1678104.js`

Ordre, `async=false`, idempotence et retries sont protégés par sentinelles. Aucun nouveau module d'architecture n'a le droit de devenir un second chargeur caché de scripts.

## 4. Autorités actuellement consolidées

### Navigation / fiche héros / Save & Quit

Autorité : runtime Dungeon natif.

Tactical ne doit pas reprendre l'accueil, la fiche héros, Save & Quit ou le renderer global après sortie du combat. La sentinelle navigateur V114.11 protège cette frontière.

### Stats / Force / snapshot Tactical

Le chemin réel est caractérisé et protégé :

`Force canonique -> effets configurés -> bridge Dungeon historique -> snapshot Tactical`

Les tests couvrent notamment Force 20 -> bonus physique +2 et Force 30 -> +3 avec la règle configurée `+1 / 10 Force`.

### Détection Tactical

Autorité active unique : V113.

Les autorités de détection V108, V111 et V112 ont été retirées du chemin actif. Les scénarios de salle, sous-salle, portée, LOS et héros non encore entré restent protégés.

### Démarrage de combat / participants

Le Bridge possède désormais une seule entrée interne explicite :

`GensRpgTacticalCombatV2Bridge.requestCombat(runtime, options)`

Les quatre noms historiques restent encore des adaptateurs de compatibilité :

- `dc200StartCombat`
- `openDungeonCombatSetup`
- `launchCombat200`
- `startCombat`

V112 ne reprend plus l'autorité de démarrage. V113 reste l'autorité finale de scope/participants avant le lancement Tactical.

Le monolithe possède encore des appels historiques à migrer progressivement ; ils sont figés par `GENSRPG_COMBAT_CALLSITE_INVENTORY.md`.

### Observers globaux

La chaîne Tactical V108 -> V113 ne dépend plus d'un `MutationObserver` global actif sur `body/html`.

Le garde constructeur temporaire qui avait été nécessaire dans V114.11 n'est plus requis pour compenser ces couches historiques dans la branche restructurée.

### Murs Tactical / Dungeon

Autorité visuelle active unique :

`assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js`

Consolidation terminée :

- V108 : repaint JS retiré + CSS mural retiré ;
- V109 : repaint JS retiré + CSS mural retiré ;
- V111 : repaint JS retiré + CSS mural retiré ;
- V112 : repaint JS retiré + CSS mural retiré ;
- V113 : repaint JS retiré + CSS mural retiré.

Les fonctions historiques restent inspectables pour rollback, mais aucune de ces couches n'est propriétaire actif du rendu mural.

Deux verrous distincts empêchent une régression :

- autorité JS unique des murs ;
- autorité CSS unique des murs.

La sentinelle Chromium vérifie le vrai asset, son décodage, l'unicité des tuiles et le raccord Dungeon.

Checkpoint final :

`checkpoint/gensrpg-single-wall-authority-green-2026-09-15`

Run final architecture + Chromium : `35017431951`.

## 5. Dette encore active

La chaîne V108 -> V114.11 existe toujours physiquement. Plusieurs fonctions historiques restent exportées pour rollback et caractérisation, même lorsqu'elles ne sont plus installées.

La dette principale n'est donc plus le rendu mural ni la détection. Elle se concentre maintenant sur :

1. les appels historiques de démarrage de combat encore présents dans `index.html` ;
2. les adaptateurs de compatibilité du Bridge ;
3. le mélange multi-dés / dock / maintenance UI encore contenu dans V111 ;
4. les auto-installs et retries historiques encore présents dans plusieurs couches ;
5. le gros monolithe `index.html`, qui ne sera découpé qu'après stabilisation des contrats.

## 6. Prochain chantier

Le prochain chantier est la réduction progressive des points d'entrée combat historiques vers :

`GensRpgTacticalCombatV2Bridge.requestCombat(runtime, options)`

Inventaire actuel figé dans le monolithe :

- `dc200StartCombat` : 13 occurrences ;
- `openDungeonCombatSetup` : 17 occurrences ;
- `launchCombat200` : 2 occurrences ;
- `startCombat` : 6 occurrences.

Règle : migrer un petit groupe homogène à la fois, diminuer le compteur attendu, préserver `enemyIds`, `reason`, embuscades, mode MJ, participants et retour exploration, puis valider architecture + Chromium avant checkpoint.

## Statut

La consolidation des autorités de composition, UI Dungeon, détection, observers globaux et rendu mural a franchi des checkpoints verts. La production `main` reste volontairement sur V16.78.114.11 et n'a pas été publiée avec ces changements de restructuration.

## Mise à jour Phase 7 — 2026-09-26

Premier slice Dungeon activé sur la branche `work/gensrpg-phase7-dungeon-exploration-2026-09-26` :

- entrée source directe : `assets/gensrpg/dungeon/entry-v1.js?v=1` ;
- namespace public : `GensDungeonV1` ;
- responsabilité connectée : plan pur de destination generated `exploration.planGeneratedAdvance()` ;
- chargement source : immédiatement après `assets/gensrpg/survival/entry-v1.js?v=1`, avant `dungeonCore200Rebuild` ;
- Core 2.00 conserve les gardes, la persistance, le mouvement, la création de salle, spawn, événements, coffres, pièges et combat ;
- le chemin authored reste directement propriétaire via `DungeonAuthoredRuntime167839.travel -> enterNode()` ;
- aucune dépendance Tactical n’est introduite dans l’entrée Dungeon.

Cette mise à jour ne modifie pas la production `main`, toujours gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
