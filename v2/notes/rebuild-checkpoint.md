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
- UI PNJ/allié : dialogue, actions de quête, recrutement, invocation et renvoi utilisent désormais les moteurs existants sans duplication.
- Les événements issus des actions allié sont mis en file FIFO dans `roomRuntime.eventQueue`; cette file est maintenant reliée au runtime de salle, exécutée automatiquement via `event-engine.js`, et peut reprendre après un choix sans double résolution.
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

## Dernière étape terminée

Raccord automatique de la file d'événements au runtime de salle :
- nouveau `room-event-runtime.js`;
- `drainRoomRuntimeEvents()` prend directement `roomRuntime.eventQueue`, synchronise un `eventOrchestrator` persistant dans le runtime et exécute les événements FIFO jusqu'à ce que la file soit vide ou qu'un choix joueur bloque la suite;
- le `world` produit par `event-engine.js` est conservé entre les événements du même drain;
- `resolveRoomRuntimeEventChoice()` reprend l'événement actif puis, s'il se termine, poursuit automatiquement les événements restants de la file;
- re-drainer pendant un choix ne relance pas l'événement actif et ne consomme pas la suite prématurément;
- `roomRuntime.eventQueue` et `roomRuntime.eventOrchestrator` restent synchronisés après chaque exécution;
- `mountRoomNpcInteraction()` déclenche désormais automatiquement le drain lorsqu'une action recrutement/invocation/renvoi enfile un événement;
- l'UI maintient aussi le `world` d'événement courant et expose `onEventStateChange` pour la vue gameplay parente;
- régression `rpg-room-event-runtime.test.mjs` couvre événement immédiat, blocage sur choix, reprise du choix, poursuite automatique de la file et anti-double exécution.

Commits de l'étape :
- bridge runtime salle/événements : `eecdb9b944cb56715c650613a0a90c8accb148d7`
- consommation automatique dans UI PNJ : `ede9841ba67665725a329c5b46a4bc78d545f285`
- régression : `7611da0014dfcc16aadbdf9c67158814c6d1676b`

CI : `34647190339` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- monter le journal de quêtes dans la vraie vue de gameplay du donjon et le rafraîchir à partir de `roomRuntime.questRuntime`;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
