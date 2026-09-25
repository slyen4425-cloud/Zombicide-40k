# GenSrpG — Phase 6 / dépendance dungeonEnemies du builtin enemy refresh — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-custom-enemy-dungeon-ensure-green-2026-09-25`
- SHA exact :
  `3853ac9a8e0704910698962ce265a75a03a46a37`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-builtin-enemy-dungeon-dependency-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-builtin-enemy-dungeon-dependency-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Runtime exact de base

Dernier runtime GREEN validé :
- `index.html` : 8 170 402 octets ;
- blob Git : `2a7dae75115d83b4edc368c42453a7cb58d0bd73`.

Aucune modification runtime n'est autorisée pendant ce pré-audit.

## Dette inter-module retenue

Le lot précédent a retiré l'appel privé Dungeon :
`refreshCustomEnemiesIntoZombieTypes() -> ensureDungeonEnemies()`.

La caractérisation Rule 26 du lot précédent a également montré que
`applyBuiltinEnemyOverrides()`
construit encore sa base depuis :

`[...BASE_ZOMBIE_TYPES, ...dungeonEnemies()]`

avant de republier les built-ins manquants dans `ZOMBIE_TYPES`.

Cette dépendance est désormais la frontière Dungeon la plus directe restante dans le chemin partagé utilisé par Survie.

Le présent lot cible uniquement :
**la dépendance directe de `applyBuiltinEnemyOverrides()` envers `dungeonEnemies()`.**

## Pourquoi ce lot doit être caractérisé avant toute extraction

Il est interdit de supposer que `dungeonEnemies()` peut simplement être retiré.

Avant de définir une architecture cible, il faut déterminer sur la source exacte :
1. si `applyBuiltinEnemyOverrides()` est appelée par Survie, Dungeon ou les deux ;
2. si les built-ins Dungeon doivent être publiés par ce propriétaire partagé ou par un propriétaire Dungeon séparé ;
3. si les overrides persistés couvrent des IDs Survie, Dungeon ou les deux ;
4. si le tableau de base `BASE_ZOMBIE_TYPES` contient uniquement Survie ou déjà des entrées Dungeon ;
5. si un adapter explicite Dungeon existe déjà et peut prendre la responsabilité ;
6. si un hook/contrat public est déjà disponible ;
7. si séparer la composition de la publication permet d'éviter tout wrapper global.

## Hypothèses admises uniquement comme historique à revalider

La source Rule 26 du lot précédent avait montré :
- `applyBuiltinEnemyOverrides()` lit `loadBuiltinEnemyOverrides()` ;
- elle compose `BASE_ZOMBIE_TYPES` et `dungeonEnemies()` ;
- elle pousse les built-ins Dungeon absents dans `ZOMBIE_TYPES` ;
- elle applique ensuite les overrides persistés aux définitions correspondantes.

Ces constats doivent être revérifiés sur le nouveau `index.html` exact car le runtime a changé depuis `work30.zip`.

## Invariants à protéger

- aucun ennemi Survie builtin ne disparaît ;
- aucun ennemi Dungeon builtin ne disparaît ;
- aucun override builtin sauvegardé n'est perdu ;
- aucun ID, stat, quantité, catégorie ou art ne change ;
- les custom Survie et custom Dungeon restent inchangés ;
- les filtres Survie/Dungeon restent inchangés ;
- les vagues/réserves Survie restent inchangées ;
- les arts Dungeon V164/V165/V166 restent inchangés ;
- aucune nouvelle autorité globale ;
- aucun changement stockage/UI/éditeur/gameplay.

## Hors périmètre

- ne pas modifier `refreshCustomEnemiesIntoZombieTypes()` au-delà du raccord strict éventuellement nécessaire ;
- ne pas modifier `ensureDungeonEnemies()` ni `ensureDungeonContent()` ;
- ne pas modifier `dungeonEnemies()` avant caractérisation ;
- ne pas modifier `loadBuiltinEnemyOverrides()` ;
- ne pas modifier `customEnemyToZombieType()` ;
- ne pas modifier les règles de vagues déjà extraites ;
- ne pas toucher Tactical/Capture/PvP ;
- ne pas déplacer les assets.

## TDD obligatoire

Avant tout runtime :
1. obtenir le `index.html` exact du HEAD courant selon Rule 26 ;
2. caractériser les frontières exactes de `applyBuiltinEnemyOverrides()` ;
3. identifier le propriétaire cible minimal :
   - publication Survie pure,
   - publication Dungeon dédiée,
   - ou adapter explicite partagé avec données injectées ;
4. écrire une caractérisation navigateur de l'état cible sans modifier le runtime GitHub ;
5. seulement si GREEN, écrire une sentinelle RED dédiée ;
6. prouver RED isolé avec Phase 6 #170 à #177 GREEN ;
7. conserver Firefox et Tactical Dock GREEN ;
8. seulement ensuite réaliser un raccord minimal.

## Interdictions

- aucun wrapper global de compatibilité ;
- aucun polling/retry/heartbeat ;
- aucun `MutationObserver` global ;
- aucun `location.reload` ;
- aucune duplication du catalogue ;
- aucune seconde source de vérité ;
- aucune réécriture opportuniste des vagues ou du système Dungeon.

## Rule 26

Le contenu exact de `index.html` est nécessaire pour ce lot.

Procédure :
1. résoudre le HEAD exact après l'ouverture documentaire ;
2. vérifier blob/taille de `index.html` ;
3. fournir à Sylvain le permalink SHA exact ;
4. demander le ZIP de ce fichier exact ;
5. vérifier taille + blob ;
6. seulement ensuite figer le contrat de caractérisation.

Ne pas réutiliser `work30.zip` :
il correspond au runtime précédent, avant le retrait de la ligne `ensureDungeonEnemies()`.
