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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite, pas temporel unifié, scheduler abstrait, driver externe abstrait, cycle de vie UI/app, événements UI non bloquants et feed visuel borné.
- Le point d'entrée public recommandé de Capture est `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()`, `advanceCaptureScheduler()` et `advanceCaptureDriver()` forment le chemin temporel canonique.
- Le temps visuel des notices est séparé du temps gameplay : aucune notice ne fait avancer le combat, les cooldowns ou les statuts.
- Les visuels Capture validés ne sont pas encore importés physiquement ; registre `pending_import` sous cible `v2/assets/capture/creatures/`.
- Les 4 orbes legacy reconnues sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients restent non inventés.
- Le combat Capture reste indépendant du `turnSequence`/D100 RPG.

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
- effets périodiques dégâts/soins : `34683019572` success
- premier socle réaction/esquive configurable : `34683114512` success
- réactions joueur + IA : `34683246425` success
- politique d'esquive data-driven : `34683578020` success
- coût/cooldown de réaction par instance : `34683977742` success
- fenêtre temporelle explicite de réaction : `34684261793` success
- progression globale horloge réaction : `34684443173` success
- pas temporel unifié Capture : `34684569147` success
- façade publique canonique Capture : `34684749829` success
- scheduler abstrait Capture : `34684871523` success
- driver externe abstrait Capture : `34685018724` success
- cycle de vie UI/app : `34685171946` success
- adaptateur d’événements UI : `34685389994` success
- dispatcher/feed UI non bloquant : `34685525379` success
- politique limite/expiration visuelle du feed : `34685743307` success

## Dernière étape terminée

Politique de limite/expiration visuelle des notices Capture :
- nouveau `v2/src/modes/capture/ui-notice-feed.js` ;
- contrat `CAPTURE_UI_NOTICE_FEED_CONTRACT` : présentation uniquement, temps visuel indépendant du gameplay, aucune cadence temps réel imposée ;
- `createCaptureUiNoticeFeed()` crée un feed borné, `maxVisible=6` par défaut pour la vue mobile ;
- `appendCaptureUiNotices()` conserve uniquement les dernières notices selon cette limite ;
- l’expiration est configurable via `expireAfterVisualTime` et reste désactivée par défaut (`null`) tant qu’aucune durée visuelle n’est choisie ;
- `advanceCaptureUiNoticeVisualTime()` fait progresser uniquement l’horloge visuelle du feed ;
- aucune utilisation de `advanceCaptureTime`, `advanceCaptureDriver`, `setInterval`, `requestAnimationFrame`, `Date.now` ou `performance.now` dans cette couche ;
- `capture-page.js` utilise désormais ce feed au lieu d’une liste illimitée ;
- la page expose `advanceNoticeVisualTime()` pour qu’un futur driver purement UI puisse faire expirer les notices sans toucher au combat ;
- le premier run `34685720075` a échoué uniquement sur un ancien test trop figé sur l’appel `dispatchCaptureUiEvents(...,renderNotice)` ; le garde a été mis à jour pour vérifier le nouveau flux dispatcher -> feed borné ;
- batterie complète corrigée : `34685743307` success.

Commits de l'étape :
- feed visuel : `38a8d5b7b30de8d172cd38ecb852a2722c4275f3`
- normalisation feed corrigée : `822ec80a8e9986bcfdfed11d6ac3ba5b130369a9`
- façade runtime : `28311af58274e6e265bd8063a3b03c906214e2e5`
- page Capture : `68697cd7ccda98ca3c5c0c1ecdf67fa62ebf71b3`
- régression feed : `a576b8f4fde6ce8014c9ab499fcccde7e5c8078d`
- mise à jour ancien garde dispatcher : `14e4c0043b6c579df12a1453a3aacb49cbacd2d9`

## Priorités ouvertes

1. prochaine étape Capture : définir un premier driver d’horloge **strictement visuel/UI** pour les notices, sans le coupler au temps gameplay et sans choisir encore de fréquence finale ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
