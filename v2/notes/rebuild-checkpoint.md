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
- Quêtes : runtime persistant de démarrage/progression/complétion/échec + bridge salle/interactions vers signaux de quête.
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

## Dernière étape codée

Bridge automatique salle/interactions -> quêtes :
- nouveau `room-quest-bridge.js`;
- une visite de salle produit automatiquement un signal `visit` ciblant l'identifiant de salle;
- une interaction réussie produit un signal générique `interact` et un signal typé selon son `kind` (`npc`, `object`, `switch`, etc.);
- une interaction échouée ne progresse aucune quête;
- `interaction.data.questSignals` peut ajouter des signaux configurés, par exemple poser un `flag` de quête;
- `applyRoomQuestSignals()` applique plusieurs signaux au runtime de quêtes sans dupliquer la logique de progression;
- helpers dédiés `applyRoomVisitToQuests()` et `applyInteractionResultToQuests()` pour futur raccord direct à la boucle gameplay;
- régression `rpg-room-quest-bridge.test.mjs` couvre visite de salle, PNJ, échec d'interaction, interrupteur, signal générique et flag custom.

Commits de l'étape :
- bridge quêtes/salle : `fae5cddeca8248dce220bf2c9ca88e04d8f794d7`
- régression : `d9d3ca14e3618cb5aff0197ed7c229583ebc06b3`

CI de cette nouvelle étape : à vérifier au prochain tour sur le dernier commit/checkpoint.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- raccorder le bridge de quêtes directement aux appels gameplay `visitCurrentRoom()` / `attemptRoomInteraction()` ou à leur orchestrateur supérieur pour éviter les appels manuels;
- construire le journal/UI de quête et l'UI PNJ/interactions;
- intégrer le picker de loot dans la vraie vue de fin de combat/donjon quand elle est montée;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
