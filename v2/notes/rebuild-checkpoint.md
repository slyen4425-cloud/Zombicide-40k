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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée et première couche PV/dégâts/soins/KO.
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

## Dernière étape terminée

Première couche concrète de PV/dégâts/soins/KO dans le runtime Capture :
- nouveau `v2/src/modes/capture/vitals.js` ;
- `createCaptureVitals()` normalise `currentHp`, `maxHp` et l’état KO ;
- `applyCaptureDamage()` réduit les PV jusqu’à 0 et marque KO automatiquement ;
- `applyCaptureHealing()` soigne jusqu’au maximum sans dépasser `maxHp` ;
- un soin simple ne réanime pas une créature déjà KO à ce stade ;
- `resolveCaptureVitalEffect()` gère les effets déclaratifs `damage` et `heal`, et renvoie les autres effets sans inventer de formule ;
- `createCaptureBattleState()` initialise maintenant les PV de la créature active joueur et de l’adversaire ;
- `resolveCaptureAbilityAction()` accepte maintenant qu’un resolver renvoie un `battle` modifié, permettant aux effets de changer réellement les PV ;
- une créature KO ne peut plus lancer de capacité ;
- le changement de créature réinitialise correctement la créature active et ses PV à partir de son instance possédée ;
- aucune défense, critique, esquive, résistance ou formule RPG n’est encore imposée.

Régression :
- nouveau `v2/tests/capture-vitals.test.mjs` ;
- couvre dégâts réels, KO à 0 PV, blocage d’action d’une créature KO et soin plafonné ;
- la batterie complète V2 passe sans régression.

Commits de l’étape :
- primitives PV/dégâts/soins/KO : `774aced644ede93af9aa3882643124df1c5565f5`
- raccord au runtime dynamique : `9c51b96516b28676cd18b0e0a2f4c1f45dc947fa`
- régression vitals : `5e5db1cd383fd39308cfead07e3e1cb05c366390`

CI fonctionnelle de l’étape : `34682075802` success.

## Priorités ouvertes

1. prochaine étape Capture : brancher le KO adverse sur la fin de combat et le KO joueur sur changement forcé / équipe indisponible ;
2. ensuite ajouter progressivement statuts/esquive et réactions tactiques de l’IA ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
