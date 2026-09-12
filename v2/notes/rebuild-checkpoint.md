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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, tick global explicite, effets périodiques dégâts/soins, réactions/esquive configurables par créature, politique d'esquive data-driven et coût/cooldown de réaction par instance.
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

## Dernière étape terminée

Coût et cooldown de réaction réellement consommables par instance :
- nouveau `v2/src/modes/capture/reaction-state.js` ;
- état de réaction stocké par `instanceId` dans chaque créature via `reactionState[reactionId]` ;
- état minimal : `resource` optionnelle + `cooldownRemaining` ;
- aucune réserve implicite n'est inventée : si une réaction possède un coût > 0 mais aucune ressource n'est configurée, elle est bloquée explicitement ;
- `normalizeCaptureReaction()` supporte désormais `cooldown` en plus de `cost` ;
- coût et cooldown ne sont consommés que si la réaction se déclenche réellement ;
- une réaction en cooldown est refusée avant l'évaluateur ;
- `resolveCaptureAbilityAction()` persiste l'état de réaction du combattant ciblé dans le `battle` ;
- changement forcé/manuel recharge l'état propre de la nouvelle instance ;
- synchronisation globale joueur conserve `reactionState` dans `activeTeam` et `roster` ;
- nouvelle opération publique `tickCaptureBattleReactionCooldowns()` pour décrémenter explicitement les cooldowns des deux côtés sans imposer de timer temps réel ;
- la créature capturée conserve aussi son état de réaction courant ;
- l'état d'une autre créature de l'équipe reste strictement indépendant.

Régression :
- nouveau `v2/tests/capture-reaction-state.test.mjs` ;
- couvre consommation de ressource, pose du cooldown, blocage pendant cooldown, tick explicite, nouvelle esquive après récupération et indépendance de l'état d'une autre instance ;
- batterie complète V2 : `34683977742` success.

Commits de l'étape :
- primitives état réaction : `dc7ed488237ba5ee6264dbb62f7da5741902f23f`
- coût/cooldown dans résolution réaction : `917be83a896c36f86a4dc0c097e401f04e777ae8`
- persistance battle par instance : `cf5d550363f4e715bf3b519fafce14329d1e2da0`
- synchronisation globale + tick cooldown : `84987a9d4fe7f542288e917f661e14e29eddec96`
- régression état réaction : `acb1993465c99bf086204d711fd0ab0f4a6e957f`

## Priorités ouvertes

1. prochaine étape Capture : définir un premier contrat propre de fenêtre/réaction temporelle sans figer les i-frames finales, afin de préparer un vrai combat dynamique ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
