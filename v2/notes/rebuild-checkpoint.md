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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres et première boucle d’exploration libre.
- Les visuels Capture validés ne sont pas encore importés physiquement ; registre `pending_import` sous cible `v2/assets/capture/creatures/`.
- Les 4 orbes legacy reconnues sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients restent non inventés.
- Le futur combat Capture reste dédié et dynamique : aucun `turnSequence`/D100 RPG.

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

## Dernière étape terminée

Calcul réel et configurable de tentative de capture :
- nouveau `v2/src/modes/capture/capture-attempt.js` ;
- calcul basé sur `speciesCaptureRate × orbCoefficient × lowHpMultiplier` ;
- le taux d’espèce est obligatoire et reste fourni par les données Capture ;
- le seuil bas PV est strictement `< 30 %` : à exactement 30 %, aucun bonus ;
- l’orbe est résolue uniquement via la bibliothèque Capture ;
- si le coefficient d’orbe n’est pas encore validé, la tentative est bloquée avec `pending_orb_coefficient` et aucun tirage n’a lieu ;
- si le bonus bas PV est requis mais son multiplicateur n’est pas configuré, la tentative est bloquée avec `pending_low_hp_multiplier` ;
- aucune valeur legacy inconnue n’est inventée ;
- chance finale bornée entre 0 et 100 % ;
- `resolveCaptureAttempt()` permet un tirage déterministe/testable et ne dépend d’aucune logique combat RPG ;
- test `v2/tests/capture-attempt.test.mjs` couvre taux, orbes configurées, seuil 29/30 %, coefficients pending et succès/échec déterministes.

Commits de l’étape :
- moteur tentative de capture : `14a9aac203562a4f17de83aeb6711fedeb64e550`
- régression tentative de capture : `c5bdc0f47fee2eaf6d04a3366bef2cbf863ce345`

CI fonctionnelle de l’étape : `34681385329` success.

## Priorités ouvertes

1. prochaine étape Capture : définir le contrat précis du combat dynamique dédié (entrée/sortie, créature active, déplacement/portée/esquive/changement), sans reprendre le moteur RPG ni figer encore le timing temps réel ;
2. ensuite brancher la tentative de capture au runtime de rencontre/combat lorsque ce runtime dédié existe ;
3. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
4. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
