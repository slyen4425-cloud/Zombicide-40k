# GenSrpG — Phase 6 / micro-lot 5 — normalisation de réserve de vagues Survie — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-wave-auto-reserve-green-2026-09-25`
- SHA exact :
  `9ff069eea2b68668e1fe7423a3988b56235ad790`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-wave-reserve-normalization-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-wave-reserve-normalization-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## État Phase 6 déjà GREEN

`assets/gensrpg/survival/entry-v1.js` possède déjà :
- `waveRules.defaultProfile()` ;
- `waveRules.collectEnemyIds(profile)` ;
- `waveRules.zombicideBaseProfile(spawnCards, enemyTypes)` ;
- `waveRules.autoReserve(profile, defaultReserve)`.

Le micro-lot 4 a été fermé après triple CI complète et validation utilisateur mobile.

## Candidat retenu pour le micro-lot 5

Propriétaire historique encore inline :
`normalizeWaveReserveForProfile(profile, reserve)`.

Responsabilité unique :
normaliser une réserve de vagues Survie en garantissant qu'un ennemi utilisé par une vraie carte `enemy` dispose d'au moins la quantité nécessaire pour résoudre une carte complète lorsque sa réserve courante est nulle ou invalide.

État vérifié sur le runtime exact courant :
- `index.html` : 8 169 503 octets ;
- blob Git : `fb8c77504ed067fb094374260b459f8d1fb7e824` ;
- 1 définition inline `normalizeWaveReserveForProfile()` ;
- 4 consommateurs directs.

La copie locale de travail issue du raccord micro-lot 4 a été revérifiée sur ce même blob exact avant le pré-audit.

## Sémantique historique

1. appeler `refreshCustomEnemiesIntoZombieTypes()` avant la lecture de la configuration par défaut ;
2. créer `out={...defaultZombieConfig(), ...(reserve||{})}` ;
3. parcourir uniquement les cartes `kind==="enemy"` ;
4. pour chaque ID, retenir la quantité maximale exigée parmi les cartes ;
5. si la réserve courante de cet ID est `<= 0`, la remplacer par au moins `1` et au moins la quantité maximale de carte ;
6. si la réserve courante est positive, la conserver même si elle est inférieure à la quantité d'une carte.

Le rafraîchissement des ennemis personnalisés est un effet de bord du callsite et ne doit pas entrer dans l'API pure Survie.

## Pourquoi ce candidat est homogène

La règle de normalisation elle-même est pure si ses dépendances de données sont explicites.

Elle n'a besoin :
- ni du DOM ;
- ni du stockage ;
- ni de timer/listener/observer ;
- ni de Dungeon ;
- ni de Tactical ;
- ni de Capture ;
- ni de PvP.

Elle appartient au même propriétaire déjà ouvert :
`GensSurvivalV1.waveRules`.

## Cible architecturale

Ajouter :

`GensSurvivalV1.waveRules.normalizeReserve(profile, reserve, defaultReserve)`

où :
- `profile` est le profil de vagues ;
- `reserve` est la réserve utilisateur / preset à normaliser ;
- `defaultReserve` est la réserve par défaut explicitement fournie.

L'API doit :
1. retourner un nouvel objet ;
2. fusionner `defaultReserve` puis `reserve` ;
3. calculer les minimums uniquement pour les cartes `enemy` ;
4. conserver le maximum de quantité par ID ;
5. ne réparer que les valeurs finales `<=0` ;
6. ne lire aucun global de gameplay.

Le propriétaire inline `normalizeWaveReserveForProfile()` doit être supprimé.

Les 4 consommateurs historiques doivent :
1. conserver `refreshCustomEnemiesIntoZombieTypes()` côté runtime historique avant la normalisation ;
2. appeler directement `GensSurvivalV1.waveRules.normalizeReserve(profile, reserve, defaultZombieConfig())`.

Aucun wrapper global de compatibilité n'est autorisé.

## Périmètre autorisé

- `assets/gensrpg/survival/entry-v1.js`
- `assets/gensrpg/survival/module-contract-v1.json`
- `index.html` uniquement pour retirer `normalizeWaveReserveForProfile()` et raccorder ses 4 consommateurs
- tests / cartographies / empreintes strictement nécessaires
- `service-worker.js` uniquement si le cache de l'entrée Survie doit être réaligné
- `docs/GENSRPG_CURRENT_WORK.md`

## Hors périmètre

Ne pas déplacer dans ce lot :
- `refreshCustomEnemiesIntoZombieTypes()` ;
- `defaultZombieConfig()` ;
- `zombicideBaseReserve()` ;
- stockage des presets / réserve ;
- UI de l'éditeur de vagues ;
- autosave ;
- calcul du niveau de danger ;
- tirage / résolution des cartes ;
- `startConfiguredGame()`.

## Interdictions

- aucun changement gameplay ;
- aucune modification des quantités par défaut ;
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
- `waveRules.normalizeReserve` n'existe pas encore ;
- le propriétaire inline `normalizeWaveReserveForProfile()` existe encore ;
- ses 4 consommateurs utilisent encore le propriétaire historique.

### GREEN attendu après raccord

- parité exacte de la normalisation historique ;
- résultat frais à chaque appel ;
- les cartes `activation`, `none`, `double` n'imposent aucun minimum ;
- une réserve positive personnalisée reste inchangée ;
- une réserve `0`/invalide est réparée au maximum requis par les cartes `enemy` ;
- aucun accès à `refreshCustomEnemiesIntoZombieTypes` ou `defaultZombieConfig` dans l'entrée Survie ;
- aucun DOM/stockage/timer/listener/observer dans l'entrée Survie ;
- 0 définition inline `normalizeWaveReserveForProfile` ;
- 4 appels directs à `GensSurvivalV1.waveRules.normalizeReserve(..., defaultZombieConfig())` ;
- les 4 callsites conservent le refresh custom-enemy avant l'appel ;
- Architecture + Browser, Firefox et Tactical Dock GREEN ;
- preview + validation utilisateur avant micro-lot suivant.

## Rule 26 pour le raccord runtime

Le pré-audit s'appuie sur le runtime courant dont le blob exact est déjà vérifié :
`fb8c77504ed067fb094374260b459f8d1fb7e824`.

Avant toute modification de `index.html`, appliquer la règle 26 :
- résoudre de nouveau le HEAD du micro-lot ;
- si le blob de `index.html` est toujours `fb8c77504ed067fb094374260b459f8d1fb7e824`, demander/fournir le permalink SHA exact et utiliser le fichier exact correspondant ;
- si le blob a changé, ne pas utiliser une ancienne copie et demander le nouveau fichier exact à Sylvain.

