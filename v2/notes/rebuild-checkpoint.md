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
- Quêtes : runtime persistant + signaux salle/interactions raccordés directement au runtime de donjon + journal joueur mobile + UI PNJ raccordée au runtime salle/allié.
- UI PNJ/allié : dialogue, actions de quête, recrutement, invocation et renvoi utilisent les moteurs existants sans duplication.
- Les événements issus des actions allié sont maintenant mis en file FIFO dans `roomRuntime.eventQueue` pour consommation par le moteur d'événements RPG.
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

## Dernière étape terminée

File d'événements RPG pour les actions allié :
- nouveau `event-queue-runtime.js` avec `createEventQueueRuntime()`, `enqueueEventRequest()`, `dequeueEventRequest()` et `peekEventRequest()`;
- la file est FIFO et conserve un historique `queued/dequeued` avec séquence stable;
- `room-npc-interaction-ui.js` enfile automatiquement l'`eventId` renvoyé par le moteur allié après recrutement, invocation ou renvoi;
- les événements de succès utilisent `successEventId`/`dismissEventId` existants;
- un échec de recrutement peut lui aussi enfiler `failureEventId` sans modifier artificiellement le roster ou le wallet;
- chaque requête garde sa provenance (`npc-ally-action`, interaction source, type d'action, succès/échec) pour l'orchestrateur gameplay;
- `mountRoomNpcInteraction()` conserve maintenant le `roomRuntime` mis à jour même lorsqu'une action échoue mais déclenche un événement de réaction;
- aucune exécution d'événement n'est dupliquée ici : cette étape ne fait qu'alimenter la file destinée à `event-engine.js`;
- régression `rpg-room-npc-event-queue.test.mjs` couvre échec de recrutement -> événement d'échec, succès -> événement de succès, renvoi -> événement de renvoi et ordre FIFO.

Commits de l'étape :
- file d'événements : `a1f4a99abc51da6f950a50ab1ae98d07ace5bcb5`
- raccord UI PNJ/allié : `1715f5a42e2cfa73bcd828d662fb80a29dabd7f5`
- régression : `64ab2815b2f0a561be94dfbe0d983367d92d5ab3`

CI : `34646526482` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- ajouter l'orchestrateur qui dépile `roomRuntime.eventQueue`, résout la définition correspondante et exécute `event-engine.js` sans double résolution;
- monter le journal de quêtes dans la vraie vue de gameplay du donjon quand cette vue est raccordée;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
