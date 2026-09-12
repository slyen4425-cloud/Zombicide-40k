# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours RPG protégé par ses régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Rôle appareil MJ, panneau MJ, ergonomie mobile combat, audio RPG et stockage abstrait déjà présents.
- Monster Capture est un mode autonome : aucun état gameplay mutable n’est partagé avec RPG, Survie ou PVP.
- Le moteur spatial est neutre dans `v2/src/core/spatial-engine.js` et partagé réellement par RPG et Capture.
- Le graphe World Builder neutre est dans `v2/src/core/world-graph.js` pour mondes, zones, salles, passages, index et validation structurelle.
- Le futur combat Capture sera un runtime dédié : pas de `turnSequence` RPG, pas de timeline D100 RPG. La cible reste une exploration plus libre et un combat dynamique, à affiner plus tard.
- Bootstrap global Capture interdit : initialisation seulement à l’ouverture du mode.
- Stockage Capture V2 exclusivement sous `gensrpg:v2:capture:*`; anciennes clés legacy en lecture seule pour migration.
- Bibliothèque Capture nettoyée par IDs canoniques : alias legacy préservés, familles générées non validées mises en quarantaine.
- Le runtime roster Capture existe maintenant dans `v2/src/modes/capture/roster.js` : migration d’IDs, instances possédées distinctes, équipe max 6, réserve, quarantaine des espèces inconnues/non canoniques.

## Jalons CI récents validés

- canonicalisation/déduplication créatures Capture : `34679224508` success
- stockage Capture isolé + partage spatial neutre : `34679382483` success
- contrats gameplay Capture : `34679477548` success
- squelette runtime Capture isolé + Core spatial partagé : `34679708898` success
- migration roster/équipe/réserve Capture : `34679980856` success

## Dernière étape terminée

Runtime roster / équipe / réserve / migration des IDs canoniques :
- création de `v2/src/modes/capture/roster.js` ;
- construction d’un index alias legacy -> espèce canonique à partir de `capture-creature-canonicalization.json` ;
- les IDs legacy confirmés (`crea_embercub`, `crea_braiseau`, etc.) convergent vers un seul `speciesId` canonique ;
- chaque créature possédée garde son `instanceId`, son niveau, XP, PV, charges de capacités et métadonnées : deux captures de la même espèce ne sont jamais fusionnées ;
- l’ancien `speciesId` est conservé dans `legacySpeciesId` pour traçabilité/migration ;
- espèces ou lignées non canoniques/non validées envoyées en `quarantine` plutôt qu’importées silencieusement ;
- exemple protégé : `crea_pyrolynx` reste hors canon automatique ;
- séparation roster -> équipe active + réserve, avec priorité facultative aux anciens IDs actifs ;
- limite stricte de 6 actifs ;
- déplacement d’une créature entre équipe et réserve protégé par le même plafond ;
- nouveau test `v2/tests/capture-roster-migration.test.mjs` couvre alias, doublons possédés, quarantaine, priorité d’équipe et limite de 6.

Commits de l’étape :
- runtime roster Capture : `045380048c036d756441817fc4847ca5e0f09cee`
- régression migration roster : `aea61f485f82c26003152e65ced8efa1f58eff97`

CI fonctionnelle de l’étape : `34679980856` success.

## Priorités ouvertes

1. prochaine étape Capture : brancher ce roster dans `capture.js` et préparer l’initialisation lazy du mode depuis l’accueil sans bootstrap global ;
2. ensuite poursuivre l’audit/liaison des assets Capture, objets de capture et capacités exactes ;
3. ne construire le moteur de combat dynamique complet qu’après définition détaillée de son comportement ;
4. avant de déclarer RPG terminé, faire la passe finale dédiée assets/visuels/PWA/cache/parité legacy/tests.
