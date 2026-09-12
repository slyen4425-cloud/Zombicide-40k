# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture est autonome : aucun état gameplay mutable partagé avec RPG, Survie ou PVP.
- Moteur spatial neutre partagé dans `v2/src/core/spatial-engine.js` ; graphe World Builder neutre dans `v2/src/core/world-graph.js`.
- Capture reste lazy : aucun bootstrap global ; stockage exclusivement `gensrpg:v2:capture:*`.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable et runtime dynamique de combat avec premières actions de capacités.
- Les visuels Capture validés ne sont pas encore importés physiquement ; registre `pending_import` sous cible `v2/assets/capture/creatures/`.
- Les 4 orbes legacy reconnues sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients restent non inventés.
- Le combat Capture utilise son runtime dédié `v2/src/modes/capture/dynamic-combat.js` et reste indépendant du `turnSequence`/D100 RPG.

## Jalons CI récents validés

- canonicalisation/déduplication créatures : `34679224508` success
- stockage isolé + spatial neutre : `34679382483` success
- contrats gameplay : `34679477548` success
- runtime Capture isolé : `34679708898` success
- roster/équipe/réserve : `34679980856` success
- ouverture lazy Capture : `34680539893` success
- registre assets canonique : `34680830787` success
- objets + capacités/charges : `34681113738` success
- biomes + exploration/rencontres : `34681280023` success
- tentative de capture configurable : `34681385329` success
- contrat combat dynamique Capture : `34681468819` success
- premier runtime combat dynamique Capture : `34681648425` success
- premières actions de capacités dynamiques : `34681748038` success

## Dernière étape terminée

Capacités/charges branchées au runtime dynamique avec première résolution d’action :
- `v2/src/modes/capture/abilities.js` accepte désormais une portée `range` et une déclaration d’effet `effect` sans imposer de formule de dégâts ;
- l’initialisation des charges réutilise `creature.abilityCharges[abilityId]` quand une instance possédée en conserve déjà une valeur, sinon elle part de `chargeMax` ;
- nouveau `resolveCaptureAbilityAction()` dans `dynamic-combat.js` ;
- une capacité ne part que si le combat est actif, la capacité existe, n’est pas en cooldown, possède encore ses charges et la cible est dans la portée configurée ;
- un échec de portée/cooldown/charges ne consomme rien ;
- une action valide consomme une charge et applique le cooldown configuré ;
- la résolution d’effet est injectée via `effectResolver`, ce qui permet d’ajouter plus tard dégâts, soins, statuts, esquive et autres mécaniques sans hard-coder une formule prématurée ;
- sans resolver spécifique, l’action retourne simplement l’effet déclaré comme `declared_effect` ;
- chaque action résolue est ajoutée à `battle.actionLog` avec son résultat ;
- aucun moteur RPG, aucun `turnSequence`, aucun D100 n’est utilisé.

Régression :
- nouveau `v2/tests/capture-dynamic-ability-actions.test.mjs` ;
- vérifie qu’une cible à 3 cases avec portée 2 est refusée sans consommation ;
- après déplacement à portée, la capacité consomme 1 charge, applique son cooldown et inscrit le résultat configuré ;
- une seconde utilisation pendant le cooldown est bloquée sans nouvelle consommation ;
- la résolution par défaut conserve un effet déclaré sans inventer de formule de dégâts.

Commits de l’étape :
- extension capacités : `21d889d0f27103944377dcef9d8b39facb8cc324`
- résolution d’actions dynamiques : `40c111b5bb5395ff358cc53cd25b52dfd50fbb23`
- régression actions capacités : `14ea483594d883ff81e395865cceff420565a69a`

CI fonctionnelle de l’étape : `34681748038` success.

## Priorités ouvertes

1. prochaine étape Capture : brancher la tentative de capture complète au combat sauvage avec consommation d’orbe et création d’une nouvelle instance possédée, équipe/réserve selon place disponible ;
2. ensuite construire une première IA Capture dédiée sur le runtime dynamique, sans reprendre l’IA/timeline RPG ;
3. définir ensuite progressivement les résolutions concrètes de dégâts/soins/statuts/esquive sans figer trop tôt la cadence temps réel ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
