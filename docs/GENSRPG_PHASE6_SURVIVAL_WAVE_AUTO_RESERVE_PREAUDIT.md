# GenSrpG — Phase 6 / micro-lot 4 — réserve automatique des vagues Survie — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-zombicide-base-wave-profile-green-2026-09-25`
- SHA exact :
  `819380e2598b18d349029d8522068101ea153110`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-wave-auto-reserve-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-wave-auto-reserve-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Rule 26 — source exacte vérifiée

Sylvain a fourni `work22.zip`.

Contenu vérifié :
- fichier : `index22.txt` ;
- taille : `8 169 596` octets ;
- blob Git : `d451372389f29d0145d3f9689ca739128a0650e9`.

Ce blob correspond exactement à `index.html` du checkpoint GREEN précédent.

## État Phase 6 déjà GREEN

`assets/gensrpg/survival/entry-v1.js` possède déjà :
- `waveRules.defaultProfile()` ;
- `waveRules.collectEnemyIds(profile)` ;
- `waveRules.zombicideBaseProfile(spawnCards, enemyTypes)`.

Le micro-lot 3 a été fermé après validation mobile et triple CI complète.

## Candidat retenu pour le micro-lot 4

Propriétaire historique encore inline :
`function autoReserveFromProfile(p)`.

Responsabilité unique :
construire automatiquement la réserve d'ennemis nécessaire à partir d'un profil de vagues.

État exact dans l'index vérifié :
- 1 définition inline ;
- 6 consommateurs ;
- dépendances actuelles implicites :
  - `ZOMBIE_TYPES` pour initialiser tous les IDs à 0 ;
  - `defaultZombieConfig()` pour reprendre la quantité de boîte d'un ennemi utilisé ;
  - `GensSurvivalV1.waveRules.collectEnemyIds(profile)` pour identifier les ennemis utilisés.

Sémantique historique :
1. tous les ennemis connus sont initialisés à `0` ;
2. chaque ennemi référencé par le profil reçoit au minimum `1` ;
3. si une quantité par défaut valide existe, elle est utilisée ;
4. un ID référencé mais absent des valeurs par défaut reçoit `1`.

## Pourquoi ce candidat est homogène

Cette responsabilité peut être pure si la configuration de réserve par défaut lui est passée explicitement.

Elle n'a besoin :
- ni du DOM ;
- ni de stockage ;
- ni de timer/listener/observer ;
- ni de Dungeon ;
- ni de Tactical ;
- ni de Capture ;
- ni de PvP.

Elle appartient au même propriétaire déjà ouvert :
`GensSurvivalV1.waveRules`.

Le catalogue d'ennemis et `defaultZombieConfig()` restent hors du module Survie dans ce lot :
ils fournissent seulement leurs données au callsite. Le module ne doit pas reprendre leur propriété.

## Cible architecturale

Ajouter :

`GensSurvivalV1.waveRules.autoReserve(profile, defaultReserve)`

où `defaultReserve` est un objet explicite `{ enemyId: quantity }`.

L'API :
1. crée un nouvel objet ;
2. initialise toutes les clés de `defaultReserve` à `0` ;
3. utilise `collectEnemyIds(profile)` en interne ;
4. affecte aux ennemis utilisés `Math.max(1, Number(defaultReserve[id]) || 1)` ;
5. ne lit aucun global de gameplay.

Le propriétaire inline `autoReserveFromProfile()` doit être supprimé.

Ses 6 consommateurs doivent appeler directement :
`GensSurvivalV1.waveRules.autoReserve(profile, defaultZombieConfig())`.

Aucun wrapper global de compatibilité n'est autorisé.

## Périmètre autorisé

- `assets/gensrpg/survival/entry-v1.js`
- `assets/gensrpg/survival/module-contract-v1.json`
- `index.html` uniquement pour retirer `autoReserveFromProfile()` et raccorder ses 6 consommateurs
- tests / cartographies / empreintes strictement nécessaires
- `service-worker.js` uniquement si le cache de l'entrée Survie doit être réaligné
- `CURRENT_WORK`

## Hors périmètre

Ne pas déplacer dans ce lot :
- `defaultZombieConfig()` ;
- `normalizeWaveReserveForProfile()` ;
- `zombicideBaseReserve()` ;
- stockage des presets / réserve ;
- UI de l'éditeur de vagues ;
- calcul du niveau de danger ;
- tirage / résolution des cartes ;
- `startConfiguredGame()`.

## Interdictions

- aucun changement gameplay ;
- aucun changement de quantités par défaut ;
- aucun changement UI ;
- aucun changement stockage ;
- aucune modification Dungeon/Tactical/Capture/PvP ;
- aucun nouveau wrapper global ;
- aucun fallback inter-module ;
- aucun polling/retry/observer ;
- aucun merge sur `main`.

## TDD

### RED attendu avant runtime

La nouvelle sentinelle doit échouer parce que :
- `waveRules.autoReserve` n'existe pas encore ;
- le propriétaire inline `autoReserveFromProfile()` existe encore ;
- ses 6 consommateurs utilisent encore le propriétaire historique.

### GREEN attendu après raccord

- parité exacte de la dérivation de réserve ;
- résultat frais à chaque appel ;
- aucun accès `ZOMBIE_TYPES` ou `defaultZombieConfig` dans l'entrée Survie ;
- aucun DOM/stockage/timer/listener/observer dans l'entrée Survie ;
- 0 définition inline `autoReserveFromProfile` ;
- 6 appels directs à `GensSurvivalV1.waveRules.autoReserve(..., defaultZombieConfig())` ;
- Architecture + Browser, Firefox et Tactical Dock GREEN ;
- preview + validation utilisateur avant micro-lot suivant.

## Rule 26 pour le raccord runtime

Le raccord de `index.html` devra utiliser exclusivement le fichier `index22.txt` déjà vérifié tant que le HEAD runtime n'a pas changé.

Si un nouveau commit modifie `index.html` avant le raccord, demander à nouveau le fichier exact du nouveau HEAD.
