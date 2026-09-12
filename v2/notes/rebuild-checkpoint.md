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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, moteur générique de statuts/conditions, tick global explicite, effets périodiques dégâts/soins et premier socle configurable d'esquive/réaction tactique.
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
- capture complète en combat sauvage : `34681864744` success
- première IA dynamique dédiée : `34681979266` success
- PV/dégâts/soins/KO : `34682075802` success
- flux post-KO / remplacement forcé : `34682302866` success
- post-KO automatique après action : `34682441521` success
- état global Capture après capacité : `34682576122` success
- IA Capture routée par état global : `34682681387` success
- moteur générique statuts/conditions : `34682807731` success
- tick global explicite des statuts : `34682889435` success
- effets périodiques dégâts/soins sur tick explicite : `34683019572` success
- premier socle réaction/esquive configurable : `34683114512` success

## Dernière étape terminée

Premier socle configurable d'esquive/réaction tactique :
- nouveau `v2/src/modes/capture/reactions.js` ;
- aucune formule d'esquive fixe, aucun pourcentage par défaut et aucune i-frame ne sont imposés ;
- une réaction possède un `id`, un `type`, un état `enabled`, un comportement `negatesEffect`, un coût optionnel et des métadonnées ;
- l'évaluation est injectée via un `evaluator` externe : sans évaluateur, aucune esquive n'est inventée ;
- `resolveCaptureAbilityAction()` accepte désormais `reactionDef` + `reactionResolver` ;
- la réaction est évaluée après validation portée/charges et après consommation de la capacité : une attaque réellement tentée consomme donc bien son usage même si elle est esquivée ;
- si la réaction se déclenche avec `negatesEffect:true`, l'effet principal n'est pas exécuté, les PV/statuts ne changent pas et l'action est journalisée comme réaction ayant annulé l'effet ;
- si la réaction ne se déclenche pas, le resolver d'effet normal continue exactement comme avant ;
- aucun chemin RPG n'est introduit et la cadence temps réel finale reste non figée.

Régression :
- nouveau `v2/tests/capture-reactions.test.mjs` ;
- couvre réaction normalisée, absence d'évaluateur sans esquive automatique, esquive déclenchée annulant les dégâts tout en consommant une charge, et réaction non déclenchée laissant passer les dégâts ;
- batterie complète V2 : `34683114512` success.

Commits de l'étape :
- primitives de réaction : `5b4e048a4c1db216e92c68e51af00eed092864c5`
- raccord à la résolution de capacité : `0817a5106b27cdf19909a6266b01e20ba8c271fe`
- régression réactions : `c714d2f31741ca438ccb43643affeb9ec739fd89`

## Priorités ouvertes

1. prochaine étape Capture : raccorder ce socle de réaction au chemin global joueur + IA et préparer une première politique d'esquive configurable par créature sans imposer la formule finale ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
