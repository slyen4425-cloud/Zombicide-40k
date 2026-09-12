# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier de créature et listes Équipe active/Réserve inspectables.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit uniquement les données autoritaires déjà présentes ; elle ne calcule aucune règle, taux, faiblesse ou formule.
- Les listes Équipe active/Réserve sont strictement consultatives : elles n’appellent ni déplacement de roster ni changement d’équipe.
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
- listes Équipe active/Réserve inspectables : `34688524627` success

## Dernière étape terminée

Listes réelles Équipe active / Réserve avec inspection directe :
- nouveau `v2/src/modes/capture/ui-roster-list.js` ;
- contrat `CAPTURE_UI_ROSTER_LIST_CONTRACT` : présentation uniquement, lecture du roster autoritaire, cible d’inspection exposée, aucune mutation roster/gameplay, isolation RPG ;
- `buildCaptureRosterLists(state)` construit deux listes à partir de `activeTeam` et `reserve` ;
- chaque entrée expose uniquement instance, espèce, emplacement, titre, sous-titre niveau et cible inspectable ;
- `runtime.js` expose le presenter dans la façade Capture officielle ;
- `capture-page.js` rend désormais deux sections réelles `Équipe active` et `Réserve` ;
- chaque créature possède un bouton `Inspecter` avec `data-capture-inspect-instance` ;
- un clic appelle l’opération `inspectCreature(instanceId)` déjà validée et ouvre l’overlay métier non modal ;
- les événements de clic sont délégués sur les deux listes et correctement retirés au `dispose()` ;
- les listes peuvent être rafraîchies via `refreshRosterLists()` et sont rerendues après un `advance()` autoritaire ;
- aucun appel à `moveCaptureRosterCreature()` ou `setCaptureTeam()` n’a été ajouté dans la page.

Régression :
- nouveau `v2/tests/capture-ui-roster-list.test.mjs` ;
- couvre presenter Équipe/Réserve, surnom/fallback espèce, niveau, compteurs, absence de mutation de l’état et identités invalides ;
- garde statique : présence des deux listes, boutons Inspecter, liaison vers `inspectCreature`, abonnement/désabonnement des clics et absence d’opérations de mutation roster ;
- batterie complète : `34688524627` success.

Commits de l’étape :
- presenter listes roster : `5fa35cb0177e773a810767ff50b3451597d11254`
- façade runtime : `5340ce1d27bc87040005d5d29f814211c89118df`
- intégration page Équipe/Réserve : `4e32d39b0709cffbc06827a857d4881c25d7e04d`
- régression : `99bb8aa366fc8b479ab3a6f7b1ae9fcc43f876d0`

## Priorités ouvertes

1. prochaine étape Capture : améliorer ces listes avec le premier **état visuel de sélection/actif** (identifier clairement la créature active en combat ou l’équipe active), toujours sans mutation gameplay ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
