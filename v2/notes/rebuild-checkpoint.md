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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage et première IA dédiée.
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

## Dernière étape terminée

Première IA dédiée au combat dynamique Capture :
- nouveau `v2/src/modes/capture/ai.js` ;
- contrat explicite : IA Capture dédiée, sans IA RPG, sans timeline RPG ;
- priorité volontairement simple : utiliser une capacité disponible si la cible est à portée ; sinon se rapprocher ; sinon attendre ;
- seules les capacités réellement utilisables sont considérées : existence, charges restantes et cooldown ;
- une capacité à portée utilise le même `resolveCaptureAbilityAction()` que le reste du runtime, donc consommation de charge/cooldown et résolution d’effet restent cohérentes ;
- si aucune capacité n’est à portée, l’IA cherche un déplacement orthogonal d’une case qui réduit réellement la distance vers la cible ;
- aucun comportement tactique avancé, aucune formule de dégâts/esquive, aucun temps réel définitif ni logique RPG n’est inventé à ce stade.

Régression :
- nouveau `v2/tests/capture-dynamic-ai.test.mjs` ;
- couvre attaque à portée avec consommation de charge et journal d’action ;
- couvre déplacement vers la cible quand l’adversaire est hors portée ;
- couvre le cas sans charge disponible, qui empêche l’utilisation de la capacité ;
- aucune dépendance RPG/D100/timeline n’est introduite.

Commits de l’étape :
- IA dédiée Capture : `5441496937d6fca0722ef77f6303e21c8884301e`
- régression IA dynamique : `cb0febd2a44bffb7b3457a9de50e815dfff5b7f8`

CI fonctionnelle de l’étape : `34681979266` success.

## Priorités ouvertes

1. prochaine étape Capture : définir une première résolution concrète mais configurable des PV/dégâts/soins/KO sur le runtime dynamique, sans figer encore l’esquive ni la cadence temps réel ;
2. ensuite ajouter progressivement statuts/esquive et réactions tactiques de l’IA ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
