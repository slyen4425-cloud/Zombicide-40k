# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome et très avancé ; le chantier Capture est volontairement mis en pause pour concentrer la suite sur un RPG réellement testable par l'utilisateur.
- Nouveau cap prioritaire : obtenir rapidement un flux RPG jouable/testable sur téléphone avant de reprendre les finitions Capture.

## RPG — état testable en cours

- Le parcours Accueil → RPG → choix rôle appareil → page RPG est raccordé.
- L'onglet Donjon peut créer une partie test à partir du World Builder courant.
- Si des héros RPG actifs existent, la partie test utilise exclusivement ces héros et leurs vraies stats, ressources, compétences, inventaire et équipement.
- Si aucun héros n'est configuré, le bouton déclenche une mini-démo strictement en mémoire : `Aventurier de test` contre `Squelette de test`.
- La démo possède des IDs déterministes, 1 ressource PV, 1 statistique d'initiative, 1 attaque joueur et 1 attaque ennemi ; elle utilise le vrai moteur Donjon/combat et non un mock d'interface.
- Le squelette de démo est injecté uniquement dans le layout temporaire de la salle de départ, puis matérialisé dans le vrai `roomRuntime`.
- L'univers de démo est conservé seulement dans la session Donjon courante afin que les compétences, l'IA, la règle de KO et les noms soient disponibles pendant le combat.
- Aucun contenu de démo n'est écrit dans l'éditeur ou le stockage ; dès que des héros configurés existent, ils prennent toujours priorité sur la démo.
- La vue Donjon affiche une vraie grille de salle basée sur le layout actuel et les positions du runtime spatial.
- La grille rend le terrain, les cases bloquées, portes, interactions/marqueurs, obstacles simples et les pions héros/ennemis.
- La mini-démo utilise des positions temporaires déterministes : héros case 2,2 ; squelette case 5,2.
- Le parcours de combat complet de cette mini-démo est couvert jusqu'à la réconciliation de victoire : première Frappe, riposte automatique Griffe, seconde Frappe, victoire, PV héros synchronisés, squelette vaincu, loot généré et pion ennemi retiré du plateau.
- Le squelette de démo donne toujours `1 × Os ancien` (`demo_bone`) afin de rendre le bloc butin réellement testable.
- La grille est mobile-first et défile horizontalement si une salle est plus large que l'écran.
- Hors combat, la grille est maintenant interactive : toucher/clicker une case déplace le héros focalisé uniquement si le vrai pathfinding de salle l'autorise.
- Ce déplacement utilise le Spatial Core pour la position/allocation et `room-tactical-bridge.js` pour les chemins authored : cases bloquées, murs, portes fermées/verrouillées et détours sont donc respectés.
- Un mur ou une porte fermée bloque bien son arête ; un détour reste valide s'il existe et tient dans l'allocation de mouvement. Une porte ouverte restaure le pas direct.
- Chaque clic d'exploration peut cibler une case atteignable dans l'allocation courante du héros ; ce jalon ne crée pas encore de budget de tour d'exploration persistant.
- Le déplacement libre par clic est volontairement désactivé pendant un combat actif afin de ne jamais contourner le moteur tactique/timeline.
- Après un déplacement, le même état spatial est stocké dans `roomRuntime.spatial`, réaffiché sur la grille et transmis au prochain combat.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu'à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu'à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed / temps visuel / visibilité / overlay : success jusqu'à `34687557658`
- inspection/listes/états combat : success jusqu'à `34694675567`
- switch manuel de créature active : `34695849063` success
- persistance capacités joueur : `34696817140` success
- commande UI capacité : `34698467186` success
- déplacement tactique cardinal : `34698850672` success
- tentative de capture par orbe configurée explicitement : `34699118520` success
- retour spatial position/distance praticable : `34699538838` success
- notices non bloquantes des tentatives de capture : `34699910099` success
- RPG : création/lancement d'une session Donjon test depuis l'UI : `34700285175` success
- RPG : fallback démo en mémoire jusqu'au vrai `startDungeonCombat()` : `34700599970` success
- RPG : grille Donjon live + pions runtime sur mobile : `34701638751` success
- RPG : flux complet démo combat → victoire → loot → retrait du pion : `34701834544` success
- RPG : déplacement exploration par clic sur grille : `34702387637` success

## Dernière étape terminée

Cinquième jalon du chantier `RPG → build testable` : déplacement du héros directement sur la grille hors combat.

- nouveau module `v2/src/modes/rpg/dungeon-grid-movement.js` ;
- `moveFocusedDungeonHeroOnGrid()` ne déplace que le héros focalisé réellement présent, actif et non KO dans la salle courante ;
- l'allocation est lue avec `actorMovementAllowance()` du Spatial Core ;
- la distance/route est calculée par `shortestRoomPathDistance()` afin de respecter le vrai layout authored ;
- une cible hors portée ou inaccessible est refusée sans mutation ;
- succès : nouvelle position écrite via `setActorPosition()`, puis recopiée dans `roomRuntime.spatial` ;
- combat actif : refus explicite `dungeon-move-combat-active` ; le déplacement de tour de combat reste la responsabilité du moteur tactique existant ;
- `dungeon-gameplay-view.js` rend les cases tactiles/clavier uniquement hors combat, affiche un retour de déplacement/refus, puis rerend le pion à sa nouvelle position ;
- le `effectiveSpatial` utilisé pour la grille est également celui envoyé à `startDungeonCombat()` et `executeDungeonHeroSkill()` ;
- `dungeon-board.css` ajoute uniquement l'affordance tactile/focus, sans changer les règles.

Régression :
- nouveau `v2/tests/rpg-dungeon-grid-movement.test.mjs` ;
- couvre déplacement valide, portée, case bloquée, mur, porte fermée, porte ouverte, détour, allocation insuffisante, héros KO, combat actif et non-mutation des sources ;
- le premier run `34702292018` a échoué sur une attente de test incorrecte : le mur bloquait bien le pas direct mais un détour de 3 cases existait ;
- assertion corrigée pour protéger le vrai comportement pathfinding ;
- batterie complète finale : `34702387637` completed + success.

Commits de l'étape :
- contrôleur déplacement grille : `dd0118f0f62325bfceed5aa7779c5d5576650cc1`
- raccordement vue Donjon : `9c1e8606021e1bc23acfd54e1d9fba40bf4443d8`
- affordance CSS : `91aeae860f0aaa52edfdbb03227aa6849aa3d44e`
- régression initiale : `ca48a0592ff1e180a68c547a389d3230204c6a99`
- correction attente détour : `654961b2e73e69d7b90055a0d755e68d0ece50af`

## Priorités ouvertes

1. RPG testable : vérifier/raccorder les interactions de proximité utiles sur la vraie grille (portes/coffres/ennemis) sans dégrader le moteur stable ;
2. ajouter le minimum de sauvegarde/reprise nécessaire au test utilisateur ;
3. préparer ensuite une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer sur téléphone, sans toucher `main` ;
4. après le premier test utilisateur : corriger l'ergonomie/visuel réel observé, puis reprendre assets/audio/PWA/parité finale ;
5. Monster Capture reste en pause jusqu'à ce premier cycle de test RPG.
