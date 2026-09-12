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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, tick global explicite, effets périodiques dégâts/soins, réactions/esquive configurables par créature, politique d'esquive data-driven, coût/cooldown de réaction par instance, fenêtre temporelle explicite et progression globale de l'horloge de réaction.
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
- coût/cooldown de réaction par instance : `34683977742` success
- fenêtre temporelle explicite de réaction : `34684261793` success
- progression globale horloge réaction : `34684443173` success

## Dernière étape terminée

Progression globale de l'horloge abstraite Capture :
- nouvelle opération publique `advanceCaptureBattleTime(state,{amount,tickReactionCooldowns})` dans `capture.js` ;
- elle avance `battle.timing.reactionTime` à partir de zéro uniquement quand une progression explicite est demandée ;
- elle peut décrémenter les cooldowns de réaction des deux combattants avec le même delta ;
- `useCaptureBattleAbility()` et `runCaptureAiStep()` utilisent automatiquement cette horloge via le `battle`, donc joueur et IA voient exactement la même fenêtre temporelle ;
- avant toute progression, une fenêtre configurée renvoie volontairement `capture-reaction-window-time-required` : aucun instant initial n'est inventé ;
- après progression jusqu'à l'ouverture, la réaction peut se déclencher ;
- à la borne `closesAt`, elle reste valide ; après cette borne elle est bloquée ;
- l'état de cooldown joueur reste synchronisé dans `activeTeam`/`roster` via le tick global existant ;
- aucune unité définitive, milliseconde, frame ou cadence réelle n'est imposée.

Régression :
- nouveau `v2/tests/capture-global-reaction-time.test.mjs` ;
- couvre temps absent, ouverture après progression explicite, cooldown décrémenté par le même delta, borne de fermeture, fermeture dépassée, chemin IA et refus hors combat ;
- premier run `34684418110` en failure : le test attendait `not-open` avant initialisation de l'horloge, alors que le contrat correct est `time-required` ;
- correction ciblée du test : `229ca91fc27be9c6e10c6cfdcddeb59504c9bc52` ;
- batterie complète corrigée : `34684443173` success.

Commits de l'étape :
- opération publique de progression temporelle : `5a3646b17f4798f855881b88bed92e09009c3bd3`
- régression progression globale : `5f2d898aec1b0e433f4dbaf88c7ada9a95eb49e2`
- correction attente pré-horloge : `229ca91fc27be9c6e10c6cfdcddeb59504c9bc52`

## Priorités ouvertes

1. prochaine étape Capture : unifier la progression temporelle des réactions avec le tick explicite des statuts/effets périodiques sans imposer de cadence temps réel ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
