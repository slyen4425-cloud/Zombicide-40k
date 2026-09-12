# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur d’horloge visuelle externe, source d’horloge injectable et source d’activité/visibilité injectable.
- Le temps visuel des notices est séparé du temps gameplay : il ne fait jamais avancer combat, cooldowns, statuts ou PV.
- Masquer/inactiver la page peut maintenant suspendre uniquement le temps visuel ; la reprise repart avec une nouvelle ancre et ne rattrape pas le temps masqué.
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
- visibilité/activité UI : `34686417842` success

## Dernière étape terminée

Adaptateur de visibilité/activité pour le temps visuel Capture :
- nouveau `v2/src/modes/capture/ui-visual-activity-source.js` ;
- contrat `CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT` : présentation uniquement, source injectée, pause du temps visuel uniquement, aucune mutation gameplay, aucune API navigateur détenue ;
- `attachCaptureUiVisualActivitySource()` accepte des événements booléens ou `{active}` / `{visible}` ;
- les doublons d’état sont ignorés ;
- passage inactif/masqué -> `pauseNoticeVisualClock()` ;
- retour actif/visible -> `resumeNoticeVisualClock()` ;
- la pause et la reprise remettent `lastSample=null` dans l’adaptateur d’horloge : le premier sample après retour sert donc d’ancre et aucun temps masqué n’est rattrapé ;
- `mountCapturePage()` accepte désormais `visualActivitySource` et expose son état d’attachement ;
- `dispose()` détache d’abord la source d’activité puis la source d’horloge, avant le nettoyage visuel ;
- aucune utilisation de `setInterval`, `requestAnimationFrame`, `Date.now`, `performance.now`, `advanceCaptureTime` ou `advanceCaptureDriver` dans cette couche.

Régression :
- nouveau `v2/tests/capture-ui-visual-activity-source.test.mjs` ;
- couvre active -> inactive -> active, filtrage des doublons, désabonnement idempotent et erreurs d’interface source ;
- vérifie explicitement qu’un long intervalle masqué ne fait pas progresser le feed et que le premier sample au retour ré-ancre sans delta ;
- batterie complète : `34686417842` success.

Commits de l’étape :
- source activité/visibilité : `1b3bd82db29eaf4f74899b9f3e73ba7c765399bd`
- façade runtime : `6f421bacc2f20ad30d02671c7a85d828e152046b`
- page Capture : `0469ee9a5269af2262d205b41b90f872d61a4916`
- régression : `a3e9479a82da46a56a4f43d22cdc3452bec394f4`

## Priorités ouvertes

1. prochaine étape Capture : unifier proprement les états pause visuelle (activité page + éventuel blocage UI futur) dans un petit contrôleur de présentation, sans toucher au driver gameplay ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
