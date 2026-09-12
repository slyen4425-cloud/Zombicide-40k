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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite, pas temporel unifié, scheduler abstrait, driver externe abstrait, cycle de vie UI/app et couche d'événements UI présentationnelle.
- Le point d'entrée public recommandé de Capture est `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()`, `advanceCaptureScheduler()` et `advanceCaptureDriver()` forment le chemin temporel canonique.
- Le scheduler, le driver et la couche UI/app ne créent aucun timer : pas de `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now` ni cadence temps réel implicite.
- Les événements UI ne recalculent aucune règle gameplay : ils sont dérivés exclusivement des résultats autoritaires du moteur Capture.
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
- cycle de vie UI/app du combat Capture : `34685171946` success
- couche d'événements UI Capture : `34685389994` success

## Dernière étape terminée

Première couche d'événements UI du combat Capture :
- nouveau `v2/src/modes/capture/ui-events.js` ;
- contrat `CAPTURE_UI_EVENT_CONTRACT` : présentation uniquement, aucune mutation gameplay, événements dérivés des résultats autoritaires ;
- `captureUiEventsFromResult()` traduit un résultat moteur unique ; `captureUiEventsFromResults()` agrège une séquence de résultats ;
- événements couverts à ce stade : `reaction_triggered`, `status_applied`, `status_periodic_effect`, `status_expired`, `ko`, `forced_switch`, `team_unavailable` ;
- une esquive/réaction est lue depuis le résultat de résolution déjà produit ; aucune chance ou règle n'est recalculée dans la couche UI ;
- les statuts appliqués sont lus depuis l'outcome de capacité ; les effets périodiques/expirations sont lus depuis `statusTick` ;
- les KO/remplacements sont lus depuis `koOutcome`, `previousInstanceId` et `activeInstanceId` ;
- `createCaptureAppSession()` possède maintenant une file `uiEvents` ;
- `advanceCaptureBattleSession()` ajoute automatiquement les événements produits par les ticks temporels ;
- `consumeCaptureUiEvents()` retourne puis vide la file sans toucher à l'état de combat ;
- `runtime.js` expose le contrat et les adaptateurs UI comme partie de la façade publique ;
- aucune logique RPG/D100/timeline n'est introduite.

Régression :
- nouveau `v2/tests/capture-ui-events.test.mjs` ;
- couvre réaction/esquive annulant un effet ;
- couvre application de statut ;
- couvre effet périodique + expiration ;
- couvre KO joueur + remplacement forcé ;
- couvre intégration réelle lifecycle : brûlure adverse -> KO -> fin combat -> événements mis en file -> consommation ;
- batterie complète : `34685389994` success.

Commits de l'étape :
- adaptateur événements UI : `327a6f6f091075760d88aab6bb44c984a8e39daf`
- file d'événements lifecycle : `1170af84169adf300f8b1b5e43e7db7ba2905f4f`
- façade runtime UI : `29cddbae5238ea8c516ecfd0b796d1f8a7271ff7`
- régression événements UI : `0fee88ff1deaaa4fb76d283ef96a9ad8e0c29278`

## Priorités ouvertes

1. prochaine étape Capture : brancher une première file/dispatcher UI consommable par `capture-page.js` pour afficher les événements sans bloquer ni modifier le gameplay ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
