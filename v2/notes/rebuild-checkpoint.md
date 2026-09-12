# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, marquage visuel de la créature active en combat, affichage PV/KO, statuts actifs, charges/cooldowns des capacités, état réactions/esquive du roster et résumé visuel de l’adversaire actif.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit maintenant les mêmes données autoritaires que les cartes roster : PV/KO, statuts, capacités et réactions, sans exécuter ni recalculer de mécanique.
- Les listes Équipe active/Réserve sont strictement consultatives : elles n’appellent ni déplacement de roster ni changement d’équipe.
- La créature active en combat est signalée uniquement à partir de `battle.player.activeInstanceId`; aucun switch ou choix automatique n’est effectué par la vue.
- Les PV affichés viennent uniquement de `currentHp`/`maxHp`; l’état KO est signalé uniquement lorsque `currentHp <= 0`. Aucune formule ou valeur par défaut de combat n’est créée par la vue.
- Les statuts affichés viennent uniquement du tableau `statuses` déjà présent sur l’instance. La vue n’applique, ne ticke et ne résout aucun effet de statut.
- Les capacités affichées viennent uniquement de `abilityState` déjà présent sur l’instance ; en absence de cet état, les anciennes `abilityCharges` persistées peuvent encore être lues comme charges seules. Aucun maximum, cooldown ou coût manquant n’est inventé.
- Les réactions affichées viennent uniquement de `reactionState` déjà présent sur l’instance. L’indication `prête côté cooldown` dépend exclusivement d’un `cooldownRemaining` connu à zéro et ne prétend pas valider les autres conditions métier éventuelles.
- Le résumé d’adversaire actif lit uniquement `battle.opponent`, ses `vitals`, ses `statuses` et sa position déjà stockée dans `battle.spatial.positions`; il n’appelle aucune action de combat et disparaît hors combat actif.
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
- inspection détaillée PV/KO/statuts/capacités/réactions : `34692774662` success
- résumé visuel adversaire actif : `34693245713` success

## Dernière étape terminée

Résumé visuel de l’adversaire actif dans la page Capture :
- nouveau presenter `v2/src/modes/capture/ui-opponent-summary.js` ;
- le contrat `CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT` précise lecture autoritaire de l’adversaire, des PV/KO, statuts et position, avec `mutatesBattle:false` et `mutatesGameplayState:false` ;
- `buildCaptureOpponentSummary(state)` retourne `null` hors combat actif ;
- pendant un combat actif, le résumé lit l’instance/espèce adverse, l’état sauvage, les PV/KO, les statuts déjà présents et la position déjà enregistrée dans `battle.spatial.positions` ;
- les effets des statuts ne sont jamais propagés ni exécutés ;
- `capture-page.js` rend une section `Adversaire sauvage` avec PV, badge KO, badge Sauvage, position et statuts déjà autoritaires ;
- la section apparaît au démarrage du combat, se rafraîchit après les avancées autoritaires et disparaît après la fin du combat ;
- aucun ciblage, déplacement, switch, capacité, IA ou tentative de capture n’est déclenché depuis cette vue.

Régression :
- test dédié `v2/tests/capture-ui-opponent-summary.test.mjs` ;
- couvre combat sauvage actif, PV/KO, statuts, position, absence de combat/fin de combat, non-mutation et gardes statiques contre les actions de combat ;
- batterie complète : `34693245713` success.

Commits de l’étape :
- presenter adversaire : `5b4967103c4efa44ecd3776ef99caebfc222e742`
- façade runtime : `ee2c99e4d029275214dd77e34c0a5294726d2177`
- intégration page : `92039af149addfe1e5884bff75086bf307cba1f0`
- régression : `e0a51d18051967dd0cf4232d72b8b0d890437243`

## Priorités ouvertes

1. prochaine étape Capture : relier au résumé adverse le **nom d’espèce et éventuellement son art/icône uniquement lorsque le registre d’assets canonique fournit réellement un fichier disponible**, sans fallback RPG ni nom de fichier inventé ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
