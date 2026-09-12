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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, moteur générique de statuts/conditions et tick global explicite des statuts.
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
- moteur générique statuts/conditions : `34682807731` success
- tick global explicite des statuts : `34682889435` success

## Dernière étape terminée

Tick global explicite des statuts Capture :
- nouveau `v2/src/modes/capture/status-tick.js` ;
- `tickCaptureBattleStatuses()` fait avancer explicitement les statuts des deux combattants en une seule opération ;
- le tick renvoie séparément les statuts expirés côté joueur et côté adversaire ;
- aucune cadence temps réel n'est fixée : l'appel reste entièrement explicite ;
- nouveau `v2/src/modes/capture/status-runtime.js` ;
- `tickCaptureModeStatuses()` applique le tick au `battle` global puis synchronise les statuts de la créature active joueur vers `activeTeam` et `roster` ;
- la réserve reste intacte ;
- l'exploration reste bloquée tant que le combat existe ;
- un appel sans combat actif est refusé avec `battle-missing` ;
- aucun effet périodique n'est automatiquement exécuté à cette étape : le tick gère uniquement durée/expiration/synchronisation.

Régression :
- nouveau `v2/tests/capture-status-tick-global.test.mjs` ;
- couvre diminution de durée des deux côtés, expiration séparée, synchronisation vers équipe/roster, second tick supprimant le dernier statut joueur et refus hors combat ;
- batterie complète V2 : `34682889435` success.

Commits de l'étape :
- tick combat statuts : `dacac881747f90c8febf096db936d31cb24486d5`
- synchronisation état global : `a96f979f74bcc32a13dd4bb4b0a8dffcf5167d42`
- régression tick global : `1f5b2eab7b75400783ba511f16bf42ebf25c8e2f`

## Priorités ouvertes

1. prochaine étape Capture : brancher une première résolution générique des effets périodiques de statut lors d'un tick explicite (dégâts/soins déclaratifs), toujours sans cadence temps réel figée ;
2. ensuite ajouter une première esquive/réaction tactique configurable ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
