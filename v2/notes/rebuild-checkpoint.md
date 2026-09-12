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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO et flux post-KO automatique après action.
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

## Dernière étape terminée

Flux post-KO automatiquement branché à chaque résolution de capacité :
- `resolveCaptureAbilityAction()` appelle désormais `resolveCaptureKoState()` immédiatement après l'application de l'effet et l'ajout au journal ;
- un KO adverse termine immédiatement le combat avec `opponent_ko` ;
- un KO joueur synchronise immédiatement ses PV dans l'équipe et force le remplacement si une créature vivante existe ;
- si aucun remplaçant vivant n'existe, la résolution termine immédiatement avec `player_team_unavailable` ;
- le résultat expose `koOutcome`, l'équipe synchronisée et, en cas de remplacement, l'ancien et le nouvel `instanceId` ;
- le contrôle `capture-actor-ko` reste prioritaire pour préserver le comportement de sécurité des appels faits sur un acteur déjà KO, même après une fin automatique de combat.

Régression :
- nouveau `v2/tests/capture-auto-post-ko.test.mjs` ;
- couvre KO adverse automatique, changement forcé automatique et défaite d'équipe automatique ;
- le premier run `34682409287` a détecté une régression de compatibilité dans `capture-vitals.test.mjs` (`battle-not-active` au lieu de `capture-actor-ko`) ;
- correction ciblée : ordre des gardes ajusté sans désactiver la fin automatique ;
- run corrigé `34682441521` : success.

Commits de l'étape :
- branchement post-KO automatique : `12b1c861629c1d7cf3fbf6047c9a8b15a638c810`
- régression automatique : `a596e9aab6c9697a26a5cca16a2322778a67182e`
- correction de compatibilité : `f77f5d63c23f2abaa86dc1c10ff0021f2cae4d3a`

## Priorités ouvertes

1. prochaine étape Capture : synchroniser ce résultat automatique dans l'état global `capture.js` afin que `battle`, `activeTeam`, roster et retour exploration soient mis à jour en une seule opération publique ;
2. ensuite ajouter progressivement statuts/esquive et réactions tactiques de l'IA ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
