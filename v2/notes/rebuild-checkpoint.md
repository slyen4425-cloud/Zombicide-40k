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
- Hors combat, la grille est interactive : toucher/clicker une case déplace le héros focalisé uniquement si le vrai pathfinding de salle l'autorise.
- Ce déplacement utilise le Spatial Core pour la position/allocation et `room-tactical-bridge.js` pour les chemins authored : cases bloquées, murs, portes fermées/verrouillées et détours sont donc respectés.
- Un mur ou une porte fermée bloque bien son arête ; un détour reste valide s'il existe et tient dans l'allocation de mouvement. Une porte ouverte restaure le pas direct.
- Chaque clic d'exploration peut cibler une case atteignable dans l'allocation courante du héros ; ce jalon ne crée pas encore de budget de tour d'exploration persistant.
- Le déplacement libre par clic est volontairement désactivé pendant un combat actif afin de ne jamais contourner le moteur tactique/timeline.
- Après un déplacement, le même état spatial est stocké dans `roomRuntime.spatial`, réaffiché sur la grille et transmis au prochain combat.
- Les interactions de proximité sont maintenant raccordées à la grille hors combat : seule la case exacte du héros expose ses actions disponibles.
- Les portes utilisent `openRoomDoor()` et les interactions authored utilisent `attemptRoomInteraction()` ; aucune seconde logique d'ouverture ou de jet n'a été créée dans l'UI.
- Les interactions attachées directement à une case, à une porte de cette case ou imbriquées sous une interaction de cette case sont récupérées via `interactionsAtCell()`.
- Une interaction déjà terminée disparaît des actions disponibles ; un héros KO/inactif n'a aucune action de grille ; toutes les actions de proximité disparaissent pendant un combat actif.
- Une interaction `chest` réussie est maintenant marquée `opened + completed` dans l'état de salle, ce qui rend le coffre non répétable ; ce jalon ne crée pas encore une nouvelle table de loot pour les coffres authored.
- Le layout de salle chargé par la page RPG est désormais matérialisé avec l'état runtime avant rendu/pathfinding : ouvrir une porte modifie immédiatement son état visuel et libère immédiatement son arête pour le déplacement.
- Le spatial remonté par la vue après un déplacement est désormais aussi conservé par `rpg-page.js`, ce qui évite de perdre la dernière position lors d'un rerender externe.

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
- RPG : interactions de proximité case/porte/coffre sur grille : `34702763858` success

## Dernière étape terminée

Sixième jalon du chantier `RPG → build testable` : interactions de proximité directement liées à la position du héros sur la grille.

- nouveau contrôleur `v2/src/modes/rpg/dungeon-grid-interactions.js` ;
- nouveau raccordement UI `v2/src/modes/rpg/dungeon-grid-interactions-ui.js` ;
- `focusedDungeonGridActions()` lit la position authoritative du héros focalisé et ne retourne que les portes/interactions présentes sur sa case exacte ;
- les interactions passent par `interactionsAtCell()`, donc les pièces attachées à une porte ou imbriquées restent compatibles ;
- `executeFocusedDungeonGridAction()` route une porte vers `openRoomDoor()` et une interaction vers `attemptRoomInteraction()` ;
- les résultats sont normalisés avec `roomRuntime` pour l'UI ;
- une interaction de coffre réussie est marquée ouverte/terminée et disparaît ensuite ;
- aucune interaction distante n'est proposée ;
- héros KO/inactif ou combat actif : aucune action de proximité disponible ;
- `rpg-page.js` matérialise maintenant le layout avec `materializeRoomLayout()` avant de le transmettre à la vue et au pathfinding ;
- après ouverture d'une porte, la grille/pathfinding voient donc immédiatement `state:'open'` ;
- l'état spatial émis par le déplacement est désormais conservé au niveau page.

Régression :
- nouveau `v2/tests/rpg-dungeon-grid-interactions.test.mjs` ;
- couvre même case obligatoire, interaction distante refusée, combat actif, ouverture porte, matérialisation runtime, déblocage immédiat du pathfinding, coffre ouvert/terminé et non-mutation des sources ;
- run initial `34702711346` échoué sur une incohérence de forme de retour (`runtime` vs `roomRuntime`) ;
- contrôleur normalisé, puis batterie complète finale : `34702763858` completed + success.

Commits de l'étape :
- contrôleur interactions grille : `0dc5b40ca3652e45a9ff46667917d72a6a5a83e5`
- contrôles UI proximité : `d5fa150074ccd94a3918e71da2fa3b412b549759`
- raccordement page + layout runtime : `85a92759f6434f527c10116105e0bb66ea831f03`
- régression : `23354e6c2de0d637e4bdeb5d2b04b5841fd0bb00`
- normalisation résultat runtime : `a08f91ada1733359b857455d14db07c0b6be1f27`

## Priorités ouvertes

1. RPG testable : ajouter le minimum de sauvegarde/reprise nécessaire pour conserver une partie de test (runtime, héros, spatial, combat si pertinent) sans polluer les définitions ;
2. préparer ensuite une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer sur téléphone, sans toucher `main` ;
3. après le premier test utilisateur : corriger l'ergonomie/visuel réel observé, puis reprendre assets/audio/PWA/parité finale ;
4. vérifier ensuite les interactions authored plus spécialisées (coffres avec loot/trap/puzzle/event attachés) à partir des données réelles, sans inventer de contenu ;
5. Monster Capture reste en pause jusqu'à ce premier cycle de test RPG.
