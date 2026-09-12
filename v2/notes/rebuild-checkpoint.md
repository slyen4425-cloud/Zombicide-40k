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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation de l'état global et IA routée par ce même chemin global.
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
- premières actions de capacités dynamiques : `34681748038` success
- capture complète en combat sauvage : `34681864744` success
- première IA dynamique dédiée : `34681979266` success
- PV/dégâts/soins/KO : `34682075802` success
- flux post-KO / remplacement forcé : `34682302866` success
- post-KO automatique après action : `34682441521` success
- état global Capture après capacité : `34682576122` success
- IA Capture routée par état global : `34682681387` success

## Dernière étape terminée

IA Capture routée par le même chemin global que le joueur :
- nouvelle opération publique `runCaptureAiStep()` dans `capture.js` ;
- la décision IA reste fournie par `chooseCaptureAiAction()` ;
- lorsqu'elle choisit une capacité, l'IA appelle désormais `useCaptureBattleAbility()` avec `side:'opponent'` et `targetSide:'player'` ;
- dégâts, consommation de charge, KO, remplacement forcé, synchronisation `activeTeam` / `roster` et fin de combat utilisent donc exactement la même chaîne autoritaire que les actions joueur ;
- un déplacement IA continue d'utiliser le moteur spatial dédié, puis met à jour uniquement `battle` dans l'état global ;
- une décision `wait` conserve également l'état global sans effet parasite ;
- aucune logique de résolution parallèle spécifique à l'IA n'est introduite dans `capture.js`.

Régression :
- nouveau `v2/tests/capture-global-ai-path.test.mjs` ;
- couvre une attaque IA qui met la créature joueur KO et vérifie le remplacement forcé + la synchronisation roster ;
- couvre une IA hors portée qui se déplace sans consommer sa capacité et sans modifier équipe/roster ;
- batterie complète V2 : `34682681387` success.

Commits de l'étape :
- routage IA vers l'état global : `156bc7e13ea898f3cb3647020bf60aa7db60c8c1`
- régression chemin IA global : `be3b43fbe5fa3d100f3f122f2dc62a0f1ba025e5`

## Priorités ouvertes

1. prochaine étape Capture : introduire un premier moteur générique de statuts/conditions dans le runtime dynamique (durée/cumul/effets déclaratifs), sans copier le moteur RPG ;
2. ensuite brancher une première esquive/réaction tactique configurable sur ce socle ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
