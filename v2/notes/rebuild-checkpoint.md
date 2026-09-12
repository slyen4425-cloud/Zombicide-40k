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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat et capture complète en combat sauvage.
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

## Dernière étape terminée

Tentative de capture complète branchée au combat sauvage :
- `createCaptureModeState()` possède maintenant un inventaire Capture isolé ;
- `consumeCaptureItem()` peut résoudre une bibliothèque d’orbes configurée, ce qui permet de tester/utiliser des coefficients validés sans modifier la bibliothèque legacy encore en `pending` ;
- nouveau `attemptCaptureInBattle()` dans `capture.js` ;
- la capture est refusée hors combat sauvage actif et vérifie que l’espèce de la rencontre correspond bien à l’adversaire du combat ;
- le moteur `resolveCaptureAttempt()` reste l’autorité du calcul : taux d’espèce, coefficient d’orbe, bonus strictement sous 30 % PV ;
- si un coefficient nécessaire est encore `pending`, la tentative est bloquée avant consommation et l’inventaire reste intact ;
- une tentative valide consomme exactement une orbe, qu’elle réussisse ou échoue ;
- en cas d’échec, le combat et la rencontre restent actifs ;
- en cas de succès, une nouvelle instance possédée est créée avec un `instanceId` unique, l’espèce rencontrée, son niveau disponible et son état PV fourni ;
- si l’équipe active contient moins de 6 créatures, la nouvelle capture la rejoint ; sinon elle part en réserve ;
- le roster est recomposé sans fusionner les captures existantes ;
- un succès termine le combat avec `capture_success`, nettoie la rencontre et rend l’exploration libre.

Régression :
- nouveau `v2/tests/capture-wild-battle-capture.test.mjs` ;
- couvre succès vers équipe active, succès vers réserve quand l’équipe est pleine, échec consommant l’orbe mais conservant le combat, et coefficient `pending` bloquant sans aucune consommation ;
- aucune dépendance RPG/D100/timeline n’est introduite.

Commits de l’étape :
- inventaire avec bibliothèque d’orbes configurée : `10f57b4638bff7914efa1ccbc21b2b4e736983de`
- capture complète branchée au combat : `c80f8830cf80955ee9e56e5bb0c9171be3a78de6`
- régression combat/capture : `1474ddb5e5026634e581fa8d1551543628e6db48`

CI fonctionnelle de l’étape : `34681864744` success.

## Priorités ouvertes

1. prochaine étape Capture : construire une première IA dédiée au runtime dynamique, sans reprendre l’IA/timeline RPG ;
2. ensuite définir progressivement les résolutions concrètes de dégâts/soins/statuts/esquive sans figer trop tôt la cadence temps réel ;
3. compléter progressivement les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
