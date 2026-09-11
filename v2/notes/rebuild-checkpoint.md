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

## Dernière étape terminée

Actions allié dans l'UI PNJ réelle :
- `room-npc-interaction-ui.js` réutilise directement `recruitFromRoomInteraction()`, `summonFromRoomInteraction()` et `dismissFromRoomInteraction()`;
- l'UI expose automatiquement `Recruter`, `Invoquer` ou `Renvoyer` selon la configuration et l'état runtime réel de l'interaction;
- le prix d'un recrutement est affiché dans le libellé joueur quand il est non nul;
- après recrutement, l'action de recrutement disparaît et l'action de renvoi apparaît;
- le wallet, le roster allié et l'état persistant de l'interaction de salle sont tous mis à jour par les moteurs déjà existants;
- l'invocation conserve les contraintes `sourceKind/sourceId` du moteur allié;
- `mountRoomNpcInteraction()` garde désormais `roomRuntime`, `roster` et `wallet` synchronisés et expose un callback `onAllyStateChange`;
- aucune logique parallèle de recrutement, invocation ou renvoi n'a été créée;
- régression `rpg-room-npc-ally-actions.test.mjs` couvre recrutement payant, persistance `recruited`, apparition de `Renvoyer`, renvoi réel dans le roster et invocation réelle via une interaction `ally`.

Commits de l'étape :
- UI/runtime actions allié : `9c89c0da71c7d3d13c23bcf3d97cf4209b6ba506`
- régression : `caf2186c32dc220d9a672567eebbb6aac193e015`

CI : `34646281587` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder les événements `successEventId/failureEventId/dismissEventId` renvoyés par les actions allié à la file d'événements RPG;
- monter le journal de quêtes dans la vraie vue de gameplay du donjon quand cette vue est raccordée;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
