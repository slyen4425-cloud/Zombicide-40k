# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier de créature, listes Équipe active/Réserve inspectables, marquage visuel de la créature active en combat, affichage PV/KO, statuts actifs et état charges/cooldowns du roster.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit uniquement les données autoritaires déjà présentes ; elle ne calcule aucune règle, taux, faiblesse ou formule.
- Les listes Équipe active/Réserve sont strictement consultatives : elles n’appellent ni déplacement de roster ni changement d’équipe.
- La créature active en combat est signalée uniquement à partir de `battle.player.activeInstanceId`; aucun switch ou choix automatique n’est effectué par la vue.
- Les PV affichés viennent uniquement de `currentHp`/`maxHp`; l’état KO est signalé uniquement lorsque `currentHp <= 0`. Aucune formule ou valeur par défaut de combat n’est créée par la vue.
- Les statuts affichés viennent uniquement du tableau `statuses` déjà présent sur l’instance. La vue n’applique, ne ticke et ne résout aucun effet de statut.
- Les capacités affichées viennent uniquement de `abilityState` déjà présent sur l’instance ; en absence de cet état, les anciennes `abilityCharges` persistées peuvent encore être lues comme charges seules. Aucun maximum, cooldown ou coût manquant n’est inventé.
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

## Dernière étape terminée

Affichage charges / cooldowns des capacités dans les listes Capture :
- `v2/src/modes/capture/ui-roster-list.js` lit maintenant un éventuel `abilityState` déjà autoritaire sur l’instance ;
- le contrat `CAPTURE_UI_ROSTER_LIST_CONTRACT` précise `readsAuthoritativeAbilityState:true` ;
- chaque capacité de présentation expose uniquement `id`, `charges`, `chargeMax` et `cooldownRemaining` lorsqu’ils existent déjà ;
- si `abilityState` n’est pas présent mais que la sauvegarde contient encore `abilityCharges`, ces charges sont affichées seules, sans inventer `chargeMax` ni cooldown ;
- les valeurs négatives éventuelles sont seulement plafonnées visuellement à zéro, sans mutation de la source ;
- `capture-page.js` affiche des lignes `data-capture-ability` avec ID, charges connues et recharge restante connue ;
- la vue n’appelle jamais `spendCaptureAbility`, `tickCaptureAbilityCooldowns` ou `canUseCaptureAbility` ;
- aucune capacité n’est déclenchée, aucune charge consommée et aucun cooldown décrémenté par l’interface.

Régression :
- `v2/tests/capture-ui-roster-list.test.mjs` couvre `abilityState`, fallback `abilityCharges`, charges avec/sans maximum, cooldown connu/inconnu, équipe/réserve et absence de mutation ;
- garde statique contre les opérations moteur de capacités ainsi que les mutations gameplay déjà protégées ;
- batterie complète : `34691249135` success.

Commits de l’étape :
- presenter charges/cooldowns roster : `0f63da820d2b2f1d12c2282f023c6b1c965d647c`
- intégration page / affichage capacités : `b9991c56b543e3664e630b810fd5416533ce9cbb`
- régression : `49f2efb6a432a31542892135d1bbe76ab2e45fd4`

## Priorités ouvertes

1. prochaine étape Capture : exposer dans la liste un premier état **réaction/esquive disponible ou en recharge** uniquement à partir du `reactionState` autoritaire, sans déclencher de réaction dans la vue ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
