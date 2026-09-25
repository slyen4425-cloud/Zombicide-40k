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
