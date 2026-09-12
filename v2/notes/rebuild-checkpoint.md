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
- Le runtime roster Capture existe dans `v2/src/modes/capture/roster.js` : migration d’IDs, instances possédées distinctes, équipe max 6, réserve, quarantaine des espèces inconnues/non canoniques.
- Le roster est maintenant intégré dans l’état `capture.js` avec `roster`, `activeTeam`, `reserve` et `quarantine`.
- La carte Capture de l’accueil est activée mais le code du mode est chargé uniquement par `import()` après ouverture explicite de Capture.

## Jalons CI récents validés

- canonicalisation/déduplication créatures Capture : `34679224508` success
- stockage Capture isolé + partage spatial neutre : `34679382483` success
- contrats gameplay Capture : `34679477548` success
- squelette runtime Capture isolé + Core spatial partagé : `34679708898` success
- migration roster/équipe/réserve Capture : `34679980856` success
- branchement roster + ouverture lazy Capture : `34680539893` success

## Dernière étape terminée

Branchement roster dans le runtime Capture + entrée lazy depuis l’accueil :
- `capture.js` importe maintenant uniquement son moteur `roster.js` propre au mode ;
- `createCaptureModeState()` porte roster, équipe active, réserve et quarantaine ;
- `initializeCaptureRoster()` importe les anciennes captures via canonicalisation puis répartit équipe/réserve ;
- `moveCaptureRosterCreature()` déplace une instance équipe ↔ réserve sans perdre le roster global ;
- nouveau `v2/src/modes/capture/capture-page.js` comme point d’entrée UI minimal du mode ;
- la carte Capture de `app.js` est maintenant active ;
- aucun import statique Capture dans `app.js` ;
- ouverture via `await import('./modes/capture/capture-page.js')` uniquement après clic utilisateur ;
- aucun ancien seed `ensureBuiltinMonsterCapture*` n’est exécuté au démarrage ;
- nouveau test `v2/tests/capture-lazy-entry.test.mjs` protège le lazy-load, l’isolation RPG, la migration roster et la quarantaine.

Commits de l’étape :
- intégration roster dans état Capture : `40960cae17ae53a99c604fc4f177b04d7b7cbbbf`
- page Capture lazy : `d91a99e6c5f6531f5f9652b0ef18a705aecd1281`
- accueil Capture en import dynamique : `0bc79edcfced09bcf1ea298e825dcaf64f7ec2e6`
- régression lazy entry : `26201e8a294cd6f7009dbd34dd25b3aef1999404`

CI fonctionnelle de l’étape : `34680539893` success.

## Priorités ouvertes

1. prochaine étape Capture : audit/liaison des assets réels des créatures et icônes avec la table canonique, sans importer les doublons legacy ;
2. ensuite reconstruire les objets de capture et les capacités/charges avec valeurs confirmées uniquement ;
3. préparer les biomes/rencontres et la boucle d’exploration libre sur le World Builder partagé ;
4. ne construire le moteur de combat dynamique complet qu’après définition détaillée de son comportement ;
5. avant de déclarer RPG terminé, faire la passe finale dédiée assets/visuels/PWA/cache/parité legacy/tests.
