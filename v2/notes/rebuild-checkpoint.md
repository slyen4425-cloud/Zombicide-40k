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
- L'onglet Donjon peut désormais créer une partie test à partir du World Builder courant.
- Si des héros RPG actifs existent, la partie test utilise exclusivement ces héros et leurs vraies stats, ressources, compétences, inventaire et équipement.
- Si aucun héros n'est configuré, le bouton reste utilisable et déclenche maintenant une mini-démo strictement en mémoire : `Aventurier de test` contre `Squelette de test`.
- La démo possède des IDs déterministes, 1 ressource PV, 1 statistique d'initiative, 1 attaque joueur et 1 attaque ennemi ; elle utilise le vrai moteur Donjon/combat et non un mock d'interface.
- Le squelette de démo est injecté uniquement dans le layout temporaire de la salle de départ, puis matérialisé dans le vrai `roomRuntime`.
- L'univers de démo est conservé seulement dans la session Donjon courante afin que les compétences, l'IA, la règle de KO et les noms soient disponibles pendant le combat.
- Aucun `saveRpgUniverse`, `saveWorldDraft`, `saveRoomLayout`, `writeJson` ou stockage local n'est appelé par le fallback démo.
- Dès que des héros configurés existent, ils prennent toujours priorité sur la démo.
- La vue affiche un badge `Démo temporaire · aucune donnée enregistrée` lorsqu'elle utilise ce fallback.

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

## Dernière étape terminée

Deuxième jalon du chantier `RPG → build testable` : contenu de démonstration immédiatement jouable, sans polluer les données utilisateur.

- nouveau module `v2/src/modes/rpg/dungeon-demo-content.js` ;
- `createDungeonDemoUniverse()` construit un mini-univers déterministe uniquement en mémoire ;
- contenu : `demo_hero` / `Aventurier de test`, `demo_enemy` / `Squelette de test`, ressource `demo_hp`, initiative `demo_initiative`, compétence héros `demo_sword`, compétence ennemi `demo_claw` ;
- `createDungeonDemoLaunch()` clone le layout existant et ajoute uniquement dans la salle de départ une entité créature avec un vrai `createCreatureRuntime()` ;
- `createDungeonTestSession()` utilise ce fallback seulement quand aucun héros configuré n'existe et expose `demo:true` + l'univers temporaire ;
- le chemin normal avec héros configurés reste inchangé et retourne `demo:false` ;
- `rpg-page.js` conserve `currentDungeonUniverse` pendant la session pour que la vraie vue Donjon, les contrôles d'objets et les contrôles MJ utilisent les définitions temporaires durant la démo ;
- aucun contenu de démo n'est écrit dans l'éditeur ou le stockage.

Régression :
- `v2/tests/rpg-dungeon-test-session.test.mjs` vérifie le fallback démo, les IDs déterministes, l'absence de persistance, la non-mutation du monde/univers source et la priorité des héros configurés ;
- le test appelle réellement `startDungeonCombat()` et vérifie que le héros et le squelette entrent dans le vrai runtime de combat ;
- batterie complète : `34700599970` success.

Commits de l'étape :
- contenu démo en mémoire : `00eda9b093bca8b644b95c998e638ecacf08f362`
- fallback du constructeur de session : `674d593e98d41141ed4617f7800284d14dfa67dd`
- raccordement de l'univers temporaire à la page RPG : `442f10ef2033f1b3ad8557660e59e735cf6a6867`
- régression : `249477f1234ffae60d60fabede46e220f59bee10`

## Priorités ouvertes

1. RPG testable : afficher visuellement la salle/grille Donjon et les positions héros/ennemis de façon claire sur mobile ;
2. vérifier ensuite le flux complet salle → ennemi → engager combat → compétence → tour ennemi → victoire/loot dans la page réelle ;
3. ajouter le minimum de sauvegarde/reprise nécessaire au test utilisateur ;
4. préparer ensuite une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer sur téléphone, sans toucher `main` ;
5. seulement après ce test utilisateur : reprendre assets/audio/PWA/parité finale puis le chantier Capture.
