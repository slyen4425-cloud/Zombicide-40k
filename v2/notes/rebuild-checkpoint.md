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
- Le moteur spatial a maintenant été extrait dans `v2/src/core/spatial-engine.js`. RPG y accède via un re-export et Capture l’importe directement depuis Core : les deux modes utilisent donc réellement la même base sans dépendance Capture -> RPG.
- Un noyau neutre de World Builder/graphe a été ajouté dans `v2/src/core/world-graph.js` pour les mondes, zones, salles, passages, index et validation structurelle. Les règles RPG d’inventaire/traversée ne sont pas incluses dans ce noyau.
- Le futur combat Capture sera un runtime dédié : pas de `turnSequence` RPG, pas de timeline D100 RPG. La cible reste une exploration plus libre et un combat dynamique, à affiner plus tard.
- Bootstrap global Capture interdit : initialisation seulement à l’ouverture du mode.
- Bibliothèque Capture en cours de nettoyage : IDs canoniques uniques, alias legacy préservés, doublons connus fusionnés au niveau migration uniquement, familles générées legacy mises en quarantaine.
- Stockage Capture V2 exclusivement sous `gensrpg:v2:capture:*`; anciennes clés legacy en lecture seule pour migration.

## Jalons CI récents validés

- canonicalisation/déduplication créatures Capture : `34679224508` success
- stockage Capture isolé + partage spatial neutre : `34679382483` success
- contrats gameplay Capture : `34679477548` success
- squelette runtime Capture isolé + Core spatial partagé : `34679708898` success

## Dernière étape terminée

Premier squelette réel `v2/src/modes/capture/` :
- création de `v2/src/modes/capture/capture.js` ;
- contrat runtime explicite : mode `capture`, état gameplay isolé, Core spatial partagé, Core world-graph partagé, aucun runtime de tours RPG ;
- namespace de stockage Capture dédié pour profil, sauvegarde, roster, équipe et réserve ;
- création d’un état Capture minimal avec profil/joueur/dresseur, monde, état spatial, équipe active, réserve, rencontre et bataille ;
- exploration marquée libre et `turnSequence` fixé à `null` dans ce squelette ;
- déplacement Capture branché sur le moteur spatial Core neutre ;
- construction/validation d’un monde Capture branchée sur les primitives World Builder neutres ;
- limite d’équipe active de 6 protégée ;
- `v2/src/modes/rpg/spatial-engine.js` est maintenant un simple re-export du moteur spatial Core, afin d’éviter deux implémentations divergentes ;
- nouveau test `v2/tests/capture-runtime-scaffold.test.mjs` vérifie l’absence d’import vers `modes/rpg`, l’absence de dépendance à `turn-runtime`, le namespace Capture, le partage du même moteur spatial Core, le graphe de monde, le déplacement et la limite d’équipe.

Commits de l’étape :
- extraction moteur spatial Core : `8fa572476d75148fb4b262c93ce20562903677f7`
- RPG basculé sur Core spatial : `3cdda7070e8415329a2bcbdba9879e23f33211e2`
- primitives neutres World Builder : `3e2ebe5869171326c01c8c1cef05d3c83174d595`
- squelette Capture : `b21b269eef47411b49134c83747ec70cca17857e`
- régression runtime Capture : `4ac7d9dc18db20a6a4408c6c0badb488146f4d44`
- raffinement test isolation : `9d55b90af75ed651e71bf2a66888588960563cfb`

CI fonctionnelle de l’étape : `34679708898` success.

## Priorités ouvertes

1. prochaine étape Capture : séparer proprement roster/équipe/réserve en petits moteurs dédiés et brancher la canonicalisation des IDs de créatures ;
2. ensuite ajouter l’initialisation lazy du mode Capture depuis l’accueil sans bootstrap global ;
3. poursuivre l’audit des assets Capture, objets de capture et capacités exactes si des traces legacy supplémentaires sont retrouvées ;
4. ne construire le moteur de combat dynamique complet qu’après définition détaillée de son comportement ;
5. avant de déclarer RPG terminé, faire la passe finale dédiée assets/visuels/PWA/cache/parité legacy/tests.
