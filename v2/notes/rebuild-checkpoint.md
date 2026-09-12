# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture avancé : roster/équipe/réserve, migrations IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts, réactions/esquive, temps abstrait, scheduler/driver, UI events/notices, overlay/inspection, commandes gameplay et résumé spatial.
- Le chantier Capture est volontairement mis en pause à ce checkpoint pour concentrer la suite sur un RPG réellement testable par l'utilisateur.
- Registre assets Capture lazy, aucun fallback RPG/Dungeon ; les 14 visuels restent `pending_import` avec `path:null`.
- Les tentatives de capture alimentent le feed non bloquant existant : réussite, échec et configuration indisponible produisent des notices `aria-live` sans popup ni pause gameplay.
- Nouveau cap prioritaire : obtenir rapidement un flux RPG jouable/testable sur téléphone avant de reprendre les finitions Capture.

## RPG — état testable en cours

- Le parcours Accueil → RPG → choix rôle appareil → page RPG est déjà raccordé.
- L'onglet Donjon savait afficher et piloter un runtime existant, mais aucun chemin UI ne créait encore la partie : `roomRuntime` restait `null` et `heroRuntimes` vide, d'où `Aucune partie Donjon active`.
- Ce blocage est désormais levé avec `createDungeonTestSession()` et un bouton `Lancer une partie test` dans l'onglet Donjon.
- La partie test utilise uniquement le World Builder actuel et les héros RPG configurés ; elle n'invente aucune définition gameplay et ne crée aucune sauvegarde persistante.
- Les héros désactivés sont exclus ; les héros actifs reçoivent leur vrai `createHeroRuntime()` avec stats, ressources, inventaire/équipement de départ et compétences configurés.
- Le runtime Donjon est créé à partir de la salle de départ du monde courant avec `createDungeonRuntime()` ; le premier héros actif devient héros focalisé.
- S'il n'existe aucun héros configuré, le bouton est désactivé et l'UI explique quoi faire.
- Une fois la session créée, l'onglet Donjon se recharge sur le vrai runtime et peut utiliser les systèmes déjà construits : passages, événements, PNJ, loot et combats selon le contenu du monde.

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

## Dernière étape terminée

Premier jalon du chantier `RPG → build testable` :
- nouveau module `v2/src/modes/rpg/dungeon-test-session.js` ;
- contrat : utilise le monde configuré + les héros configurés, ne persiste rien et n'invente aucune définition ;
- `createDungeonTestSession()` valide présence d'au moins un héros actif et validité du World Builder ;
- construit les `heroRuntimes` réels via `createHeroRuntime()` ;
- construit le runtime de salle via `createDungeonRuntime()` à partir de la salle de départ ;
- `rpg-page.js` ajoute dans l'onglet Donjon un bloc `Partie test` et le bouton `Lancer une partie test` lorsqu'aucun runtime n'est chargé ;
- si aucun héros n'existe, le bouton est désactivé avec message explicite ;
- après lancement réussi, le runtime Donjon + les heroRuntimes sont injectés dans la vraie vue gameplay, sans sauvegarde persistante.

Régression :
- `v2/tests/rpg-dungeon-test-session.test.mjs` couvre absence de héros, création réelle d'une session, exclusion des héros désactivés, stats/ressources du runtime et non-mutation des définitions ;
- le même test protège la présence du bouton UI et l'absence de sauvegarde forcée ;
- batterie complète : `34700285175` success.

Commits de l'étape :
- constructeur session test : `e751598557dc003d1e7dcc0e5ab7e6d3aad3fe70`
- raccordement UI Donjon : `7d2aafb926a7ab3f0963d931c45536235d738ef8`
- régression : `89e8e7524eb741ed308ba522a8b58be92886c2eb`

## Priorités ouvertes

1. RPG testable : fournir un contenu de démonstration minimal immédiatement jouable si l'univers local est encore vide, sans écraser les données utilisateur ;
2. afficher visuellement la salle/grille Donjon et les positions héros/ennemis de façon claire sur mobile ;
3. vérifier le flux complet salle → ennemi → engager combat → compétence → tour ennemi → victoire/loot ;
4. ajouter le minimum de sauvegarde/reprise nécessaire au test utilisateur ;
5. préparer ensuite une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer sur téléphone, sans toucher `main` ;
6. seulement après ce test utilisateur : reprendre assets/audio/PWA/parité finale puis le chantier Capture.
