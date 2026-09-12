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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, tick global explicite, effets périodiques dégâts/soins, réactions/esquive configurables par créature et première politique d'esquive pilotée par les données.
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
- réactions configurables routées par joueur + IA : `34683246425` success
- politique d'esquive data-driven : `34683578020` success

## Dernière étape terminée

Première politique d'évaluation d'esquive pilotée par les données :
- nouveau `v2/src/modes/capture/dodge-policy.js` ;
- aucune chance globale ou valeur par défaut n'est imposée ;
- une réaction `dodge` peut porter `metadata.dodgePolicy.chancePercent` avec une valeur 0..100 ;
- `normalizeCaptureDodgePolicy()` normalise uniquement les données fournies et conserve `chancePercent:null` si aucune valeur n'est configurée ;
- `createCaptureDodgeEvaluator()` produit un évaluateur injecté dans le moteur de réactions existant ;
- le RNG est injecté, ce qui rend la politique entièrement déterministe en test ;
- la règle actuelle pour ce mode `chance` est volontairement minimale : `rollPercent < chancePercent` ; elle ne devient pas une formule universelle pour toutes les réactions Capture ;
- si la chance n'est pas configurée, aucune esquive n'est déclenchée ;
- les modes non supportés sont refusés explicitement plutôt que devinés ;
- les chemins globaux joueur et IA peuvent utiliser exactement ce même évaluateur sans modification supplémentaire du runtime.

Régression :
- nouveau `v2/tests/capture-dodge-policy.test.mjs` ;
- couvre normalisation, RNG déterministe, réussite/échec selon les données de la créature, absence de chance sans esquive inventée, attaque joueur contre une créature sauvage avec politique d'esquive et attaque IA contre une créature joueur ;
- batterie complète V2 : `34683578020` success.

Commits de l'étape :
- politique d'esquive pilotée par données : `f7f31ba48fc8ffe9081ca249aa52a9a39299ceb9`
- régression politique d'esquive : `a843479a242ea3be956407e45d352ccb95b51a40`

## Priorités ouvertes

1. prochaine étape Capture : ajouter un premier coût/cooldown de réaction réellement consommable par instance, sans figer encore les i-frames ni la cadence temps réel ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
