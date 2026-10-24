# GenSrpG — Phase 6 / micro-lot 3 — profil Zombicide de base vers règles Survie — pré-audit — 2026-09-25

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-wave-rules-entry-green-2026-09-25`
- SHA exact :
  `48d9af75913e9208d74d73a655a6b5fded2da7dc`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-zombicide-base-wave-profile-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-zombicide-base-wave-profile-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## État Phase 6 déjà GREEN

Le micro-lot 2 a activé `assets/gensrpg/survival/entry-v1.js` avec :
- `waveRules.defaultProfile()` ;
- `waveRules.collectEnemyIds(profile)`.

Le Browser complet du SHA final a validé notamment :
- lancement Survie ;
- héros Survie après Dungeon ;
- Fouiller / arts Survie ;
- Dungeon map -> Tactical V2 ;
- Capture victoire / reprise inter-module ;
- Dungeon après Survie dans Chromium.

Le micro-lot 2 est fermé et ne doit pas être rouvert sans régression objective.

## Candidat retenu pour le micro-lot 3

Propriétaire historique encore inline :
`function zombicideBaseWaveProfile()`.

Responsabilité :
transformer le deck Zombicide historique `BP_SPAWN_CARDS` en profil de vagues éditable Survie :
- colonnes Bleu / Jaune / Orange / Rouge ;
- seuils 0 / 7 / 19 / 43 ;
- conversion des cartes `none`, `double`, `activation`, ennemi ;
- fallback historique vers `walker` pour un type absent de `ZOMBIE_TYPES`.

Consommateurs historiques : exactement 3 :
- création initiale du preset Zombicide de base ;
- reset du preset Zombicide de base ;
- réparation/merge du preset Zombicide de base.

## Pourquoi ce candidat est homogène

La conversion elle-même peut être pure si le deck et les types d’ennemis lui sont passés explicitement.

Elle n’a besoin :
- ni du DOM ;
- ni de stockage ;
- ni de timer/listener/observer ;
- ni de Dungeon ;
- ni de Tactical ;
- ni de Capture ;
- ni de PvP.

Elle appartient au même propriétaire déjà ouvert :
`GensSurvivalV1.waveRules`.

## Cible architecturale

Ajouter :

`GensSurvivalV1.waveRules.zombicideBaseProfile(spawnCards, enemyTypes)`

Cette API :
1. repart de `defaultProfile()` ;
2. force `enabled=true` et `mode="xp"` ;
3. conserve exactement les 4 niveaux historiques ;
4. convertit le deck fourni sans lire de global ;
5. conserve le fallback historique `walker`.

Le propriétaire inline `zombicideBaseWaveProfile()` doit être supprimé.

Ses trois consommateurs doivent appeler directement l’API Survie avec les dépendances explicites :
- deck `BP_SPAWN_CARDS` quand disponible ;
- liste `ZOMBIE_TYPES`.

Aucun wrapper global de compatibilité n’est autorisé.

## Périmètre autorisé

- `assets/gensrpg/survival/entry-v1.js`
- `assets/gensrpg/survival/module-contract-v1.json`
- `index.html` uniquement pour retirer le propriétaire inline et raccorder ses 3 consommateurs
- tests / cartographies / empreintes strictement nécessaires
- `service-worker.js` seulement si son cache doit refléter une version d’entrée modifiée
- `CURRENT_WORK`

## Interdictions

- aucun changement des cartes Zombicide historiques ;
- aucun changement de quantité, seuil, couleur ou fallback ;
- aucun changement UI ;
- aucun changement stockage ;
- aucun déplacement de `startConfiguredGame()` ;
- aucune modification Dungeon/Tactical/Capture/PvP ;
- aucun nouveau wrapper global ;
- aucun fallback inter-module ;
- aucun polling/retry/observer ;
- aucun merge sur `main`.

## TDD

### RED attendu avant runtime

La nouvelle sentinelle doit échouer parce que :
- `waveRules.zombicideBaseProfile` n’existe pas encore ;
- le propriétaire inline `zombicideBaseWaveProfile()` existe encore ;
- les 3 consommateurs utilisent encore ce propriétaire historique.

### GREEN attendu après raccord

- parité exacte de conversion du deck ;
- résultat frais à chaque appel ;
- aucune lecture de global dans l’API ;
- aucun DOM/stockage/timer/listener/observer dans l’entrée Survie ;
- 0 définition inline `zombicideBaseWaveProfile` ;
- 3 appels directs à `GensSurvivalV1.waveRules.zombicideBaseProfile(...)` ;
- Architecture + Browser, Firefox et Tactical Dock GREEN ;
- preview + validation utilisateur avant micro-lot 4.

## Rule 26

Le runtime exact `index.html` fait plus de 8 Mo.
Le micro-lot ne doit pas reconstruire ce fichier depuis des fragments.

Après preuve RED, si le raccord `index.html` est nécessaire, demander à Sylvain le fichier exact du HEAD du micro-lot via un lien GitHub précis et un ZIP, puis vérifier son blob avant modification.
