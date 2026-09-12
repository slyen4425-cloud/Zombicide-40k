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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite et pas temporel unifié réactions + cooldowns + statuts.
- Le point d'entrée public recommandé de Capture est désormais `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()` est l'opération temporelle canonique.
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

## Dernière étape terminée

Façade publique canonique Capture :
- nouveau `v2/src/modes/capture/runtime.js` ;
- cette façade devient le point d'entrée recommandé du mode pour le runtime applicatif ;
- elle expose les opérations principales Capture sans exposer les anciens helpers temporels séparés ;
- nouvelle opération publique canonique `advanceCaptureTime(state,options)` ;
- `advanceCaptureTime()` délègue au runtime temporel unifié `advanceCaptureModeTime()` et fait donc avancer via un seul chemin l'horloge de réaction, les cooldowns et les statuts/effets périodiques ;
- `advanceCaptureBattleTime` et `tickCaptureBattleReactionCooldowns` restent dans `capture.js` uniquement pour compatibilité/régressions, mais ne sont pas exportés par la façade canonique ;
- `capture-page.js` importe désormais `createCaptureModeState` depuis `runtime.js`, ce qui fait passer l'entrée UI Capture par la façade officielle ;
- aucune cadence temps réel, frame ou i-frame n'est figée ;
- aucun moteur RPG/D100/timeline n'est introduit.

Régression :
- nouveau `v2/tests/capture-public-runtime.test.mjs` ;
- vérifie que `advanceCaptureTime()` est exposé ;
- vérifie que les anciens helpers temporels séparés ne sont pas exposés par la façade ;
- vérifie qu'un pas public fait réellement avancer horloge + cooldowns + dégâts périodiques + durée de statut ;
- batterie complète : `34684749829` success.

Commits de l'étape :
- façade publique Capture : `f2af3ca683c9168acd4a87f0b9ae3dbf884a547e`
- page Capture routée par façade : `802897617f577893eed0e80a423ac9e43fefa3df`
- régression façade publique : `1e2b0776b32577cfed1fe06d351791a5bcfdd13d`

## Priorités ouvertes

1. prochaine étape Capture : définir le premier contrat de boucle dynamique/ordonnancement autour de `advanceCaptureTime()` sans choisir encore une fréquence réelle ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
