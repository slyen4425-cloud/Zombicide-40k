# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier de créature, listes Équipe active/Réserve inspectables, marquage visuel de la créature active en combat, affichage PV/KO, statuts actifs, charges/cooldowns des capacités et état réactions/esquive du roster.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit uniquement les données autoritaires déjà présentes ; elle ne calcule aucune règle, taux, faiblesse ou formule.
- Les listes Équipe active/Réserve sont strictement consultatives : elles n’appellent ni déplacement de roster ni changement d’équipe.
- La créature active en combat est signalée uniquement à partir de `battle.player.activeInstanceId`; aucun switch ou choix automatique n’est effectué par la vue.
- Les PV affichés viennent uniquement de `currentHp`/`maxHp`; l’état KO est signalé uniquement lorsque `currentHp <= 0`. Aucune formule ou valeur par défaut de combat n’est créée par la vue.
- Les statuts affichés viennent uniquement du tableau `statuses` déjà présent sur l’instance. La vue n’applique, ne ticke et ne résout aucun effet de statut.
- Les capacités affichées viennent uniquement de `abilityState` déjà présent sur l’instance ; en absence de cet état, les anciennes `abilityCharges` persistées peuvent encore être lues comme charges seules. Aucun maximum, cooldown ou coût manquant n’est inventé.
- Les réactions affichées viennent uniquement de `reactionState` déjà présent sur l’instance. `readyByCooldown` est un état de présentation dérivé exclusivement de `cooldownRemaining` quand cette valeur existe ; il ne prétend pas valider les autres conditions métier éventuelles d’une réaction.
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
- affichage PV / KO du roster : `34690466513` success
- affichage statuts actifs du roster : `34690816101` success
- affichage charges / cooldowns capacités : `34691249135` success
- affichage état réactions / esquive : `34692442765` success

## Dernière étape terminée

Affichage de l’état réactions / esquive dans les listes Capture :
- `v2/src/modes/capture/ui-roster-list.js` lit désormais `reactionState` de chaque instance ;
- le contrat `CAPTURE_UI_ROSTER_LIST_CONTRACT` précise `readsAuthoritativeReactionState:true` ;
- chaque réaction de présentation expose uniquement `id`, `resource`, `cooldownRemaining` et `readyByCooldown` ;
- `readyByCooldown` vaut vrai uniquement lorsque le cooldown autoritaire est connu et `<= 0`, faux lorsqu’il est `> 0`, et `null` quand aucun cooldown n’est fourni ;
- la ressource est affichée uniquement si elle existe déjà ; aucune réserve ni coût n’est inventé ;
- `capture-page.js` rend des éléments `data-capture-reaction`, un état `data-capture-reaction-ready` et les libellés de recharge/ressource sans appeler le moteur de réactions ;
- la vue n’appelle jamais `spendCaptureReactionState`, `tickCaptureReactionStateMap`, `canUseCaptureReactionState`, `resolveCaptureReaction` ou `advanceCaptureBattleTime` ;
- aucun déclenchement, aucune consommation et aucun tick de réaction ne sont provoqués par l’interface.

Régression :
- test dédié `v2/tests/capture-ui-roster-reactions.test.mjs` : commit `13cf56cbf7fc22da09e8df55517f23568beb09da` ;
- le premier run `34691589991` a échoué uniquement parce que l’ancien test global roster n’attendait pas encore la nouvelle propriété additive `reactions: []` ;
- assertion de compatibilité corrigée au commit `8217235f1ec38e0a040b9d90a3f45dc57e869f89` ;
- batterie complète corrigée : `34692442765` success.

Commits de l’étape :
- presenter réactions roster : `fbb9d457d0c227ad2cc33bcd251ccbfeb67d351d`
- intégration page / affichage réactions : `c309c755621d483f6c05b97912cb8c211bd82a35`
- régression dédiée : `13cf56cbf7fc22da09e8df55517f23568beb09da`
- correction garde roster historique : `8217235f1ec38e0a040b9d90a3f45dc57e869f89`

## Priorités ouvertes

1. prochaine étape Capture : enrichir l’inspection de créature avec ces mêmes états autoritaires (PV/KO, statuts, capacités, réactions) pour éviter d’avoir plus d’information dans la carte que dans l’inspection ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
