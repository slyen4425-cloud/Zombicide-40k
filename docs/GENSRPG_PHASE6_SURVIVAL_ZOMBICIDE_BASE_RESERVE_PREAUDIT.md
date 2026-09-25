# GenSrpG — Phase 6 / micro-lot suivant — réserve Zombicide de base Survie — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-skill-library-green-2026-09-25`
- SHA exact :
  `7627d10dd42bd3d72578eceda489d7f54f770b49`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-zombicide-base-reserve-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-zombicide-base-reserve-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Runtime exact de base

Métadonnées Git exactes du checkpoint de départ :
- `index.html` : 8 170 815 octets ;
- blob Git : `9c762dcb8ad3549cf7175ba9413f925b11f5396c`.

La dernière source locale complète inspectée avant les raccords récents est `work23.zip/index23.txt`, ancien blob
`fb8c77504ed067fb094374260b459f8d1fb7e824`.
Elle contenait exactement :
- 1 définition `function zombicideBaseReserve()` ;
- 3 consommateurs.

Les raccords runtime intervenus depuis :
- normalisation de réserve des vagues ;
- bibliothèque contextuelle Compétences Survie ;

ne modifient pas cette responsabilité. La sentinelle RED du présent lot devra néanmoins prouver son état sur le runtime courant avant tout raccord.

## Candidat retenu

Propriétaire historique inline :
`zombicideBaseReserve()`.

Responsabilité :
produire une nouvelle réserve de base Zombicide à partir de la configuration de réserve par défaut.

Sémantique historique :
`return {...defaultZombieConfig()};`

Consommateurs historiques :
1. création initiale du preset intégré `Zombicide — Base` ;
2. réinitialisation du preset intégré ;
3. recréation/merge du preset intégré quand il manque.

## Pourquoi le lot est homogène

La responsabilité peut être pure si la réserve par défaut est passée explicitement.

Elle n'a besoin :
- ni du DOM ;
- ni du stockage ;
- ni de timer/listener/observer ;
- ni de Dungeon ;
- ni de Tactical ;
- ni de Capture ;
- ni de PvP.

Elle appartient à `GensSurvivalV1.waveRules`, déjà propriétaire des règles pures de vagues.

`defaultZombieConfig()` reste propriétaire de la donnée historique dans ce lot ; le module Survie ne doit pas la recopier ni la redéfinir.

## Cible architecturale

Ajouter :

`GensSurvivalV1.waveRules.zombicideBaseReserve(defaultReserve)`

Cette API :
1. reçoit explicitement la réserve par défaut ;
2. renvoie un nouvel objet ;
3. conserve exactement les clés/valeurs fournies ;
4. ne lit aucun global gameplay ;
5. ne possède aucun effet de bord.

Le propriétaire inline `zombicideBaseReserve()` doit être supprimé.

Ses 3 consommateurs doivent appeler directement :

`GensSurvivalV1.waveRules.zombicideBaseReserve(defaultZombieConfig())`.

Aucun wrapper global de compatibilité n'est autorisé.

## Périmètre autorisé

- `assets/gensrpg/survival/entry-v1.js`
- `assets/gensrpg/survival/module-contract-v1.json`
- `index.html` uniquement pour retirer `zombicideBaseReserve()` et raccorder ses 3 consommateurs
- tests / cartographies / empreintes strictement nécessaires
- `service-worker.js` uniquement si le cache de l'entrée Survie doit être réaligné
- `docs/GENSRPG_CURRENT_WORK.md`

## Hors périmètre

Ne pas déplacer dans ce lot :
- `defaultZombieConfig()` ;
- `refreshCustomEnemiesIntoZombieTypes()` ;
- stockage des presets / réserve ;
- UI de l'éditeur de vagues ;
- autosave ;
- niveau de danger ;
- tirage / résolution des cartes ;
- `startConfiguredGame()` ;
- bibliothèque de compétences Survie ;
- Dungeon/Tactical/Capture/PvP.

## TDD

### RED attendu avant runtime

La sentinelle doit échouer parce que :
- `waveRules.zombicideBaseReserve` n'existe pas encore ;
- le propriétaire inline `zombicideBaseReserve()` existe encore ;
- ses 3 consommateurs utilisent encore le propriétaire historique.

La sentinelle doit aussi confirmer le runtime de départ exact :
- 8 170 815 octets ;
- blob `9c762dcb8ad3549cf7175ba9413f925b11f5396c`.

### GREEN attendu après raccord

- copie exacte de la réserve fournie ;
- résultat frais à chaque appel ;
- entrée Survie sans lecture de `defaultZombieConfig()` ;
- aucun DOM/stockage/timer/listener/observer ajouté ;
- 0 définition inline `zombicideBaseReserve` ;
- exactement 3 appels directs à `GensSurvivalV1.waveRules.zombicideBaseReserve(defaultZombieConfig())` ;
- Architecture + Browser, Firefox et Tactical Dock GREEN ;
- preview + validation utilisateur avant le lot suivant.

## Rule 26

Le raccord du gros `index.html` n'est pas autorisé depuis une ancienne copie.

Après preuve RED et préparation de l'API pure :
1. résoudre le HEAD exact ;
2. confirmer le blob `index.html` attendu ;
3. demander à Sylvain le fichier exact via permalink SHA ;
4. vérifier taille/blob du fichier reçu ;
5. appliquer uniquement le raccord protégé du présent lot.
