# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur d’horloge visuelle externe et source d’horloge injectable au montage de la page.
- Le temps visuel des notices est séparé du temps gameplay : il ne fait jamais avancer combat, cooldowns, statuts ou PV.
- Aucun driver/source Capture ne choisit encore de cadence finale réelle ni d’API navigateur imposée.
- Les visuels Capture validés restent `pending_import` sous `v2/assets/capture/creatures/`.
- Les 4 orbes reconnues restent `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; coefficients non inventés.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu’à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu’à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed borné/expiration visuelle : `34685743307` success
- driver visuel UI isolé : `34685863477` success
- adaptateur d’horloge visuelle externe : `34686140413` success
- source d’horloge visuelle injectable : `34686275777` success

## Dernière étape terminée

Source d’horloge UI/app injectable au montage de la page Capture :
- nouveau `v2/src/modes/capture/ui-visual-clock-source.js` ;
- contrat `CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT` : présentation uniquement, source injectée, abonnement/désabonnement obligatoires, aucune cadence fixe, aucune API navigateur détenue, aucune mutation gameplay ;
- `attachCaptureUiVisualClockSource(source,onSample)` exige `source.subscribe(handler)` et une fonction de désabonnement ;
- l’attachement garantit un `detach()` idempotent pour éviter les doubles désabonnements ;
- `runtime.js` expose ce contrat et l’attachement dans la façade officielle Capture ;
- `mountCapturePage()` accepte désormais `visualClockSource` ;
- si une source est fournie, la page démarre automatiquement son cycle visuel puis s’abonne aux samples de la source ;
- chaque sample reçu passe uniquement par `sampleNoticeVisualClock()` et donc par le visual driver/adapter déjà validés ;
- `dispose()` appelle d’abord le désabonnement de la source, puis arrête/nettoie le driver, l’adaptateur et le feed ;
- aucune utilisation de `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now`, `advanceCaptureTime` ou `advanceCaptureDriver` dans cette source.

Régression :
- nouveau `v2/tests/capture-ui-visual-clock-source.test.mjs` ;
- couvre abonnement, réception de samples, désabonnement unique/idempotent, erreurs d’interface source incomplète et absence d’API/timing gameplay ;
- vérifie aussi que `capture-page.js` accepte `visualClockSource`, attache la source au montage et la détache au `dispose()` ;
- batterie complète : `34686275777` success.

Commits de l’étape :
- source injectable : `0eab5bd835639ddd1e777960c77ff3f4e0f26031`
- façade runtime : `3adf973e2b574e33fd861953878b5522c71bd26f`
- page Capture / lifecycle abonnement : `8cc7cc80f3fec2e1ff90fbd59a3f2bb289b42150`
- régression : `c869f5836fa4f8369c255b2b4c2dac322108e756`

## Priorités ouvertes

1. prochaine étape Capture : définir le premier adaptateur de visibilité/activité de page pour suspendre/reprendre proprement la source visuelle lors d’un masquage/retour, sans choisir encore l’API navigateur finale ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
