# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal et première inspection métier de créature.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit uniquement les données autoritaires déjà présentes ; elle ne calcule aucune règle, taux, faiblesse ou formule.
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
- inspection métier de créature : `34688278893` success

## Dernière étape terminée

Première inspection métier réelle de créature Capture dans l’overlay :
- nouveau `v2/src/modes/capture/creature-inspection.js` ;
- contrat `CAPTURE_CREATURE_INSPECTION_CONTRACT` : présentation uniquement, lecture des données autoritaires, aucune dérivation de règle gameplay, données d’espèce facultatives, aucune mutation gameplay, isolation RPG ;
- `buildCaptureCreatureInspection(creature,{speciesDef})` construit un résumé structuré à partir de la créature possédée ;
- champs affichables : espèce, instance, niveau, PV quand disponibles, nombre de capacités suivies, nombre de statuts actifs, éléments uniquement s’ils sont déjà fournis par `speciesDef` ;
- aucun taux de capture, formule, faiblesse, efficacité ou valeur de combat n’est inventé ;
- `runtime.js` expose le presenter dans la façade Capture officielle ;
- `capture-page.js` accepte désormais `speciesById` comme source de présentation facultative et expose `inspectCreature(instanceId,{speciesDef})` ;
- l’inspection cherche la créature possédée dans `roster/activeTeam/reserve`, puis ouvre l’overlay non modal existant ;
- l’overlay possède maintenant une zone structurée `data-capture-overlay-fields` rendue en `<dl>` ;
- ouvrir l’inspection active seulement le blocage présentationnel/temps visuel déjà validé ; le driver gameplay reste inchangé.

Régression :
- nouveau `v2/tests/capture-creature-inspection.test.mjs` ;
- couvre données de Descendre avec surnom/niveau/PV/capacités/statut/éléments, fallback sans `speciesDef`, identités manquantes et absence de mutation de la créature ;
- garde statique : aucun appel au blocage gameplay, au temps gameplay ou à une API timer/random dans le presenter ;
- batterie complète : `34688278893` success.

Commits de l’étape :
- presenter inspection : `1af3b3189921913fe440bd25e1ba4228729fa7c1`
- façade runtime : `c0731d60f066a105d93a41868781179ecc3838a4`
- intégration overlay/page : `eb17d536f25ea5cb3366fec5d2dab783058328be`
- régression : `e891fa543248378db99b2349fda4e52f9623eba1`

## Priorités ouvertes

1. prochaine étape Capture : rendre cette inspection **directement accessible depuis une vraie liste équipe/réserve** de la page Capture, avec boutons/tuiles d’inspection sans modifier le gameplay ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
