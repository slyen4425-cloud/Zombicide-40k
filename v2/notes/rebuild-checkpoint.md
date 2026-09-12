# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé et adaptateur d’horloge visuelle externe.
- Le temps visuel des notices est séparé du temps gameplay : il ne fait jamais avancer combat, cooldowns, statuts ou PV.
- Aucun driver Capture ne choisit encore de cadence finale réelle ni d’unité de temps imposée.
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

## Dernière étape terminée

Adaptateur d’horloge externe pour le temps visuel des notices Capture :
- nouveau `v2/src/modes/capture/ui-visual-clock-adapter.js` ;
- contrat `CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT` : présentation uniquement, échantillons externes requis, échantillons monotones, premier sample utilisé uniquement comme ancre, aucune unité de temps fixe, aucune boucle temps réel détenue et aucune mutation gameplay ;
- état explicite `stopped/running/paused`, `lastSample`, `samples`, `totalDelta` ;
- opérations `startCaptureUiVisualClockAdapter()`, `pauseCaptureUiVisualClockAdapter()`, `resumeCaptureUiVisualClockAdapter()`, `stopCaptureUiVisualClockAdapter()` ;
- `sampleCaptureUiVisualClock()` calcule le delta uniquement entre deux samples fournis par l’application, puis délègue au visual driver existant ;
- le premier sample ne fait rien avancer et sert d’ancre ;
- un sample inférieur au précédent est rejeté explicitement avec `ui-visual-clock-nonmonotonic` ;
- `runtime.js` expose l’adaptateur comme façade officielle ;
- `capture-page.js` démarre/pause/reprend/arrête ensemble le visual driver et son adaptateur, puis expose `sampleNoticeVisualClock(sample)` pour recevoir les samples externes ;
- aucun `Date.now`, `performance.now`, `requestAnimationFrame`, `setInterval`, `advanceCaptureTime` ou `advanceCaptureDriver` n’est utilisé dans l’adaptateur ;
- le gameplay reste inchangé pendant l’expiration visuelle d’une notice.

Régressions :
- nouveau `v2/tests/capture-ui-visual-clock-adapter.test.mjs` ;
- couvre premier sample d’ancrage, progression par différence, expiration du feed, rejet d’un sample non monotone et absence de mutation gameplay ;
- premier run `34686088057` en échec sur un ancien garde statique du feed ;
- second run `34686111586` en échec sur un ancien garde statique du visual driver ;
- ces gardes ont été mis à jour pour vérifier le nouveau flux `sampleCaptureUiVisualClock(...)` sans changer le runtime ;
- batterie complète corrigée : `34686140413` success.

Commits de l’étape :
- adaptateur horloge visuelle : `57ecfd52aca2e9c4547f66d2a3918b197cbb8d1a`
- façade runtime : `4e050188c15f65d453ac10abb94b47c22217bcb9`
- page Capture : `9dff1b9b165b18d4ffb88bfd6f97d436d5a0a716`
- régression adaptateur : `74311a6cb12c2efa6fe39de54ae8b3ccc6b8c257`
- garde feed mis à jour : `ded95f0b8350f92d336300d53c03536842ef6040`
- garde visual driver mis à jour : `1da8687db3b68310ecc4980a539d826995a3f40d`

## Priorités ouvertes

1. prochaine étape Capture : définir la première source d’horloge UI/app réellement injectable au montage de la page (abonnement/désabonnement), toujours sans fixer la fréquence ou l’API navigateur finale ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
