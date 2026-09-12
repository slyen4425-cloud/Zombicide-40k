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
- Le roster est intégré dans l’état `capture.js` avec `roster`, `activeTeam`, `reserve` et `quarantine`.
- La carte Capture de l’accueil est activée mais le code du mode est chargé uniquement par `import()` après ouverture explicite de Capture.
- Registre d’assets Capture canonique ajouté dans `v2/docs/capture-creature-assets.json` avec une seule paire visuelle par espèce canonique et aucun doublon par alias legacy.
- Les visuels Capture validés côté projet/utilisateur ne sont pas encore importés physiquement dans la V2 ; leur statut est `pending_import`, sans nom de fichier inventé.
- Emplacement cible réservé : `v2/assets/capture/creatures/`.
- `v2/src/modes/capture/assets.js` résout les anciens IDs vers l’espèce canonique et interdit tout fallback vers les arts RPG/Dungeon.

## Jalons CI récents validés

- canonicalisation/déduplication créatures Capture : `34679224508` success
- stockage Capture isolé + partage spatial neutre : `34679382483` success
- contrats gameplay Capture : `34679477548` success
- squelette runtime Capture isolé + Core spatial partagé : `34679708898` success
- migration roster/équipe/réserve Capture : `34679980856` success
- branchement roster + ouverture lazy Capture : `34680539893` success
- premier registre canonique d’assets Capture : `34680830787` success

## Dernière étape terminée

Structure et résolution canonique des visuels Monster Capture :
- nouveau `v2/docs/capture-creature-assets.json` couvrant toutes les espèces canoniques actuelles ;
- nouveau `v2/src/modes/capture/assets.js` pour résoudre ID canonique ou alias legacy vers un unique enregistrement visuel ;
- anciens IDs comme `crea_embercub` et `crea_braiseau` convergent vers la même paire d’assets Braiseau, sans copie physique supplémentaire ;
- les familles générées/non validées restent hors registre canonique ;
- aucun fallback vers `assets/dungeon/creatures` ou des arts RPG ;
- les visuels ne sont pas déclarés absents : ils sont explicitement `pending_import` car ils n’ont pas encore été ajoutés physiquement dans le dépôt V2 ;
- noms de fichiers non inventés ; les chemins seront renseignés seulement lors de l’import réel des arts validés ;
- nouveau test `v2/tests/capture-creature-assets.test.mjs` verrouille les politiques de déduplication, d’isolation et d’import en attente.

Commits de l’étape :
- registre canonique assets : `3c9f7fb40ce0ce976a02969f5f885bd7ce21dd10`
- resolver assets Capture : `9d4feeccde9fcd94208f23606288352dea72dc92`
- première régression assets : `fbf470e25f864fc68b48ac26a184cb4b7da77b80`
- clarification visuels en attente d’import : `78c7b1fc9b2ad044a2c67997674b02e285792808`
- régression `pending_import` : `d744e55afaf9e8cb6f409a09651a6a28ae905685`

## Priorités ouvertes

1. prochaine étape Capture : reconstruire les objets de capture et capacités/charges avec valeurs confirmées uniquement ;
2. ensuite préparer les biomes/rencontres et la boucle d’exploration libre sur le World Builder partagé ;
3. importer physiquement les arts principaux + icônes Capture quand les fichiers sont disponibles pour le dépôt, puis renseigner les chemins du registre sans doublonner les alias ;
4. ne construire le moteur de combat dynamique complet qu’après définition détaillée de son comportement ;
5. avant de déclarer RPG terminé, faire la passe finale dédiée assets/visuels/PWA/cache/parité legacy/tests.
