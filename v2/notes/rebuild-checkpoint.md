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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, effets périodiques, réactions/esquive configurables, politique d'esquive data-driven, coût/cooldown par instance, fenêtre temporelle explicite, pas temporel unifié, scheduler abstrait, driver externe abstrait, cycle de vie UI/app et première couche d’événements UI non bloquants.
- Le point d'entrée public recommandé de Capture est `v2/src/modes/capture/runtime.js` ; `advanceCaptureTime()`, `advanceCaptureScheduler()` et `advanceCaptureDriver()` forment le chemin temporel canonique.
- Le scheduler, le driver et la couche UI/app ne créent aucun timer : pas de `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now` ni cadence temps réel implicite.
- Les événements de combat destinés à l’UI sont dérivés des résultats autoritaires puis consommés par `capture-page.js` sans modifier le gameplay ni mettre le combat en pause.
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
- adaptateur d’événements UI Capture : `34685389994` success
- dispatcher/feed UI non bloquant : `34685525379` success

## Dernière étape terminée

Dispatcher UI non bloquant du combat Capture :
- nouveau `v2/src/modes/capture/ui-dispatcher.js` ;
- contrat `CAPTURE_UI_DISPATCHER_CONTRACT` : présentation uniquement, aucune mutation gameplay, aucun blocage, aucune pause du combat ;
- `captureUiNoticeFromEvent()` transforme les événements autoritaires connus en messages UI ;
- `dispatchCaptureUiEvents()` envoie ces notices vers un sink de présentation sans toucher à l’état de combat ;
- `runtime.js` expose le dispatcher comme partie de la façade Capture officielle ;
- `capture-page.js` contient désormais un feed `[data-capture-combat-feed]` avec `aria-live="polite"` ;
- après chaque `advance()`, la page consomme `session.uiEvents`, les transforme en notices et les rend dans le feed ;
- l’UI conserve également une copie locale `notices` consultable pour tests/présentation ;
- aucun `alert`, `confirm`, popup modale ou appel à `setCaptureBattleBlocking()` n’est déclenché par ce dispatcher ;
- aucune fréquence/timer navigateur n’a été ajouté.

Régression :
- nouveau `v2/tests/capture-ui-dispatcher.test.mjs` ;
- vérifie que toutes les notices sont `blocking:false` ;
- vérifie que les événements source ne sont pas mutés ;
- vérifie réaction/esquive, statut appliqué, effet périodique, expiration, KO et remplacement ;
- vérifie que la page consomme puis dispatch les événements vers le feed `aria-live` ;
- vérifie l’absence de `alert`, `confirm`, `setInterval` et de pause automatique dans le flush UI ;
- batterie complète : `34685525379` success.

Commits de l'étape :
- dispatcher UI : `eb8491872cbd8c32e8c742dc5d557c89914839f3`
- façade runtime : `ac0a5bbfda754d77af2996dfd54e989f89641763`
- page Capture / feed : `d3d163181f0ef415a3544b8a4fc5dedbf536e1c8`
- régression dispatcher : `fd8a1f2608caa15051835be4d7ba04ea09bfc0af`

## Priorités ouvertes

1. prochaine étape Capture : enrichir ce feed avec une première politique de durée/limite d’affichage des notices, sans imposer de timer gameplay ni bloquer le combat ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
