# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils. La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-11

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Noyau générique de jets : D100/D20/autres dés, roll-under/roll-over, stat/difficulté/modificateur partagés par les moteurs.
- Compétences, pièges, événements et interactions de salle peuvent référencer des jets réutilisables; les anciens formats inline restent compatibles.
- Créateur de salle : portes verrouillées par objet, interactions attachables, sélecteur de jet lisible, tentatives persistées en runtime.
- Éditeur RPG : sélecteur de jet réutilisable dans les compétences et éditeur dédié des pièges avec détection/désarmement séparés.
- Combat tactique : mouvement, portée, ligne de vue, murs/portes, arme équipée, couverture directionnelle et modificateurs tactiques issus des équipements réellement équipés.
- Perception/furtivité : layout runtime matérialisé, sans confondre distance de vision et chemin de déplacement.
- Bestiaire : loot idempotent, drops persistants, destinataire explicite, boss key attribuée seulement après défaite réelle.
- Quêtes : runtime persistant + signaux salle/interactions raccordés directement au runtime de donjon + journal joueur mobile + UI PNJ raccordée au runtime salle/allié.
- UI PNJ/allié : dialogue, actions de quête, recrutement, invocation et renvoi utilisent les moteurs existants sans duplication.
- Les événements issus des actions allié sont mis en file FIFO dans `roomRuntime.eventQueue`; cette file est reliée au runtime de salle, exécutée automatiquement via `event-engine.js`, et reprend après un choix sans double résolution.
- La vue `🎮 Donjon` affiche en direct l’état de salle + le journal de quêtes à partir de `roomRuntime.questRuntime`.
- Le picker de destinataire de loot est intégré directement dans la vue Donjon : les butins disponibles sont listés, attribuables à un héros/groupe lisible, et disparaissent après attribution idempotente.
- Les interactions PNJ/allié et les choix d’événements sont surfacés directement dans la vue Donjon, tout en réutilisant `room-npc-interaction-ui.js` et `room-event-runtime.js`.
- Les textes et conséquences des événements sont présentés directement dans la vue Donjon à partir du log produit par `event-engine.js`, sans modifier ni dupliquer l’exécution.
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

## Dernière étape terminée

Couverture directionnelle et obstacles dans le combat tactique :
- `room-tactical-bridge.js` expose maintenant `roomLineCells()` pour réutiliser la même ligne de tir que la ligne de vue;
- `roomCoverModifier()` calcule la couverture depuis la direction réelle du tireur vers la cible;
- la couverture peut provenir de la case de la cible, de la case immédiatement devant elle dans la ligne de tir, ou d’un élément de bord (mur/obstacle/porte) portant un `coverModifier`;
- les obstacles bas peuvent donc fournir de la couverture avec `blocksVision=false` sans devenir artificiellement des murs opaques;
- le tireur ne subit pas la couverture de sa propre case lorsqu’il est adjacent à la cible;
- `targetCoverModifier()` reste rétrocompatible si aucun `actorId` n’est fourni, mais `evaluateAttackPosition()` utilise désormais la résolution directionnelle complète;
- `ignoresCover` continue de passer par le même moteur et annule aussi ces nouvelles sources de couverture;
- la ligne de vue et le pathfinding ne sont pas dupliqués : la couverture réutilise les primitives du bridge tactique existant;
- régression `rpg-room-tactical-bridge.test.mjs` couvre obstacle adjacent, couverture de bord, obstacle bas qui ne bloque pas la vue et contournement via `ignoresCover`.

Commits principaux de l'étape :
- bridge couverture directionnelle final : `c87373532858c5409268ca8453e9c4527fe8fbec`
- raccord moteur tactique : `5dc825cdcd231f4eb67e87f282a4a4dcccfdb53d`
- régression : `6fcfbe38405904fd3e0b95dabe2c5ae37db46757`

CI finale : `34649297286` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- exposer proprement les réglages de couverture/obstacles dans l’éditeur de salle sans saisie technique brute;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- poursuivre le raccord gameplay réel (transitions/combats/fin de combat) autour de la vue Donjon sans second runtime;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
