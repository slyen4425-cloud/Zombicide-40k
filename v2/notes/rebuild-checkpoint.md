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
- Quêtes : runtime persistant + signaux salle/interactions maintenant raccordés directement au runtime de donjon.
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

## Dernière étape terminée

Raccord automatique du runtime de donjon vers le runtime de quêtes :
- `room-runtime.js` importe désormais le bridge de quêtes;
- `createDungeonRuntime()` accepte optionnellement `questRuntime`, `quests`, définitions et contexte de quête;
- l'entrée dans la salle de départ passe automatiquement par `visitCurrentRoom()` et produit le signal `visit` sans appel manuel externe;
- `transitionDungeonRoom()` produit automatiquement le signal `visit` pour la salle d'arrivée;
- `attemptRoomInteraction()` applique automatiquement les signaux `interact`, le type d'interaction (`npc`, `switch`, `object`, etc.) et les `questSignals` personnalisés uniquement après une réussite;
- le runtime de quêtes est conservé dans `runtime.questRuntime`, donc progression et runtime de salle voyagent ensemble dans l'orchestrateur donjon;
- tous les nouveaux paramètres sont optionnels : les appels historiques de `room-runtime.js` restent compatibles et ne changent pas de comportement si aucune quête n'est fournie;
- régression `rpg-room-quest-wiring.test.mjs` couvre visite de salle de départ, interaction PNJ, transition de salle, interrupteur et flag custom sans invocation manuelle du bridge.

Commits de l'étape :
- raccord runtime : `5aaa19109b1c78e18f3e4b634e84960decc94fc1`
- régression : `21edac7d317b720184d8a54ad81016a7c0bf1433`

CI : `34645470548` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- construire le journal/UI de quête lisible côté joueur;
- poursuivre l'UI PNJ/interactions et relier les dialogues/actions de quête;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
