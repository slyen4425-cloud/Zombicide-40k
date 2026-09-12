# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier de créature, listes Équipe active/Réserve inspectables, marquage visuel de la créature active en combat et affichage PV/KO du roster.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- Plusieurs raisons de pause visuelle peuvent coexister ; le temps visuel ne reprend que lorsque toutes les raisons sont levées.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- L’inspection de créature lit uniquement les données autoritaires déjà présentes ; elle ne calcule aucune règle, taux, faiblesse ou formule.
- Les listes Équipe active/Réserve sont strictement consultatives : elles n’appellent ni déplacement de roster ni changement d’équipe.
- La créature active en combat est signalée uniquement à partir de `battle.player.activeInstanceId`; aucun switch ou choix automatique n’est effectué par la vue.
- Les PV affichés viennent uniquement de `currentHp`/`maxHp`; l’état KO est signalé uniquement lorsque `currentHp <= 0`. Aucune formule ou valeur par défaut de combat n’est créée par la vue.
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

## Dernière étape terminée

Affichage PV / KO dans les listes Capture :
- `v2/src/modes/capture/ui-roster-list.js` lit désormais les champs autoritaires `currentHp` et `maxHp` de chaque instance ;
- le contrat `CAPTURE_UI_ROSTER_LIST_CONTRACT` précise `readsAuthoritativeVitals:true` ;
- chaque entrée expose `hasVitals`, `currentHp`, `maxHp`, `hpLabel` et `ko` ;
- lorsque les deux valeurs sont connues, la vue produit `PV actuels / PV max` ; si une seule valeur existe, elle n’invente pas l’autre ; sans données, aucune ligne PV n’est affichée ;
- une valeur négative est seulement affichée avec un plancher visuel à `0`, sans modifier la donnée source ;
- `ko` vaut vrai uniquement lorsque `currentHp` est connu et `<= 0` ;
- `capture-page.js` rend une ligne `PV : …`, un attribut `data-capture-ko`, une classe `is-ko` et un badge `KO` ;
- les boutons d’inspection restent disponibles, y compris pour une créature KO ;
- aucune opération de dégâts, soins, switch ou mutation du roster/combat n’a été ajoutée à la vue.

Régression :
- `v2/tests/capture-ui-roster-list.test.mjs` couvre PV complets, PV actuels seuls, PV max seuls, absence de PV, KO à zéro/négatif, réserve, créature active en combat et absence de mutation ;
- garde statique contre les opérations de dégâts/soins, switch, mutation roster ou temps gameplay ;
- batterie complète : `34690466513` success.

Commits de l’étape :
- presenter PV / KO : `ff6e4ecb70c60ab237f0e43f4a255e686e3d5a3c`
- intégration page / badges PV-KO : `6320e53b4ca60b7cfad73972f3beb3e2b77611d0`
- régression : `c0accd61f5f4b5034dd0eee0dac47d664c13b1bc`

## Priorités ouvertes

1. prochaine étape Capture : enrichir les cartes roster avec les **statuts actifs déjà autoritaires** (compteur ou libellés simples), toujours sans appliquer ni recalculer leurs effets dans la vue ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles ;
5. avant de déclarer RPG terminé, passe finale assets/visuels/PWA/cache/parité legacy/tests.
