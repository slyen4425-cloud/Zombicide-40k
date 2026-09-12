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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite, pas temporel unifié, scheduler abstrait, driver externe abstrait et désormais cycle de vie UI/app du combat.
- Le point d'entrée public recommandé de Capture est `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()`, `advanceCaptureScheduler()` et `advanceCaptureDriver()` forment le chemin temporel canonique.
- Le scheduler, le driver et la couche UI/app ne créent aucun timer : pas de `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now` ni cadence temps réel implicite.
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
- cycle de vie UI/app du combat Capture : `34685171946` success

## Dernière étape terminée

Cycle de vie UI/app du combat Capture :
- nouveau `v2/src/modes/capture/app-lifecycle.js` ;
- contrat `CAPTURE_APP_LIFECYCLE_CONTRACT` : démarrage du driver avec le combat, pause sur écran bloquant, reprise après déblocage, arrêt dès que le combat se termine ;
- `createCaptureAppSession()` regroupe `state`, `scheduler`, `driver` et le flag `blocking` ;
- `beginCaptureBattleSession()` démarre le combat puis passe automatiquement le driver à `running` ;
- `setCaptureBattleBlocking()` met le driver en `paused` ou le remet en `running` sans faire avancer le temps pendant le blocage ;
- `advanceCaptureBattleSession()` passe uniquement par `advanceCaptureDriver()` ; si un KO/effet périodique termine le combat, le driver passe automatiquement à `stopped` dans le même flux ;
- `finishCaptureBattleSession()` arrête également le driver lors d'une fin explicite (`flee`, etc.) ;
- `runtime.js` expose cette couche comme façade applicative officielle ;
- `capture-page.js` crée maintenant une session Capture réelle et expose `beginBattle`, `setBlocking`, `advance`, `finishBattle` ;
- `dispose()` arrête le driver avant de démonter la page ;
- aucun timer navigateur ni fréquence réelle n'est encore choisi.

Régression :
- nouveau `v2/tests/capture-app-lifecycle.test.mjs` ;
- couvre `stopped -> running` au démarrage du combat ;
- couvre `running -> paused` sur UI bloquante sans progression temporelle ;
- couvre reprise et progression réelle via le scheduler/driver canoniques ;
- couvre fin explicite avec retour exploration et driver arrêté ;
- couvre KO adverse par statut pendant l'avance avec arrêt automatique du driver ;
- vérifie que `capture-page.js` utilise la couche lifecycle et ne crée aucun timer ;
- batterie complète : `34685171946` success.

Commits de l'étape :
- couche lifecycle app : `178f556fa6e3755912956c42dfb41bd0cf559f66`
- façade runtime lifecycle : `9187c46140a882bc9aee0ca3b999a2bb47d637c2`
- page Capture raccordée : `82fae9131aec93773ae7b38dfb9355d0321a7ceb`
- régression lifecycle : `bcf5f1249542d813e1e67d7402fbda4945a1234c`

## Priorités ouvertes

1. prochaine étape Capture : définir la première politique d'événements UI du combat dynamique (notifications de réaction, statut, KO, remplacement) à partir des résultats déjà produits, sans créer de logique gameplay parallèle ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
