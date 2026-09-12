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
- La démo utilise le vrai moteur Donjon/combat et non un mock d'interface.
- La vue Donjon affiche une vraie grille de salle basée sur le layout actuel et les positions du runtime spatial.
- La mini-démo utilise des positions temporaires déterministes : héros case 2,2 ; squelette case 5,2.
- Le parcours de combat complet de cette mini-démo est couvert jusqu'à la victoire, synchronisation des PV, génération du loot et retrait du pion ennemi.
- Le squelette de démo donne toujours `1 × Os ancien` (`demo_bone`) afin de rendre le bloc butin testable.
- Hors combat, toucher/clicker une case déplace le héros focalisé uniquement si le vrai pathfinding de salle l'autorise.
- Ce déplacement utilise le Spatial Core et `room-tactical-bridge.js` : cases bloquées, murs, portes fermées/verrouillées et détours sont respectés.
- Le déplacement libre par clic est désactivé pendant un combat actif.
- Après déplacement, le même état spatial est stocké dans `roomRuntime.spatial`, réaffiché sur la grille et transmis au prochain combat.
- Les interactions de proximité sont raccordées à la grille hors combat : seule la case exacte du héros expose ses actions disponibles.
- Les portes utilisent `openRoomDoor()` et les interactions authored utilisent `attemptRoomInteraction()` ; aucune seconde logique d'ouverture ou de jet n'a été créée dans l'UI.
- Une interaction déjà terminée disparaît des actions disponibles ; héros KO/inactif ou combat actif : aucune interaction de grille.
- Une interaction `chest` réussie est marquée `opened + completed` dans l'état de salle.
- Le layout de salle est matérialisé avec l'état runtime avant rendu/pathfinding : ouvrir une porte modifie immédiatement son état visuel et libère immédiatement son arête.
- Le spatial remonté par la vue après un déplacement est conservé par `rpg-page.js`.
- Une sauvegarde/reprise minimale de la partie test existe maintenant via le provider de stockage V2, sans écrire ni remplacer les définitions de l'éditeur.
- Le snapshot de test est versionné et contient : univers courant (y compris univers de démo), roomRuntime, heroRuntimes, spatial, combat, inventaire, lootRecipients, eventWorld, spatialConfig et flag `demo`.
- La page Donjon propose `Sauvegarder` lorsqu'une session est active et `Reprendre` lorsqu'aucune session n'est chargée.
- La sauvegarde est volontairement manuelle pour ce premier cycle de test utilisateur ; aucun autosave permanent n'est encore activé.
- Une reprise restaure aussi l'univers temporaire de démo, ce qui permet de fermer/réouvrir l'app même si l'éditeur est vide.

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
- RPG : sauvegarde/reprise minimale de partie test : `34703227141` success

## Dernière étape terminée

Septième jalon du chantier `RPG → build testable` : sauvegarde/reprise minimale d'une partie test.

- nouveau module `v2/src/modes/rpg/dungeon-test-save.js` ;
- stockage via le provider V2 existant, scope `rpg-dungeon-test-session`, id `latest` ;
- format versionné `version: 1` ;
- snapshot détaché avec `universe`, `roomRuntime`, `heroRuntimes`, `spatial`, `combat`, `inventory`, `lootRecipients`, `eventWorld`, `spatialConfig`, `demo` et `savedAt` ;
- validation stricte avant reprise ;
- nouveau module UI `v2/src/modes/rpg/dungeon-test-save-ui.js` ;
- session active : bouton `Sauvegarder` ; aucune session : bouton `Reprendre` ;
- la reprise restaure toutes les briques de session puis rouvre directement l'onglet Donjon ;
- le lancement d'une nouvelle partie test conserve maintenant explicitement `out.spatial` au niveau page ;
- le texte du bandeau démo précise désormais que seules les définitions restent temporaires dans l'éditeur, car la session peut être sauvegardée localement ;
- aucun autosave n'est activé à ce stade : comportement volontairement simple pour le premier test utilisateur.

Régression :
- nouveau `v2/tests/rpg-dungeon-test-save.test.mjs` ;
- couvre construction du snapshot, round-trip provider mémoire, isolation contre mutations après écriture/lecture, persistance de l'univers de démo, suppression de sauvegarde, refus d'un runtime absent et présence du câblage UI/page ;
- batterie complète : `34703227141` completed + success.

Commits de l'étape :
- moteur snapshot/save/load : `f943ce82d1ad6fa5676ed699685b250656d9d5de`
- contrôles UI sauvegarde/reprise : `124b8afce84afa8d839054663110f64a68443d06`
- raccordement page RPG : `26cb728d1d1ed5901a2ec2a11f1599f6dc4a1468`
- régression : `21ca0a6bd12be31a741a13478f4c490191edf560`

## Priorités ouvertes

1. Préparer une URL/preview V2 sûre pour que l'utilisateur puisse réellement essayer le RPG sur téléphone, sans toucher `main` ;
2. vérifier que cette preview charge bien `/v2/`, ses CSS/modules et la persistance locale sur mobile ;
3. après le premier test utilisateur : corriger l'ergonomie/visuel réel observé ;
4. ensuite reprendre assets/audio/PWA/parité finale et les interactions authored spécialisées (coffres avec loot/trap/puzzle/event attachés) ;
5. Monster Capture reste en pause jusqu'à ce premier cycle de test RPG.
