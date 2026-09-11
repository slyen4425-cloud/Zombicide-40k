# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils. La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-11

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Noyau générique de jets : D100/D20/autres dés, roll-under/roll-over, stat/difficulté/modificateur partagés par les moteurs.
- Compétences, pièges, événements et interactions de salle peuvent référencer des jets réutilisables; les anciens formats inline restent compatibles.
- Créateur de salle : portes verrouillées par objet, interactions attachables, sélecteur de jet lisible, tentatives persistées en runtime, obstacles configurables sans saisie technique.
- Éditeur RPG : sélecteur de jet réutilisable dans les compétences et éditeur dédié des pièges avec détection/désarmement séparés.
- Combat tactique : mouvement, portée, ligne de vue, murs/portes, arme équipée, couverture directionnelle et modificateurs tactiques issus des équipements réellement équipés.
- Statuts persistants : les modificateurs de stats expirent maintenant par delta/source au lieu de restaurer une ancienne valeur absolue; plusieurs bonus/malus peuvent coexister sur la même stat sans s'écraser.
- Perception/furtivité : layout runtime matérialisé, sans confondre distance de vision et chemin de déplacement.
- Bestiaire : loot idempotent, drops persistants, destinataire explicite, boss key attribuée seulement après défaite réelle.
- Quêtes : runtime persistant + signaux salle/interactions raccordés directement au runtime de donjon + journal joueur mobile + UI PNJ raccordée au runtime salle/allié.
- UI PNJ/allié : dialogue, actions de quête, recrutement, invocation et renvoi utilisent les moteurs existants sans duplication.
- Les événements issus des actions allié sont mis en file FIFO dans `roomRuntime.eventQueue`; cette file est reliée au runtime de salle, exécutée automatiquement via `event-engine.js`, et reprend après un choix sans double résolution.
- La vue `🎮 Donjon` affiche en direct l’état de salle + le journal de quêtes à partir de `roomRuntime.questRuntime`.
- Le picker de destinataire de loot est intégré directement dans la vue Donjon : les butins disponibles sont listés, attribuables à un héros/groupe lisible, et disparaissent après attribution idempotente.
- Les interactions PNJ/allié et les choix d’événements sont surfacés directement dans la vue Donjon, tout en réutilisant `room-npc-interaction-ui.js` et `room-event-runtime.js`.
- Les textes et conséquences des événements sont présentés directement dans la vue Donjon à partir du log produit par `event-engine.js`, sans modifier ni dupliquer l’exécution.
- Les passages authored du World Builder sont directement jouables dans la vue Donjon via le vrai `room-runtime`; objets requis et conditions filtrent les boutons avant traversée.
- Le runtime Donjon suit plusieurs héros dans des salles différentes : `heroLocations`, focus de héros, transitions individuelles et historique propre à chaque héros, avec retour arrière sans ré-instancier la salle ni respawn.
- La vue Donjon est raccordée à `heroLocations` : choix du héros actif par nom, salle affichée propre à ce héros, et passage appliqué uniquement au héros focalisé.
- Le démarrage d'un vrai combat de salle dispose d'un bridge dédié : ennemis actifs de la salle + héros réellement présents, puis filtre de proximité spatiale avant création du vrai `combat-engine` D100.
- Le vrai combat de salle est monté dans la vue Donjon : les ennemis actifs sont affichés, le héros focalisé peut engager, et le combat créé est conservé comme combat Donjon courant sans passer par le laboratoire de test.
- La fin du combat peut maintenant être réconciliée vers les runtimes réels : états héros synchronisés, ennemis KO marqués vaincus dans la bonne salle, loot/boss-key déclenchés via le moteur de spawn existant, salle libérée sans respawn et héros vivants ailleurs préservés.
- World Builder : objets requis et conditions via menus lisibles, sans saisie d'ID brut.
- Audio RPG : lifecycle de salle, sortie navigateur, session audio unique et cleanup.
- Stockage V2 : localStorage + provider abstrait local/distant; backend cloud réel différé.

## Jalons CI récents validés

- loot destinataire moteur : `34638378209` success
- clé de boss à la défaite : `34638633003` success
- passage verrouillé par objet : `34639084070` success
- portes persistantes / ouverture par clé : `34640631070` success
- layout runtime tactique/perception : `34641208857` success
- noyau générique de jets/tests : `34641462386` success
- éditeur générique de jets/tests : `34641810586` success
- jets réutilisables événements : `34642604129` success
- jets réutilisables interactions de salle : `34642816595` success
- tentatives d'interaction persistantes : `34642980536` success
- sélecteur jet Créateur de salle : `34643290918` success
- sélecteur jet compétences : `34643616351` success
- éditeur pièges : `34643853871` success
- picker destinataire de loot : `34644185299` success
- checkpoint picker loot : `34644216194` success
- runtime lifecycle quêtes : `34644426041` success
- bridge salle/interactions -> quêtes : `34644955703` success
- raccord automatique runtime donjon -> quêtes : `34645470548` success
- journal de quêtes joueur : `34645656619` success
- UI PNJ + actions de quête : `34645853645` success
- raccord UI PNJ -> runtime salle/allié : `34646083537` success
- actions recrutement/invocation/renvoi dans UI PNJ : `34646281587` success
- file événements actions allié : `34646526482` success
- orchestrateur file événements RPG : `34646783527` success
- checkpoint orchestrateur : `34646850393` success
- bridge `roomRuntime.eventQueue` + consommation automatique : `34647190339` success
- checkpoint runtime événements auto : `34647252406` success
- vue gameplay Donjon + journal quêtes live : `34647506351` success
- checkpoint vue Donjon : `34647567121` success
- distribution loot dans vue Donjon : `34647800892` success
- checkpoint loot Donjon : `34647858146` success
- interactions PNJ + choix événements dans vue Donjon : `34648252721` success
- checkpoint PNJ/choix : `34648320258` success
- présentation textes/conséquences événements : `34648630875` success
- checkpoint présentation événements : `34648701996` success
- modificateurs tactiques d’équipement : `34648911729` success
- checkpoint modificateurs équipement : `34648982225` success
- couverture directionnelle salle/obstacles : `34649297286` success
- checkpoint couverture directionnelle : `34649352594` success
- réglages obstacles dans Créateur de salle : `34649715933` success
- checkpoint obstacles éditeur : `34649791631` success
- statuts persistants superposables par source : `34650030877` success
- checkpoint statuts superposables : `34650111943` success
- transitions World Builder directement dans vue Donjon : `34650608938` success
- checkpoint transitions Donjon : `34650681453` success
- déplacements individuels multi-héros / retours arrière : `34651007333` success
- checkpoint déplacements multi-héros : `34651081170` success
- focus héros + déplacement individuel dans vue Donjon : `34651410540` success
- checkpoint vue Donjon multi-héros : `34651473151` success
- démarrage combat réel depuis runtime de salle : `34651712990` success
- checkpoint bridge combat de salle : `34651774201` success
- entrée du combat réel dans la vue Donjon : `34652076626` success
- réconciliation fin de combat Donjon : `34653003698` success

## Dernière étape terminée

Réconciliation de la fin du vrai combat Donjon vers les runtimes de partie :
- `dungeon-combat-runtime.js` expose maintenant `reconcileDungeonCombatResult()`;
- la fonction refuse un combat encore actif : aucune conséquence de fin n'est appliquée avant `phase === ended`;
- les états des héros participants sont recopiés depuis le `combatState` vers leurs vrais runtimes, y compris ressources et KO;
- un héros KO devient inactif, mais un héros vivant dans une autre salle et non participant reste totalement inchangé;
- chaque ennemi KO est retrouvé par `roomEntityId` dans la salle qui a créé le combat;
- la défaite réelle passe par `resolveRoomCreatureDefeat()` : loot, boss-key et état `defeated/active` utilisent donc le moteur de spawn/bestiaire déjà existant au lieu d'un second système;
- les ennemis encore vivants conservent leur état de combat mis à jour;
- `roomCleared` est dérivé de `activeDungeonEnemies()` après réconciliation, ce qui garantit qu'un ennemi vaincu ne peut pas respawn au prochain engagement;
- `heroesStillAlive` est calculé sur l'ensemble des runtimes héros de la partie, pas seulement les combattants : le cas historique de faux Game Over quand Brom est vivant ailleurs est explicitement protégé;
- régression : Aldren blessé est synchronisé, Lyra KO reste KO/inactive, Brom vivant ailleurs reste actif, le squelette vaincu produit son loot puis disparaît des futurs combats.

Commits de l'étape :
- réconciliation runtime combat -> salle/héros : `d67612551381a8cef4f8ce237dc6db55066c369d`
- régression fin de combat : `8dec3471f3a5e3bdaaf3bd6644eeec3d5a2bb264`

CI finale : `34653003698` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder `reconcileDungeonCombatResult()` à la vraie vue/page Donjon lorsque le `combatState` passe à `ended`, puis rafraîchir salle, loot et héros sans second état parallèle;
- monter ensuite les actions/compétences réelles du combat dans la vue Donjon autour du même `combatState`, sans recréer de second moteur;
- étendre si besoin les statuts persistants non additifs (`multiply`, `percent`, `set`) avec une vraie recomposition ordonnée de couches plutôt qu'un delta simple;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
