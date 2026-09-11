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
- Le démarrage d'un vrai combat de salle dispose maintenant d'un bridge dédié : ennemis actifs de la salle + héros réellement présents, puis filtre de proximité spatiale avant création du vrai `combat-engine` D100.
- Le vrai combat de salle est monté dans la vue Donjon : les ennemis actifs sont affichés, le héros focalisé peut engager, et le combat créé est conservé comme combat Donjon courant sans passer par le laboratoire de test.
- La fin du combat est maintenant réconciliée automatiquement dans la vraie vue Donjon dès que le `combatState` passe à `ended` : états héros, ennemis vaincus, loot/boss-key et salle libérée reviennent directement dans les runtimes de partie.
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
- checkpoint réconciliation fin de combat : `34653071840` success
- réconciliation automatique à `phase=ended` dans la vue Donjon : `34653443496` success

## Dernière étape terminée

Raccord automatique de la fin du combat dans la vraie vue/page Donjon :
- `dungeon-gameplay-view.js` importe maintenant `reconcileDungeonCombatResult()` et expose `reconcileEndedDungeonCombat()` pour le raccord/test;
- la vue surveille le `combatState` qu'elle reçoit; dès qu'il passe à `phase === ended`, elle réconcilie immédiatement ce combat vers le vrai `roomRuntime` et les vrais runtimes héros;
- la réconciliation n'est effectuée qu'une seule fois par état final de combat grâce à une clé de fin de combat, pour éviter les doubles récompenses/callbacks lors de rerenders;
- après réconciliation, le rendu repart directement du runtime mis à jour : ennemi vaincu retiré des ennemis actifs, salle éventuellement libérée, butin immédiatement visible, état PV/KO des héros actualisé;
- `rpg-page.js` propage maintenant ce résultat : `currentDungeonRuntime` et `currentDungeonHeroRuntimes` sont remplacés par les valeurs réconciliées, et `onDungeonCombatEnd` permet au niveau parent de persister/réagir à la fin réelle;
- `setDungeonCombat()` resynchronise immédiatement ses copies avec celles détenues par la vue après réception d'un combat terminé; il n'existe donc pas de second état de salle/héros parallèle;
- régression vue : un combat final victoire met Lyra à 3 PV dans son vrai runtime, marque exactement `spawn:skeleton:2` vaincu dans la Crypte et dérive correctement `roomCleared`.

Commits de l'étape :
- réconciliation automatique dans vue Donjon : `e32f04f4e47d23ff29ce2abf1d129794e50eb613`
- propagation état réconcilié via page RPG : `da56d57a2871aeb3a0979b1610bff819b7129e9a`
- régression raccord automatique : `d480a856e042c128ada53037857dc697350f98fe`

CI finale : `34653443496` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- monter maintenant les actions/compétences réelles du combat dans la vue Donjon autour du même `combatState`, sans recréer de second moteur;
- raccorder ensuite les tours ennemis/fin de tour automatique à cette même UI réelle;
- étendre si besoin les statuts persistants non additifs (`multiply`, `percent`, `set`) avec une vraie recomposition ordonnée de couches plutôt qu'un delta simple;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.