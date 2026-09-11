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
- Quêtes : runtime persistant + signaux salle/interactions raccordés directement au runtime de donjon + journal joueur mobile + première UI PNJ/quête.
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

## Dernière étape terminée

UI PNJ/interactions orientée quêtes :
- nouveau `npc-interaction-ui.js`;
- construit une fiche PNJ mobile avec nom, icône/portrait, dialogue lisible, aide contextuelle et actions visibles;
- les lignes de dialogue utilisent les données déjà filtrées par le système d'interaction/allié et n'exposent aucun identifiant technique;
- `interaction.data.questActions` peut déclarer des actions data-driven sans coder un PNJ spécifique;
- action `start-quest` : affiche un libellé joueur puis démarre la quête ciblée via `startQuestRuntime()`;
- action `signal` : produit un signal générique (`npc`, `flag`, etc.) via `applyQuestSignal()` pour faire progresser les objectifs déjà actifs;
- les actions peuvent avoir des `conditionIds`; elles restent masquées tant que leur évaluateur de conditions ne les autorise pas;
- une référence vers une quête absente ou désactivée n'est pas proposée au joueur;
- `mountNpcInteraction()` fournit un composant montable avec callback lorsque le runtime de quêtes change;
- régression `rpg-npc-interaction-ui.test.mjs` couvre dialogue, portrait, masquage conditionnel, absence d'ID technique, démarrage de quête et progression par signal.

Commits de l'étape :
- UI PNJ/quête : `eefd443890225b10e2ee46c5292dff4e46e0c49c`
- régression : `61818fcf89add56ccdbebe7524e8c226d4374029`

CI : `34645853645` success.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder cette UI PNJ aux vraies interactions `npc/ally` du runtime de salle et aux dialogues de `ally-interaction-runtime.js`;
- monter le journal de quêtes dans la vraie vue de gameplay du donjon quand cette vue est raccordée;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
