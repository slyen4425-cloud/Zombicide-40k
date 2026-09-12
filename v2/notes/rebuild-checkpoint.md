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
- Runtime Capture actuel : roster/équipe/réserve, migration IDs canoniques, quarantaine legacy, registre assets canonique, objets de capture isolés, capacités/charges par instance, biomes/rencontres, exploration libre, tentative de capture configurable, runtime dynamique de combat, capture complète en combat sauvage, IA dédiée, PV/dégâts/soins/KO, post-KO automatique, synchronisation globale, IA routée globalement, statuts/conditions, tick global explicite, effets périodiques dégâts/soins, réactions/esquive configurables par créature, politique d'esquive data-driven, coût/cooldown de réaction par instance et première fenêtre temporelle explicite de réaction.
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

## Dernière étape terminée

Premier contrat de fenêtre temporelle de réaction Capture :
- nouveau `v2/src/modes/capture/reaction-window.js` ;
- une réaction peut déclarer une fenêtre `opensAt` / `closesAt` avec une unité libre et explicite ;
- aucune cadence temps réel globale n'est imposée et aucune i-frame finale n'est créée ;
- une fenêtre non configurée reste ouverte pour préserver le comportement existant ;
- une fenêtre configurée exige un temps explicite ; aucun temps n'est deviné ;
- avant l'ouverture ou après la fermeture, la réaction est bloquée avant l'évaluateur et ne consomme ni ressource ni cooldown ;
- pendant la fenêtre, le flux normal réaction -> coût/cooldown -> annulation éventuelle de l'effet continue ;
- nouveau `v2/src/modes/capture/battle-timing.js` avec `setCaptureBattleReactionTime()` / `clearCaptureBattleReactionTime()` pour injecter une horloge abstraite dans `battle.timing.reactionTime` ;
- `resolveCaptureReaction()` lit explicitement `reactionTime` fourni ou `battle.timing.reactionTime` ;
- ce mécanisme prépare le futur vrai timing dynamique sans figer millisecondes, ticks, frames ou i-frames.

Régression :
- nouveau `v2/tests/capture-reaction-window.test.mjs` ;
- couvre avant fenêtre, fenêtre ouverte, après fermeture, temps manquant, fenêtre non configurée, non-consommation hors fenêtre et consommation correcte pendant la fenêtre ;
- premier run `34684238008` en failure : `null` était converti en `0` par JavaScript, donc le temps manquant était confondu avec un instant avant ouverture ;
- correction ciblée : `now==null` est désormais traité explicitement comme `capture-reaction-window-time-required` ;
- batterie complète corrigée : `34684261793` success.

Commits de l'étape :
- contrat fenêtre réaction : `ab0714aea7ed465db4179da3efd5bc7b9c469215`
- raccord fenêtre au moteur réaction : `c3ba5c5ea4ee6bda9a68cdf781d33628f904ad30`
- lecture horloge battle dans réactions : `075230493db0c2d3a6712a82a8a13965c28f1822`
- helpers horloge battle : `09841f1f9c9fec54c0641e8431838e3ddbd18dcd`
- régression fenêtre : `c4158a0b04cf4617fada97676916b37e3e4abdce`
- correction temps manquant : `cee8e29ef5c45c017511a434c20f5de0091f73fc`

## Priorités ouvertes

1. prochaine étape Capture : brancher cette horloge abstraite au chemin global joueur + IA avec une opération publique de progression temporelle, sans choisir encore secondes/frames/ticks définitifs ;
2. ensuite enrichir progressivement les autres réactions/effets tactiques seulement si leurs contrats sont validés ;
3. compléter les règles d'orbes/coefficient uniquement à partir de valeurs validées ;
4. importer les arts principaux + icônes quand les fichiers sont disponibles, puis renseigner le registre canonique ;
5. avant de déclarer RPG terminé, faire la passe finale assets/visuels/PWA/cache/parité legacy/tests.
