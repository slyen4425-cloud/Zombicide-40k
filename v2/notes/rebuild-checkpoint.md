# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel et premier overlay concret non modal.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
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
- overlay concret non modal : `34687557658` success

## Dernière étape terminée

Premier overlay/panneau concret non modal Capture :
- nouveau `v2/src/modes/capture/ui-overlay.js` ;
- contrat `CAPTURE_UI_OVERLAY_CONTRACT` : présentation uniquement, non modal, blocage présentationnel, aucune mutation gameplay, isolation RPG ;
- état `open`, `kind`, `title`, `message`, `metadata` ;
- `openCaptureUiOverlay()` ouvre l’overlay et demande uniquement un blocage présentationnel ;
- `closeCaptureUiOverlay()` le ferme et libère uniquement ce blocage présentationnel ;
- `runtime.js` expose ce module dans la façade Capture officielle ;
- `capture-page.js` rend un vrai `<aside data-capture-overlay ... aria-modal="false">` avec titre/message et bouton Fermer ;
- nouvelles opérations page `openOverlay(options)` et `closeOverlay()` ;
- ouverture -> `presentation-block` actif -> temps visuel suspendu ;
- fermeture -> retrait de `presentation-block` ; si `activity` ou `manual` reste actif, aucune reprise visuelle prématurée ;
- le statut du driver gameplay est observable dans le résultat, mais il n’est jamais modifié par l’overlay ;
- aucun appel à `setCaptureBattleBlocking()`, aucun timer navigateur, aucun couplage au temps gameplay.

Régression :
- nouveau `v2/tests/capture-ui-overlay.test.mjs` ;
- couvre contrat, ouverture/fermeture, contenu, comportement `activity + presentation-block`, non-modalité et absence de blocage gameplay ;
- batterie complète : `34687557658` success.

Commits de l’étape :
- état/contrat overlay : `d05b292f333df775b188b9e865f762cc512ccc30`
- façade runtime : `7938318fc92de9306fc38d2f4654b62f0051b816`
- page Capture / overlay concret : `dd1f61ca9471e129f84269c92b251dfb17b08675`
- régression : `5003a79b6ea2dde049304aa3d2affe1f93199dc9`

## Priorités ouvertes

1. prochaine étape Capture : brancher un premier **contenu métier réel** sur cet overlay (par exemple aide/inspection d’une créature ou détail de statut), toujours sans logique gameplay dans la vue ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
