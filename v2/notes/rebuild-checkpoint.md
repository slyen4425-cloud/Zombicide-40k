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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite, pas temporel unifié réactions + cooldowns + statuts et premier scheduler abstrait externe.
- Le point d'entrée public recommandé de Capture est `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()` est l'opération temporelle canonique et `advanceCaptureScheduler()` l'orchestrateur public du scheduler.
- Le scheduler ne crée aucun timer : pas de `setInterval`, `requestAnimationFrame`, `Date.now` ni cadence temps réel implicite. Le delta vient obligatoirement d'un driver externe futur.
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

## Dernière étape terminée

Premier scheduler abstrait Capture :
- nouveau `v2/src/modes/capture/scheduler.js` ;
- contrat `CAPTURE_SCHEDULER_CONTRACT` : driver externe requis, aucune fréquence temps réel figée, aucune boucle navigateur créée en interne ;
- `createCaptureSchedulerState()` conserve seulement `accumulated`, `steps` et `running` ;
- `setCaptureSchedulerRunning()` permet pause/reprise explicites ;
- `pushCaptureSchedulerDelta()` accumule un delta externe, le découpe selon un `stepSize` fourni et n'exécute que le nombre de pas possible/autorisé ;
- le scheduler bas niveau est driver-agnostic et exige une fonction `advance`, ce qui évite une dépendance circulaire avec la façade publique ;
- `runtime.js` expose `advanceCaptureScheduler()` et injecte exclusivement `advanceCaptureTime()` comme fonction d'avance canonique ;
- `maxSteps` permet de plafonner le rattrapage d'un gros delta sans perdre le reliquat accumulé ;
- si le combat se termine pendant un pas (ex. KO par effet périodique), la boucle s'arrête immédiatement et conserve le delta restant ;
- scheduler en pause : aucun temps, cooldown, statut ou PV ne bouge ;
- aucun `setInterval`, `requestAnimationFrame`, `Date.now`, milliseconde, FPS ou cadence finale n'est imposé.

Régression :
- nouveau `v2/tests/capture-scheduler.test.mjs` ;
- couvre accumulation insuffisante puis rattrapage sur plusieurs pas ;
- couvre pause sans mutation ;
- couvre `maxSteps` avec reliquat ;
- couvre arrêt immédiat après KO adverse et nettoyage combat/rencontre ;
- vérifie statiquement l'absence de timer navigateur/horloge implicite dans `scheduler.js` ;
- batterie complète : `34684871523` success.

Commits de l'étape :
- premier scheduler : `7588fa357eccfc46c94d71533fce18926024d690`
- scheduler rendu driver-agnostic : `70af9b34ba7de740d07c947254c649659d927eb0`
- raccord façade publique : `fd4d470d44e6e25da33d7455e3a83331bd72ca1a`
- régression scheduler : `e6d012c667a2af487707178abe9c6bcb567e5cb4`

## Priorités ouvertes

1. prochaine étape Capture : définir le premier contrat de cadence/driver externe autour du scheduler (start/stop/push delta), sans choisir encore secondes/FPS ni créer de timer réel ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
