# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier de créature, listes Équipe active/Réserve inspectables et marquage visuel de la créature active en combat.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit uniquement les données autoritaires déjà présentes ; elle ne calcule aucune règle, taux, faiblesse ou formule.
- Les listes Équipe active/Réserve sont strictement consultatives : elles n’appellent ni déplacement de roster ni changement d’équipe.
- La créature active en combat est signalée uniquement à partir de `battle.player.activeInstanceId`; aucun switch ou choix automatique n’est effectué par la vue.
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
- marquage créature active en combat : `34690135197` success

## Dernière étape terminée

État visuel de la créature active en combat dans la liste Capture :
- `v2/src/modes/capture/ui-roster-list.js` lit désormais `state.battle.player.activeInstanceId` en plus du roster autoritaire ;
- le contrat `CAPTURE_UI_ROSTER_LIST_CONTRACT` précise `readsAuthoritativeBattleActiveInstance:true` et `mutatesBattle:false` ;
- chaque entrée expose `activeInBattle` ;
- seule une créature de `activeTeam` peut être marquée active, jamais une entrée de réserve ;
- hors combat, `activeBattleInstanceId` vaut `null` et aucun marquage n’est produit ;
- `capture-page.js` rend `data-capture-active-in-battle="true"`, une classe `is-active-in-battle` et le badge `Actif en combat` sur l’unique entrée concernée ;
- la liste est rerendue après démarrage du combat, après les avancées autoritaires et après fin du combat, pour suivre les changements déjà décidés par le runtime ;
- aucune opération de switch, sélection ou mutation du combat n’a été ajoutée à la page.

Régression :
- `v2/tests/capture-ui-roster-list.test.mjs` couvre le marquage actif, la réserve jamais active, l’absence de combat, l’absence de mutation de l’état et les gardes contre `switchCaptureBattleCreature`/mutations gameplay ;
- batterie complète : `34690135197` success.

Commits de l’étape :
- presenter actif en combat : `9b9ab5aba0b7a5de6bca5521f4533e38391c2d3b`
- intégration page / badge actif : `fadd5274f33237c3a9d920cebf30c7606757d637`
- régression : `27d7f40bbbef90d21e28f47ade376f0467fdb4ba`

## Priorités ouvertes

1. prochaine étape Capture : enrichir visuellement cette liste avec un premier **état KO / PV lisible** dérivé uniquement des données autoritaires de l’instance, sans logique de combat dans la vue ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
