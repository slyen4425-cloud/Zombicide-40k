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
- La vue Donjon affiche une vraie grille de salle en lecture seule, basée sur le layout actuel et les positions du runtime spatial.
- La grille rend le terrain, les cases bloquées, portes, interactions/marqueurs, obstacles simples et les pions héros/ennemis.
- Les positions ne sont jamais recalculées par l'UI : le renderer lit `spatial.positions`, avec seulement les coordonnées explicites des entités comme fallback pour les ennemis authored.
- La mini-démo utilise des positions temporaires déterministes : héros case 2,2 ; squelette case 5,2.
- Le parcours de combat complet de cette mini-démo est maintenant couvert jusqu'à la réconciliation de victoire : première Frappe, riposte automatique Griffe, seconde Frappe, victoire, PV héros synchronisés, squelette vaincu, loot généré et pion ennemi retiré du plateau.
- Le squelette de démo donne désormais toujours `1 × Os ancien` (`demo_bone`) afin de rendre le bloc butin réellement testable.
- La grille est mobile-first et défile horizontalement si une salle est plus large que l'écran.

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

## Dernière étape terminée

Quatrième jalon du chantier `RPG → build testable` : verrouillage du parcours complet de combat de la mini-démo.

- `dungeon-demo-content.js` contient maintenant l'objet temporaire `demo_bone` / `Os ancien` ;
- `Squelette de test` possède un drop déterministe à 100 %, quantité 1 ;
- nouveau test d'intégration `v2/tests/rpg-dungeon-demo-flow.test.mjs` ;
- le test crée la vraie session Donjon de démo à partir d'un univers vide ;
- il vérifie que la grille initiale contient bien `demo_hero` + `demo_enemy_instance` ;
- il appelle le vrai `startDungeonCombat()` ;
- première `Frappe` : squelette 8 → 4 PV et passage du tour au squelette ;
- `advanceDungeonEnemyTurns()` fait réellement jouer `Griffe` et descend le héros 12 → 10 PV ;
- seconde `Frappe` : squelette 4 → 0 PV, KO, combat `ended`, victoire héros ;
- `reconcileDungeonCombatResult()` marque la salle nettoyée, synchronise les 10 PV du héros et marque l'ennemi vaincu ;
- loot vérifié : `[{itemId:'demo_bone',quantity:1}]` ;
- `activeDungeonEnemies()` retourne ensuite 0 ;
- le modèle de grille final ne contient plus que `demo_hero`, ce qui protège explicitement la disparition du pion ennemi après victoire.

Régression :
- batterie complète : `34701834544` completed + success.

Commits de l'étape :
- loot de démonstration déterministe : `81246f2d7ffb843055468607957d0ca15690237c`
- test d'intégration du flux complet : `dc3d7da4f2c6a837258af684deeb4e432dcc066c`

## Priorités ouvertes

1. RPG testable : raccorder maintenant le déplacement du héros à la grille via le Spatial Core existant, sans créer une seconde logique de mouvement ;
2. vérifier ensuite les interactions de proximité utiles sur la vraie grille (portes/coffres/ennemis) sans dégrader le moteur stable ;
3. ajouter le minimum de sauvegarde/reprise nécessaire au test utilisateur ;
4. préparer ensuite une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer sur téléphone, sans toucher `main` ;
5. seulement après ce test utilisateur : reprendre assets/audio/PWA/parité finale puis le chantier Capture.
