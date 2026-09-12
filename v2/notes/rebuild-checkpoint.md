# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, marquage visuel de la créature active en combat, affichage PV/KO, statuts actifs, charges/cooldowns des capacités et état réactions/esquive du roster.
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

## Dernière étape terminée

Enrichissement de l’overlay d’inspection Capture :
- `v2/src/modes/capture/creature-inspection.js` lit désormais les états autoritaires `currentHp`/`maxHp`, `statuses`, `abilityState`/fallback `abilityCharges` et `reactionState` ;
- le contrat d’inspection expose explicitement `readsAuthoritativeVitals`, `readsAuthoritativeStatuses`, `readsAuthoritativeAbilityState` et `readsAuthoritativeReactionState` ;
- l’état `KO` n’est affiché que lorsque `currentHp <= 0` ;
- les statuts affichent seulement nom/ID, piles et durée restantes déjà enregistrées, jamais leurs effets ;
- les capacités affichent uniquement charges, maximum et cooldown déjà connus ; le fallback `abilityCharges` reste charges seules ;
- les réactions affichent uniquement ID, ressource et cooldown autoritaires ; `prête côté cooldown` signifie seulement que ce cooldown connu est à zéro ;
- aucune donnée source n’est mutée ; aucune capacité, réaction, mécanique de statut ou avance du temps n’est appelée ;
- l’overlay générique existant continue de rendre ces informations comme champs de présentation et ne bloque que le temps visuel, pas le gameplay.

Régression :
- `v2/tests/capture-creature-inspection.test.mjs` couvre l’inspection complète, le cas KO, fallback `abilityCharges`, absence de données, non-mutation et gardes statiques contre les moteurs de capacités/réactions/statuts ;
- batterie complète : `34692774662` success.

Commits de l’étape :
- inspection enrichie : `2d24e7230e0b319bce61ba19899e61625d004c29`
- régression inspection enrichie : `e7e64bc6ea19069d21692f9be2e0192f2946ae62`

## Priorités ouvertes

1. prochaine étape Capture : préparer un premier **résumé visuel d’adversaire sauvage actif** basé uniquement sur `battle.opponent` (espèce, PV/KO, statuts), sans action de combat ni règle de capture ajoutée dans la vue ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
