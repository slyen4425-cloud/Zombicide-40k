# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture est autonome : aucun état gameplay mutable partagé avec RPG, Survie ou PVP.
- Moteur spatial neutre partagé dans `v2/src/core/spatial-engine.js` ; graphe World Builder neutre dans `v2/src/core/world-graph.js`.
- Capture reste lazy : aucun bootstrap global ; stockage exclusivement `gensrpg:v2:capture:*`.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable et premier runtime dynamique de combat.
- Les visuels Capture validés ne sont pas encore importés physiquement ; registre `pending_import` sous cible `v2/assets/capture/creatures/`.
- Les 4 orbes legacy reconnues sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients restent non inventés.
- Le combat Capture utilise son runtime dédié `v2/src/modes/capture/dynamic-combat.js` et reste indépendant du `turnSequence`/D100 RPG.

## Jalons CI récents validés

- canonicalisation/déduplication créatures : `34679224508` success
- stockage isolé + spatial neutre : `34679382483` success
- contrats gameplay : `34679477548` success
- runtime Capture isolé : `34679708898` success
- roster/équipe/réserve : `34679980856` success
- ouverture lazy Capture : `34680539893` success
- registre assets canonique : `34680830787` success
- objets + capacités/charges : `34681113738` success
- biomes + exploration/rencontres : `34681280023` success
- tentative de capture configurable : `34681385329` success
- contrat combat dynamique Capture : `34681468819` success
- premier runtime combat dynamique Capture : `34681648425` success

## Dernière étape terminée

Premier squelette réel du runtime de combat dynamique Capture :
- nouveau `v2/src/modes/capture/dynamic-combat.js` ;
- état de combat indépendant avec `runtime: capture_dynamic`, `status`, rencontre source, créature active joueur, adversaire, état spatial et timing volontairement non figé ;
- création d’un combat sauvage depuis une rencontre active et une créature possédée de l’équipe active ;
- un acteur spatial distinct est créé pour la créature joueur et pour la créature adverse ;
- déplacement en combat via le Core spatial neutre et budget de mouvement configurable ;
- calcul de distance réelle et vérification de portée, sans moteur de combat RPG ;
- changement de créature actif : la nouvelle instance reprend la position de la précédente, l’ancienne position est retirée et aucune instance n’est fusionnée ;
- fins de combat autorisées limitées à `opponent_ko`, `capture_success`, `flee`, `player_team_unavailable` ;
- intégration dans `capture.js` : `startCaptureBattle()`, `moveCaptureBattleCreature()`, `switchCaptureBattleCreature()`, `finishCaptureBattle()` ;
- l’exploration passe `freeMovement:false` pendant le combat puis revient à `true` à la fin ;
- capture/KO/fuite nettoient la rencontre active ;
- aucun timing final, aucune IA complète, aucun netcode PVP ni formule de dégâts/esquive finale n’a été figé.

Régression :
- nouveau `v2/tests/capture-dynamic-combat-runtime.test.mjs` couvrant entrée en combat, portée, déplacement, changement de créature, sorties et intégration avec l’état Capture ;
- le premier run `34681621899` a volontairement bloqué le checkpoint après avoir révélé que la vérification de portée tronquait la distance au rayon demandé ;
- correction : la portée compare maintenant le rayon à une vraie distance calculée indépendamment du rayon ;
- run corrigé `34681648425` : success.

Commits de l’étape :
- runtime dynamique : `42042255f14a1d340aded07c523e388f1d3b5514`
- intégration dans l’état Capture : `7002e09d276d4aa7a07123880053b21ae50ee8b0`
- régression runtime : `aaf4e267b65220d9397eeea138b7bb778c1055e1`
- correction distance/portée : `431016b99ce9c9cb11827d09b2293560e75c8b38`

## Priorités ouvertes

1. prochaine étape Capture : brancher les capacités/charges et une première résolution d’action sur ce runtime dynamique, en gardant dégâts/esquive/timing configurables ;
2. brancher ensuite la tentative de capture complète au combat sauvage avec consommation d’orbe et création d’instance possédée/réserve ;
3. poursuivre ensuite l’IA Capture dédiée sans reprendre l’IA/timeline RPG ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
