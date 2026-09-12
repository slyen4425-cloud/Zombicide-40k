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
- La vue Donjon affiche désormais une vraie grille de salle en lecture seule, basée sur le layout actuel et les positions du runtime spatial.
- La grille rend le terrain, les cases bloquées, portes, interactions/marqueurs, obstacles simples et surtout les pions héros/ennemis.
- Les positions ne sont jamais recalculées par l'UI : le renderer lit `spatial.positions`, avec seulement les coordonnées explicites des entités comme fallback pour les ennemis authored.
- La mini-démo reçoit des positions déterministes temporaires dans son runtime spatial : héros case 2,2 ; squelette case 5,2.
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

## Dernière étape terminée

Troisième jalon du chantier `RPG → build testable` : affichage réel de la salle/grille et des pions de la partie.

- nouveau module `v2/src/modes/rpg/dungeon-room-grid-view.js` ;
- `buildDungeonRoomGridModel()` lit le layout de salle, le `roomRuntime` et le runtime spatial sans modifier aucune donnée ;
- héros affichés uniquement s'ils sont réellement localisés dans la salle courante et disposent d'une position runtime valide ;
- ennemis affichés uniquement s'ils sont actifs, non vaincus/non retirés, dans la salle courante et disposent d'une position spatiale ou de coordonnées explicites d'entité ;
- `renderDungeonRoomGrid()` produit une grille lecture seule avec terrain, portes, marqueurs/interactions, obstacles et pions ;
- nouveau style `v2/src/ui/dungeon-board.css`, chargé par `v2/index.html`, dimensionné pour téléphone avec scroll horizontal contrôlé ;
- `dungeon-gameplay-view.js` affiche le plateau directement dans l'onglet Donjon avant les blocs état/combat/passages ;
- le renderer utilise le `spatial` fourni à la vue ou, pour la démo, le `roomRuntime.spatial` temporaire ;
- `createDungeonTestSession()` initialise uniquement pour la démo un `createSpatialState()` avec `demo_hero` en 1,1 interne (case affichée 2,2) et `demo_enemy_instance` en 4,1 interne (case affichée 5,2).

Régression :
- `v2/tests/rpg-dungeon-room-grid-view.test.mjs` vérifie 64 cases sur le layout 8×8, positions exactes des deux pions, terrain, porte, obstacle, noms et raccordement à la vue Donjon ;
- le test protège aussi le chargement du CSS dédié ;
- batterie complète : `34701638751` completed + success.

Commits de l'étape :
- renderer grille : `9cb0ef2f5891804b4d30099e9c5f11f20e58cea5`
- CSS mobile : `4367c369ddfe2804f44e829848f98f2f2c96ce58`
- chargement CSS : `ee20d52c58fb2a76c4a0a5484efe0b862665b7e5`
- positions runtime démo : `9991a4cd7eb52b421c96023482777fae2e17a046`
- raccordement vue Donjon : `96e4b46ff025f46b5667de253454069548c24dca`
- régression : `275a78e6e7f40e2068b63c2562efa0d51262aa6e`

## Priorités ouvertes

1. RPG testable : vérifier/raccorder maintenant le flux complet salle → ennemi → engager combat → compétence → tour ennemi → victoire/loot dans la page réelle, en s'assurant que la grille reste cohérente après KO/victoire ;
2. raccorder ensuite le déplacement du héros à la grille via le Spatial Core existant, sans créer une seconde logique de mouvement ;
3. ajouter le minimum de sauvegarde/reprise nécessaire au test utilisateur ;
4. préparer ensuite une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer sur téléphone, sans toucher `main` ;
5. seulement après ce test utilisateur : reprendre assets/audio/PWA/parité finale puis le chantier Capture.
