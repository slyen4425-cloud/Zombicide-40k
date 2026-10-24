# GenSrpG — Phase 6 / custom enemy refresh Survie — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-zombicide-base-reserve-green-2026-09-25`
- SHA exact :
  `d7c2e2faf54505438b95892a6d1e41a2fef30455`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-custom-enemy-refresh-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-custom-enemy-refresh-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Runtime exact de base

Métadonnées Git du checkpoint GREEN précédent :
- `index.html` : 8 170 881 octets ;
- blob Git : `f6a11fa5c0807debc0c9950cc2caf5356c97cfc8`.

Aucune modification de `index.html` n'est autorisée pendant ce pré-audit.

## Dette inter-module prouvée par la cartographie courante

La cartographie Phase 2 alignée sur le blob courant contient encore :

`refreshCustomEnemiesIntoZombieTypes    2    dungeonArtRenderFix165`

Donc une responsabilité nommée explicitement autour des ennemis Survie/Zombicide reste possédée par un bloc historiquement classé Dungeon.

Cette dette est prioritaire en Phase 6 car le critère de sortie exige que Survie ne dépende plus d'autorités privées Dungeon.

Une autre ligne `openZombieRule -> dungeonDirectImageBinding166` existe également dans la cartographie, mais elle n'est PAS incluse dans ce lot : un seul propriétaire est caractérisé à la fois.

## Preuve de dépendance actuelle côté vagues

La sentinelle GREEN existante
`tests/gens_phase6_survival_wave_reserve_normalization_v1.test.cjs`
verrouille actuellement quatre callsites où :

1. `refreshCustomEnemiesIntoZombieTypes()` est appelé dans le runtime historique ;
2. puis `GensSurvivalV1.waveRules.normalizeReserve(...)` est appelé.

Elle interdit aussi explicitement à l'entrée pure `assets/gensrpg/survival/entry-v1.js`
de lire ou posséder `refreshCustomEnemiesIntoZombieTypes`.

Conclusion actuelle :
- les règles de vagues pures sont bien isolées ;
- le refresh du catalogue d'ennemis reste un effet de bord séparé ;
- son propriétaire réel est encore hors du module Survie.

## Ce que le pré-audit doit déterminer avant de définir l'API cible

Ne pas deviner l'architecture à partir du nom de la fonction.

Sur le fichier `index.html` exact du HEAD courant, caractériser :

1. la ou les définitions exactes de `refreshCustomEnemiesIntoZombieTypes` ;
2. tous ses consommateurs directs ;
3. toutes ses lectures/écritures de `ZOMBIE_TYPES` ou d'un catalogue équivalent ;
4. la source canonique des ennemis personnalisés ;
5. les accès éventuels au stockage ;
6. les éventuels accès DOM/UI ;
7. les dépendances Dungeon réelles ou seulement historiques ;
8. si la responsabilité peut être séparée en :
   - transformation pure de données ;
   - effet de bord de publication/mutation du catalogue ;
9. si le propriétaire final doit être :
   - une API pure Survie alimentée explicitement ;
   - un petit adapter/runtime Survie ;
   - ou une combinaison pure + adapter, sans wrapper global.

Aucun nom d'API final n'est figé avant cette caractérisation.

## Invariants à protéger

- aucune modification des ennemis disponibles ;
- aucune modification des IDs, stats, arts ou quantités ;
- aucun changement du stockage des ennemis personnalisés ;
- aucun changement UI de l'éditeur ;
- aucune modification de `defaultZombieConfig()` dans ce lot ;
- aucune modification des règles déjà extraites :
  `defaultProfile`, `collectEnemyIds`, `zombicideBaseProfile`,
  `autoReserve`, `normalizeReserve`, `zombicideBaseReserve` ;
- les quatre callsites de normalisation doivent conserver exactement leur comportement ;
- Dungeon/Tactical/Capture/PvP ne doivent recevoir aucune nouvelle dépendance Survie.

## Interdictions

- aucun wrapper global de compatibilité ;
- aucun polling/retry/heartbeat ;
- aucun `MutationObserver` global ;
- aucun `location.reload` ;
- aucune duplication du catalogue d'ennemis ;
- aucune seconde source de vérité ;
- aucune réécriture opportuniste du système de vagues ;
- aucun changement gameplay.

## TDD obligatoire

Après caractérisation exacte et avant toute correction runtime :

1. écrire une sentinelle RED dédiée au propriétaire retenu ;
2. prouver que le RED est isolé ;
3. conserver les sentinelles Phase 6 #171 à #175 GREEN ;
4. conserver Firefox et Tactical Dock GREEN ;
5. seulement ensuite préparer l'API/adapter cible ;
6. raccord `index.html` uniquement après Rule 26.

## Rule 26

Le contenu exact du gros `index.html` est maintenant nécessaire pour caractériser cette responsabilité.

Procédure obligatoire :
1. résoudre le HEAD exact de la présente branche après documentation ;
2. confirmer par métadonnées que `index.html` reste au blob
   `f6a11fa5c0807debc0c9950cc2caf5356c97cfc8`
   et à 8 170 881 octets ;
3. fournir à Sylvain le permalink SHA exact ;
4. demander le ZIP du fichier exact ;
5. vérifier taille + blob du fichier reçu ;
6. seulement ensuite inspecter l'implémentation et figer le contrat TDD.

Ne pas réutiliser une ancienne copie du gros HTML, même si elle est proche du runtime courant.

## Caractérisation Rule 26 — source exacte reçue

Sylvain a fourni `work29.zip`.

Contenu vérifié :
- fichier : `index29.txt` ;
- taille : 8 170 881 octets ;
- blob Git : `f6a11fa5c0807debc0c9950cc2caf5356c97cfc8` ;
- correspond exactement au `index.html` du HEAD requis.

### Propriétaire natif réel

Le runtime contient exactement une définition native :

`function refreshCustomEnemiesIntoZombieTypes()`.

Sa sémantique actuelle est mixte :
1. appeler `applyBuiltinEnemyOverrides()` ;
2. retirer de `ZOMBIE_TYPES` les entrées `customEnemy` non `dungeonBuiltin` ;
3. recharger `loadCustomEnemies()` et convertir chaque entrée via `customEnemyToZombieType(e)` ;
4. appeler `ensureDungeonEnemies()` si disponible.

Ce propriétaire natif n'est donc PAS encore une responsabilité Survie pure :
- `loadCustomEnemies()` contient les créations Survie et Dungeon ;
- `customEnemyToZombieType()` conserve `gameMode` et les stats RPG ;
- `applyBuiltinEnemyOverrides()` construit sa base depuis `BASE_ZOMBIE_TYPES` ET `dungeonEnemies()` ;
- `ensureDungeonEnemies()` est explicitement Dungeon.

Une extraction directe de toute cette fonction vers `assets/gensrpg/survival/` est interdite : elle importerait des responsabilités Dungeon dans Survie.

### Wrapper Dungeon tardif prouvé

Le bloc `dungeonArtRenderFix165` réattribue globalement :

`window.refreshCustomEnemiesIntoZombieTypes=function(){ const r=old.apply(this,arguments); apply(); return r; };`

Raison historique indiquée par le code : réappliquer les arts Dungeon après chaque reconstruction du catalogue.

Cette réattribution fait de `dungeonArtRenderFix165` le dernier propriétaire global cartographié, y compris lorsque le refresh est déclenché par un parcours Survie.

### État des couches d'art plus récentes

Le runtime contient aussi :
- `dungeonGithubArts164`, qui enveloppe déjà `applyBuiltinEnemyOverrides()` et `dungeonEnemies()` pour fournir l'art Dungeon ;
- `dungeonArtRenderFix165`, qui protège encore `activeEnemyDefinition`, `enemyCardHtml`, `openZombieRule` et `renderActiveEnemies` ;
- `dungeonDirectImageBinding166`, dont le commentaire explicite qu'il ne dépend plus de `def.art` pour afficher les PNG GitHub et qui injecte les arts directement dans les renderers actifs.

Hypothèse minimale à tester : le wrapper GLOBAL de `refreshCustomEnemiesIntoZombieTypes` dans V165 est devenu redondant, tandis que les autres protections d'art restent en place.

### Consommateurs

La source exacte contient de nombreux consommateurs partagés et spécifiques de mode. Le pré-audit a confirmé notamment :
- démarrage/boot commun ;
- lancement de profil ;
- éditeur et bibliothèque d'ennemis ;
- configuration/réserve/vagues Survie ;
- résolution des apparitions ;
- récompenses/loot ;
- événements, rencontres, boss, codex et MJ Dungeon ;
- rendu de règle Dungeon V166.

Le micro-lot ne doit donc surtout PAS remplacer globalement tous ces appels par une API Survie.

## Micro-lot retenu après caractérisation

Le plus petit lot homogène est :
**prouver puis retirer uniquement le wrapper global de `refreshCustomEnemiesIntoZombieTypes` dans `dungeonArtRenderFix165`.**

Ce micro-lot ne déplace pas encore le propriétaire natif et ne traite pas encore ses dépendances mixtes `applyBuiltinEnemyOverrides/dungeonEnemies/ensureDungeonEnemies`.
Celles-ci devront faire l'objet d'un micro-lot séparé après restauration de l'autorité native.

### TDD attendu

Avant toute modification runtime :
1. caractérisation navigateur avec une fixture qui retire uniquement le wrapper V165 ;
2. vérifier que le propriétaire natif reste callable ;
3. vérifier qu'un ennemi personnalisé Survie est encore publié dans `ZOMBIE_TYPES` ;
4. vérifier que les built-ins Dungeon existent toujours après refresh ;
5. vérifier qu'un override d'art Dungeon reste visible via `activeEnemyDefinition` et `enemyCardHtml` grâce aux couches restantes ;
6. ajouter ensuite une sentinelle statique RED exigeant l'absence du wrapper V165 ;
7. ne modifier `index.html` qu'après preuve de caractérisation + RED isolé.

### Hors périmètre du micro-lot retenu

- ne pas retirer `applyBuiltinEnemyOverrides()` ;
- ne pas retirer `ensureDungeonEnemies()` ;
- ne pas déplacer `refreshCustomEnemiesIntoZombieTypes()` dans Survie ou Core ;
- ne pas modifier `dungeonGithubArts164` ;
- ne pas modifier les wrappers V165 de `activeEnemyDefinition`, `enemyCardHtml`, `openZombieRule`, `renderActiveEnemies` ;
- ne pas modifier `dungeonDirectImageBinding166` ;
- ne pas modifier les données ennemis, le stockage ou le gameplay.
