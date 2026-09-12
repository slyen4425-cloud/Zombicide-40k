# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle et premier blocage UI purement présentationnel.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- Un overlay/blocage de présentation peut maintenant suspendre le temps visuel sans suspendre le driver gameplay.
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
- blocage UI présentationnel : `34687005141` success

## Dernière étape terminée

Premier blocage UI purement présentationnel Capture :
- nouveau `v2/src/modes/capture/ui-presentation-block.js` ;
- contrat `CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT` : présentation uniquement, pause du temps visuel seulement, ne bloque pas le gameplay, aucune mutation gameplay, raison dédiée `presentation-block` ;
- état `blocked`, `kind`, `metadata` pour permettre plus tard différents overlays/panneaux sans coupler leur contenu au moteur ;
- `setCaptureUiPresentationBlocked()` ouvre/ferme cet état et renvoie la raison visuelle à appliquer ;
- `runtime.js` expose le contrat, l’état et l’opération dans la façade Capture officielle ;
- `capture-page.js` possède maintenant `presentationBlock` et expose `setPresentationBlocking(blocking, options)` ;
- cette opération ne touche jamais `setCaptureBattleBlocking()` ni le driver gameplay : elle ajoute/retire uniquement `presentation-block` dans le contrôleur visuel ;
- le statut du driver gameplay est renvoyé à titre d’observation mais jamais modifié ;
- si `activity` et `presentation-block` coexistent, fermer l’overlay laisse le visuel en pause tant que `activity` subsiste ;
- `startNoticeVisualClock()` réapplique la raison de présentation si un blocage est encore ouvert ;
- `dispose()` réinitialise aussi proprement l’état du blocage de présentation ;
- aucune API navigateur, aucun timer et aucune logique de combat ajoutés.

Régression :
- nouveau `v2/tests/capture-ui-presentation-block.test.mjs` ;
- couvre ouverture/fermeture du blocage, métadonnées, absence de mutation gameplay et interaction `activity + presentation-block` ;
- vérifie que fermer le blocage de présentation ne déclenche pas de reprise tant qu’une autre raison reste active ;
- garde statique : le module n’appelle ni `setCaptureBattleBlocking`, ni `advanceCaptureDriver`, ni `advanceCaptureTime`, ni API de timer navigateur ;
- batterie complète : `34687005141` success.

Commits de l’étape :
- état/contrat blocage présentation : `6f3f3f375b276619899c177f0126e683414b1c8c`
- façade runtime : `b3ec783c50b362696535bef4a8cad000c9f20a62`
- page Capture : `8c52a1562ac02141cd30db8bbb10dcdfee2b6b72`
- régression : `3989abb1aa3751bef1c1c45b31b48f7308f610b3`

## Priorités ouvertes

1. prochaine étape Capture : raccorder le premier **overlay/panneau concret non modal** à `setPresentationBlocking()` pour valider le flux ouverture -> pause visuelle -> fermeture -> reprise conditionnelle, toujours sans bloquer le gameplay ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
