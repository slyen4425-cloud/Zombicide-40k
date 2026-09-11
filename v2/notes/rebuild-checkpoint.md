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
- Les passages authored du World Builder sont maintenant directement jouables dans la vue Donjon via le vrai `room-runtime`; objets requis et conditions filtrent les boutons avant traversée.
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

## Dernière étape terminée

Transitions authored directement jouables depuis la vue Donjon :
- `dungeon-gameplay-view.js` lit les passages disponibles avec `availableRoomLinks()` à partir du vrai `worldSession` du runtime;
- les boutons affichent uniquement le libellé authored et le nom de la salle cible, pas les IDs techniques visibles;
- les passages exigeant un objet ne sont pas proposés tant que l’inventaire transmis ne contient pas cet objet;
- les conditions authored passent par le même `conditionEvaluator` que le moteur du monde;
- cliquer un passage appelle directement `transitionDungeonRoom()` : pas de second runtime ou de téléportation UI parallèle;
- la transition instancie/recharge la salle via `layoutProvider`, incrémente les visites, alimente le log, et envoie le signal de visite aux quêtes existantes;
- la page RPG construit le `worldIndex` à partir du vrai `loadWorldDraft()` et le fournit à la vue Donjon;
- la page expose aussi `setDungeonInventory()` et `refreshDungeonWorld()` pour garder passages/objets/world authored synchronisés;
- une première régression de test a échoué à cause d'un appel incorrect à `addItem()` dans le test, puis une seconde parce qu'un ID présent uniquement dans un attribut `data-*` était assimilé à tort à un ID visible; les deux assertions de test ont été corrigées sans contourner les règles de gameplay;
- batterie complète finale verte.

Commits de l'étape :
- vue Donjon + vraies transitions : `3409ad2cac7d698ba97f76f116b5e5c6773e26fc`
- raccord page RPG au World Builder : `a3582e2e316945da01ee08204fce8b0d0b8bfb96`
- régression initiale : `d7a0259fb8bb482421d011e7ae20a5c2e9877d78`
- correction inventaire de test : `759017c3e90a33a2befe3b606e92443e8b716bd5`
- correction assertion visibilité : `10bbd21e00e53f5609f278c9416d1279fad3e46f`

CI finale : `34650608938` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder maintenant le démarrage du combat réel depuis les ennemis actifs de la salle à la vue Donjon, en réutilisant le runtime de combat D100 existant;
- raccorder ensuite la fin de combat au runtime de salle (défaite ennemis, loot, boss/key, sortie) sans second état parallèle;
- étendre si besoin les statuts persistants non additifs (`multiply`, `percent`, `set`) avec une vraie recomposition ordonnée de couches plutôt qu'un delta simple;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
