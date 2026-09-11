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
- Le vrai combat de salle est maintenant monté dans la vue Donjon : les ennemis actifs sont affichés, le héros focalisé peut engager, et le combat créé est conservé comme combat Donjon courant sans passer par le laboratoire de test.
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

## Dernière étape terminée

Montage du vrai combat de salle directement dans la vue Donjon :
- `dungeon-gameplay-view.js` importe désormais `activeDungeonEnemies()` et `startDungeonCombat()` du bridge dédié;
- la vue affiche les ennemis actifs de la salle focalisée avec leurs noms lisibles;
- le bouton `Engager le combat avec …` n'est actif que si le runtime du héros focalisé est réellement fourni;
- au clic, la vue appelle directement `startDungeonCombat()` avec le vrai `roomRuntime`, les vrais runtimes héros, l'état spatial et la configuration de portée fournis par la partie;
- le combat créé est le vrai `createCombatState()` D100 et est conservé dans la vue comme combat Donjon courant; le laboratoire `Combat test` n'est pas utilisé;
- une fois lancé, la vue affiche un résumé du combat en cours (participants, round, acteur courant) sans recalculer l'issue dans le rendu;
- `rpg-page.js` transporte maintenant `dungeonHeroRuntimes`, `dungeonSpatial`, `dungeonSpatialConfig` et `dungeonCombat`, expose des setters/getters correspondants, et remonte `onDungeonCombatStart` au parent;
- un héros situé dans une autre salle ou hors portée reste filtré par `dungeon-combat-runtime.js` avant création du combat;
- régression vue : ennemi actif affiché, bouton de combat disponible avec runtime Lyra chargé, bouton désactivé sans runtime héros, et salle vide affichant correctement l'absence d'ennemi.

Commits de l'étape :
- vue Donjon + entrée combat réel : `97dccff0e7a1e32799d8d48a33b5dba2e63be25a`
- transport état combat via page RPG : `94fff6571c4599a4187881dd5367f74e69aaa2bf`
- régression entrée combat : `d302006442d3da67fd2bd57ba57f41bae8236539`

CI finale : `34652076626` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder maintenant la fin du combat Donjon au runtime de salle : synchroniser états héros, marquer exactement les ennemis vaincus, déclencher loot/boss-key et libérer la salle sans respawn;
- monter ensuite les actions/compétences réelles du combat dans la vue Donjon autour du même `combatState`, sans recréer de second moteur;
- étendre si besoin les statuts persistants non additifs (`multiply`, `percent`, `set`) avec une vraie recomposition ordonnée de couches plutôt qu'un delta simple;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
