# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné et maintenant driver visuel UI isolé.
- Le temps visuel des notices est séparé du temps gameplay : il ne fait jamais avancer combat, cooldowns, statuts ou PV.
- Aucun driver Capture ne choisit encore de cadence finale réelle.
- Les visuels Capture validés restent `pending_import` sous `v2/assets/capture/creatures/`.
- Les 4 orbes reconnues restent `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; coefficients non inventés.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu’à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu’à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed borné/expiration visuelle : `34685743307` success
- driver visuel UI isolé : `34685863477` success

## Dernière étape terminée

Driver d’horloge purement visuel/UI des notices Capture :
- nouveau `v2/src/modes/capture/ui-visual-driver.js` ;
- contrat `CAPTURE_UI_VISUAL_DRIVER_CONTRACT` : présentation uniquement, indépendant du driver gameplay, aucun timer réel détenu, aucune cadence fixe, horloge visuelle externe requise ;
- état explicite `stopped/running/paused`, avec `frames` et `totalVisualDelta` propres à l’UI ;
- opérations `startCaptureUiVisualDriver()`, `pauseCaptureUiVisualDriver()`, `resumeCaptureUiVisualDriver()`, `stopCaptureUiVisualDriver()` ;
- `advanceCaptureUiVisualDriver()` est exposé par `runtime.js` et ne fait qu’injecter un delta dans `advanceCaptureUiNoticeVisualTime()` ;
- `capture-page.js` possède désormais son propre visual driver, indépendant du driver de combat, avec méthodes `startNoticeVisualClock`, `pauseNoticeVisualClock`, `resumeNoticeVisualClock`, `stopNoticeVisualClock`, `advanceNoticeVisualTime` ;
- à l’arrêt ou en pause, aucun delta visuel n’est consommé ;
- un delta visuel peut faire expirer une notice sans modifier l’état gameplay ;
- aucun `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now`, `advanceCaptureDriver` ou `advanceCaptureTime` dans ce driver visuel ;
- batterie complète : `34685863477` success.

Commits de l’étape :
- driver visuel UI : `5aa99089f12fa766134a5aec6f82110b846a8563`
- façade runtime : `1809ce59bf5b884e061d1a5649d5efecbd72bc55`
- page Capture : `71386e2176a923c124c377b644af8d81a699d700`
- régression : `c170abc88088dda9266e30be70fecb1d89290a7f`

## Priorités ouvertes

1. prochaine étape Capture : définir l’adaptateur d’horloge UI/app qui fournit des deltas au visual driver lors du montage/affichage de la page, sans encore fixer la fréquence réelle ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
