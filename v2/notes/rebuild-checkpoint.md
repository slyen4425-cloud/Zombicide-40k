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

## Dernière étape codée

UI générique de destinataire de loot :
- nouveau `loot-recipient-ui.js`;
- un destinataire est identifié par `kind:id` et garde son propre inventaire;
- sélecteur lisible par nom/icône : héros, groupe ou autre inventaire, sans ID technique exposé;
- destinataires désactivés ou sans inventaire exclus;
- fallback automatique vers le premier inventaire disponible si aucune sélection valide n'est fournie;
- `grantCreatureLootToSelectedRecipient()` raccorde le choix UI à `grantRoomCreatureDropsToRecipient()`;
- après attribution, seul l'inventaire choisi est mis à jour;
- le runtime conserve `lootGrantedTo`, donc impossible de rediriger ou dupliquer le même loot au retour dans la salle;
- régression `rpg-loot-recipient-ui.test.mjs` couvre héros, sac de groupe, exclusion, attribution et anti-double-loot.

Commits de l'étape :
- workflow UI destinataire : `09d32ff9b286adf8f0099b0ed0d5129b742091be`
- régression : `8b23b0a11ec85175ecb7dbba3faf72b54e2ccfcd`

CI de cette nouvelle étape : à vérifier sur le run déclenché par ce checkpoint.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- intégrer ce picker dans la vraie UI de gameplay du donjon quand la vue de loot/fin de combat est montée;
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
