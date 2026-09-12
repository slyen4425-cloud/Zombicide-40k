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
- Les objets de capture sont maintenant isolés dans `v2/src/modes/capture/items.js` ; les 4 IDs legacy confirmés sont `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`.
- Les coefficients de capture de ces orbes restent volontairement `pending_recovery_or_rebalance` : aucune valeur manquante n’est inventée.
- Le bonus de capture sous 30 % PV reste une règle produit confirmée, mais son multiplicateur exact reste à définir/récupérer.
- Les capacités Capture ont désormais leur runtime propre `v2/src/modes/capture/abilities.js` avec charges par instance, coûts et support de cooldown futur pour le combat dynamique.
- Les anciennes familles `lib_*` / `cap_*` sont considérées comme traces legacy ; aucune capacité RPG mélangée n’est importée automatiquement.

## Jalons CI récents validés

- canonicalisation/déduplication créatures Capture : `34679224508` success
- stockage Capture isolé + partage spatial neutre : `34679382483` success
- contrats gameplay Capture : `34679477548` success
- squelette runtime Capture isolé + Core spatial partagé : `34679708898` success
- migration roster/équipe/réserve Capture : `34679980856` success
- branchement roster + ouverture lazy Capture : `34680539893` success
- premier registre canonique d’assets Capture : `34680830787` success
- objets Capture + runtime charges capacités : `34681113738` success

## Dernière étape terminée

Objets de capture et capacités/charges :
- nouveau `v2/docs/capture-items-abilities-map.json` séparant clairement traces legacy confirmées, règles produit validées et réglages encore inconnus ;
- les 4 orbes historiques sont reconnues sans coefficient inventé ;
- nouveau `v2/src/modes/capture/items.js` avec bibliothèque Capture propre, résolution d’alias, inventaire isolé et consommation immutable ;
- un objet legacy inconnu est refusé/quarantainable au lieu de tomber sur l’inventaire RPG ;
- nouveau `v2/src/modes/capture/abilities.js` avec normalisation des capacités, charges par créature possédée, coûts, cooldowns et consommation immutable ;
- aucune dépendance `modes/rpg`, aucun D100, aucun `turnSequence` ;
- nouveau test `v2/tests/capture-items-abilities.test.mjs` protège les 4 orbes, le seuil 30 %, l’absence de coefficients inventés, l’isolation RPG et les charges/cooldowns.

Commits de l’étape :
- map objets/capacités : `4091d222a2dfa3bb77b4609f66e1e200b4db236d`
- runtime objets Capture : `d8e7ebc05d136d28a2d76c25f6b5ba2e458e622a`
- runtime capacités/charges : `fe268f542b424f7b5a73ce0e11cedf7786ef7eff`
- régression objets/capacités : `c3a74e100545d01009b9651b7896970e8730151c`

## Priorités ouvertes

1. prochaine étape Capture : préparer les biomes/rencontres et la boucle d’exploration libre sur le World Builder partagé ;
2. ensuite brancher le calcul de tentative de capture autour du taux propre à l’espèce, du seuil <30 % PV et des orbes, en gardant les coefficients configurables tant qu’ils ne sont pas validés ;
3. importer physiquement les arts principaux + icônes Capture quand les fichiers sont disponibles pour le dépôt, puis renseigner les chemins du registre sans doublonner les alias ;
4. ne construire le moteur de combat dynamique complet qu’après définition détaillée de son comportement ;
5. avant de déclarer RPG terminé, faire la passe finale dédiée assets/visuels/PWA/cache/parité legacy/tests.
