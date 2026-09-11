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
- Combat tactique : mouvement, portée, ligne de vue, murs/portes, arme équipée et couverture configurable.
- Perception/furtivité : layout runtime matérialisé, sans confondre distance de vision et chemin de déplacement.
- Bestiaire : loot idempotent, drops persistants, destinataire explicite, boss key attribuée seulement après défaite réelle.
- UI générique de destinataire de loot prête pour raccord à la vue de gameplay.
- Quêtes : runtime persistant + signaux salle/interactions raccordés directement au runtime de donjon + journal joueur mobile + UI PNJ désormais raccordée aux vraies interactions `npc/ally` et aux dialogues du runtime allié.
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

## Dernière étape terminée

Raccord direct de l'UI PNJ aux vraies interactions de salle/allié :
- nouveau `room-npc-interaction-ui.js`;
- `buildRoomNpcInteractionView()` passe par `inspectAllyRoomInteraction()` : seules les vraies interactions `npc/ally` instanciées dans la salle sont acceptées;
- les dialogues affichés viennent directement de `ally-interaction-runtime.js`, donc les conditions de dialogue existantes sont réutilisées au lieu de recréer un second système;
- un `escortQuestId` configuré sur une interaction alliée devient automatiquement une action joueur `Accepter : <nom de quête>` sans exposer d'identifiant technique;
- les `questActions` déjà définies sur l'interaction de salle restent compatibles et peuvent cohabiter avec cette action d'escorte automatique;
- `applyRoomNpcQuestAction()` met à jour directement `roomRuntime.questRuntime`, afin que la progression de quête reste attachée au runtime du donjon;
- `mountRoomNpcInteraction()` fournit un composant montable qui relit le runtime réel de salle et notifie son changement après une action de quête;
- régression `rpg-room-npc-interaction-ui.test.mjs` couvre interaction `npc` réelle, filtrage conditionnel du dialogue allié, action d'escorte, démarrage de quête dans `roomRuntime.questRuntime` et rejet d'une interaction non PNJ.

Commits de l'étape :
- bridge UI PNJ/salle : `5f0536cfb01fb1d13ec39d547dec56dd496292db`
- régression : `be06bf91a0d4b7b6e1a983921ba6990d5cf515b2`

CI : `34646083537` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder les actions de recrutement/summon/dismiss existantes à cette même UI PNJ sans dupliquer le runtime allié;
- monter le journal de quêtes dans la vraie vue de gameplay du donjon quand cette vue est raccordée;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
