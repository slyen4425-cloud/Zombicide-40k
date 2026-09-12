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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO et flux post-KO.
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

## Dernière étape terminée

Flux post-KO du combat Capture :
- `switchCaptureActiveCreature()` refuse désormais de sélectionner une créature déjà KO ;
- nouveau `resolveCaptureKoState()` dans `dynamic-combat.js` ;
- KO adverse => fin propre du combat avec `opponent_ko` ;
- si la créature active joueur est KO, ses PV réels sont synchronisés dans l’équipe possédée avant toute décision ;
- le moteur cherche ensuite une autre créature active encore vivante ;
- si un remplaçant existe, changement forcé et combat maintenu actif ;
- la nouvelle créature conserve son propre état PV et reprend la position spatiale de la précédente ;
- si aucune créature de l’équipe active n’est encore apte, le combat se termine avec `player_team_unavailable` ;
- un KO individuel n’est donc jamais traité comme une défaite globale tant qu’un membre vivant reste disponible.

Régression :
- nouveau `v2/tests/capture-ko-flow.test.mjs` ;
- couvre KO adverse => fin de combat ;
- couvre KO joueur => remplacement forcé par une créature vivante ;
- couvre équipe entière KO => `player_team_unavailable` ;
- couvre explicitement une équipe de 6 avec une seule créature KO pour empêcher toute régression vers une défaite globale prématurée.

Commits de l’étape :
- flux post-KO et remplacement forcé : `684a00edcc097fb12d6105f3b8a95e107a1824fe`
- régression KO : `efa0f1e453598fdfb9c728a9560b18c91394d9f1`

CI fonctionnelle de l’étape : `34682302866` success.

## Priorités ouvertes

1. prochaine étape Capture : brancher automatiquement ce flux post-KO à la résolution des actions, afin qu’un KO déclenche immédiatement fin/remplacement sans appel manuel séparé ;
2. ensuite ajouter progressivement statuts/esquive et réactions tactiques de l’IA ;
3. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
