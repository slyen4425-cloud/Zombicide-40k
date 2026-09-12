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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance.
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

## Dernière étape terminée

Biomes, rencontres sauvages et première boucle d’exploration libre :
- nouveau `v2/src/modes/capture/encounters.js` ;
- biomes configurables avec `tags`, `elementTags` et table de créatures par `spawnPercent` ;
- validation stricte 0–100 % et total <=100 %, sans inventer de pourcentages ;
- validation des `speciesId` contre la bibliothèque canonique Capture ;
- les espèces legacy/non canoniques restent refusées ;
- une salle World Builder peut déclarer `metadata.captureBiomeId` ;
- `enterCaptureRoom()` met à jour `exploration.currentRoomId`, résout le biome et fait le tirage sauvage ;
- le reliquat jusqu’à 100 % produit simplement `no-encounter` ;
- une rencontre active bloque un nouveau tirage jusqu’à `clearCaptureEncounter()` ;
- aucune bataille n’est créée automatiquement : `battle` reste `null` en attendant le vrai moteur dynamique ;
- clé stockage biomes ajoutée sous `gensrpg:v2:capture:*` ;
- test `v2/tests/capture-exploration-encounters.test.mjs` couvre biomes, pourcentages, espèces canoniques, salles World Builder, tirage déterministe, blocage des rencontres empilées et absence de runtime RPG.

Commits de l’étape :
- moteur biomes/rencontres : `4527d984a31050a581a3f97c28a6b2e8145633f1`
- branchement exploration Capture : `b12fd464f24f931eaa72cf280c811a9bdaccfaec`
- régression exploration/rencontres : `416177913b0e0215c4cdb74701a66cda454823cc`

CI fonctionnelle de l’étape : `34681280023` success.

## Priorités ouvertes

1. prochaine étape Capture : construire le calcul de tentative de capture autour du taux propre à l’espèce, du seuil <30 % PV et des orbes, avec coefficients configurables/non inventés ;
2. ensuite commencer le contrat précis du combat dynamique Capture (entrée/sortie, créature active, déplacement/portée/esquive/changement), sans reprendre le moteur RPG ;
3. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
4. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
