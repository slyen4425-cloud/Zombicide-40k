# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité et contrôleur multi-raisons de pause visuelle.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
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
- contrôleur multi-raisons de pause visuelle : `34686742880` success

## Dernière étape terminée

Contrôleur unifié des raisons de pause visuelle Capture :
- nouveau `v2/src/modes/capture/ui-visual-pause-controller.js` ;
- contrat `CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT` : présentation uniquement, plusieurs raisons simultanées, reprise uniquement lorsque la liste est vide, noms de raisons data-driven, aucune mutation gameplay ;
- état `reasons[]` dédupliqué ;
- `setCaptureUiVisualPauseReason(controller, reason, paused)` renvoie une transition `pause`, `resume` ou `none` ;
- ajouter une seconde raison alors que le visuel est déjà en pause ne repause pas le driver ;
- retirer une raison ne reprend pas le visuel si une autre raison reste active ;
- `pauseNoticeVisualClock()` et `resumeNoticeVisualClock()` utilisent désormais la raison `manual` ;
- la source de visibilité utilise la raison `activity` ;
- `setNoticeVisualPauseReason(reason,paused)` est exposé côté page pour les futurs blocages de présentation ;
- le driver visuel et l’adaptateur d’horloge ne sont pausés/repris que lors d’une vraie transition globale ;
- le reset d’ancre à la reprise est donc conservé, sans rattrapage caché ;
- `startNoticeVisualClock()` et `stopNoticeVisualClock()` réinitialisent proprement le contrôleur ;
- aucune API navigateur, aucun timer et aucune logique gameplay ajoutés.

Régression :
- nouveau `v2/tests/capture-ui-visual-pause-controller.test.mjs` ;
- couvre `activity + manual`, suppression d’une seule raison sans reprise, reprise seulement après suppression de la dernière raison, déduplication et raison invalide ;
- le garde d’activité a été aligné avec le nouveau routage par raison ;
- batterie complète : `34686742880` success.

Commits de l’étape :
- contrôleur de pause : `4505f0a914506de0db3aa96dfa522f7b1ad042ac`
- façade runtime : `3a9570bbfdcc3303ea70b0c32d4e57248a00917f`
- page Capture : `42c407f872774425ea09db76d5b10eaead887109`
- garde activité mis à jour : `9ef155c8611b8b251cb0cac26fbf784823e544b1`
- régression contrôleur : `27ce40d50a37aed8d14c915c80837e7e717a497d`

## Priorités ouvertes

1. prochaine étape Capture : raccorder un premier **blocage UI de présentation** au contrôleur via une raison dédiée, sans jamais suspendre le gameplay ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
