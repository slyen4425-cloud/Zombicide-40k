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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre et moteur configurable de tentative de capture.
- Les visuels Capture validés ne sont pas encore importés physiquement ; registre `pending_import` sous cible `v2/assets/capture/creatures/`.
- Les 4 orbes legacy reconnues sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients restent non inventés.
- Le combat Capture cible un runtime dédié et dynamique : aucun `turnSequence`/D100 RPG.

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

## Dernière étape terminée

Contrat du futur combat dynamique Capture :
- nouveau `v2/docs/capture-dynamic-combat-contract.json` ;
- runtime cible `dedicated_capture_dynamic_runtime`, sans moteur de tours RPG, sans `turnSequence`, sans timeline D100 ;
- un combat sauvage part d’une rencontre active, exige une créature active côté joueur et crée un acteur adverse dédié ;
- l’état d’exploration est suspendu mais pas détruit pendant le combat ;
- sorties prévues : KO adverse, capture réussie, fuite, équipe joueur indisponible ;
- une capture réussie termine le combat sauvage et renvoie vers l’exploration ;
- une créature active par camp par défaut, choisie dans l’équipe active ; changement de créature autorisé sans fusion d’instances ;
- déplacement, positionnement et portée utilisent le Core spatial neutre ; aucun état de combat RPG ;
- esquive/positionnement attendus mais formule exacte non figée ;
- capacités Capture : charges par instance, coûts, cooldowns et portée par capacité supportés ;
- tentative de capture autorisée pendant le combat sauvage via le moteur Capture existant ; succès => nouvelle instance possédée, surplus => réserve ;
- VS IA et VS joueur restent des cibles supportées ; logique IA, synchronisation réseau et cadence temps réel restent explicitement `future_design_not_frozen` ;
- test `v2/tests/capture-dynamic-combat-contract.test.mjs` verrouille ces frontières et empêche une réintroduction du moteur RPG.

Commits de l’étape :
- contrat combat dynamique : `c094a117abccb72f56802dfed0c83d1a71047b7a`
- régression contrat combat dynamique : `68a45e7ff69b1fc96e75433715e3940b2c776e80`

CI fonctionnelle de l’étape : `34681468819` success.

## Priorités ouvertes

1. prochaine étape Capture : créer le premier squelette runtime du combat dynamique à partir de ce contrat, sans implémenter encore les timings finaux ni l’IA complète ;
2. brancher ensuite la tentative de capture et les changements de créature sur ce runtime ;
3. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
4. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
