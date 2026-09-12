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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite, pas temporel unifié réactions + cooldowns + statuts, scheduler abstrait et driver externe abstrait.
- Le point d'entrée public recommandé de Capture est `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()` est l'opération temporelle canonique, `advanceCaptureScheduler()` l'orchestrateur du scheduler et `advanceCaptureDriver()` l'entrée canonique pour injecter un delta externe.
- Le scheduler et le driver ne créent aucun timer : pas de `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now` ni cadence temps réel implicite.
- Les anciens helpers temporels séparés restent disponibles dans leurs modules bas niveau pour régressions/maintenance, mais ne sont pas exposés par la façade publique.
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
- effets périodiques dégâts/soins sur tick explicite : `34683019572` success
- premier socle réaction/esquive configurable : `34683114512` success
- réactions configurables routées par joueur + IA : `34683246425` success
- politique d'esquive data-driven : `34683578020` success
- coût/cooldown de réaction par instance : `34683977742` success
- fenêtre temporelle explicite de réaction : `34684261793` success
- progression globale horloge réaction : `34684443173` success
- pas temporel unifié Capture : `34684569147` success
- façade publique canonique Capture : `34684749829` success
- scheduler abstrait Capture : `34684871523` success
- driver externe abstrait Capture : `34685018724` success

## Dernière étape terminée

Premier driver externe abstrait Capture :
- nouveau `v2/src/modes/capture/driver.js` ;
- contrat `CAPTURE_DRIVER_CONTRACT` : horloge externe requise, aucune boucle temps réel possédée par le runtime, aucune cadence fixe ;
- état du driver limité à `status`, `frames` et `totalDelta` ;
- états explicites : `stopped`, `running`, `paused` ;
- opérations : `startCaptureDriver()`, `pauseCaptureDriver()`, `resumeCaptureDriver()`, `stopCaptureDriver()` ;
- `advanceCaptureDriver()` est exposé par `runtime.js` et injecte exclusivement `advanceCaptureScheduler()` dans le driver bas niveau ;
- le driver transmet uniquement le delta fourni par l'appelant ; il ne lit aucune horloge système et ne déclenche aucune boucle de lui-même ;
- à l'arrêt ou en pause, le delta reçu est ignoré : aucun reliquat scheduler, cooldown, statut, PV ou horloge de combat ne progresse ;
- après reprise, les deltas futurs repartent à partir de l'état scheduler conservé ;
- `frames` et `totalDelta` ne comptent que les injections reçues pendant l'état `running` ;
- aucun `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now`, milliseconde, FPS ou cadence finale n'est imposé.

Régression :
- nouveau `v2/tests/capture-driver.test.mjs` ;
- couvre driver arrêté sans mutation ;
- couvre démarrage puis accumulation d'un delta insuffisant ;
- couvre pause sans accumulation du delta reçu ;
- couvre reprise avec consommation du reliquat scheduler ;
- couvre arrêt après progression sans nouvelle mutation ;
- vérifie statiquement l'absence d'horloge/timer navigateur dans `driver.js` ;
- premier run `34684985821` en échec uniquement parce que le test attendait `null` alors que l'horloge non initialisée est `undefined` ;
- attente corrigée sans modification du runtime ;
- batterie complète corrigée : `34685018724` success.

Commits de l'étape :
- driver externe abstrait : `30010d42c0b7626a29046a12f0b30e1ae0c7c020`
- raccord façade publique : `629497a4bcea99dfb5dbe768d970fd1249f4c3ab`
- régression driver : `4d7c92715ace4f3e19ab8b963f95a70b69c82aa0`
- correction attente test : `9410c6c318077243087a91492def79b00de67057`

## Priorités ouvertes

1. prochaine étape Capture : définir la première couche d'adaptation UI/app autour du driver (start/pause/resume/stop selon cycle de vie du combat), sans choisir encore la fréquence réelle ni créer de timer automatique ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
