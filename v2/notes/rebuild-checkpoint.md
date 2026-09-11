# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils. La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-11

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Noyau générique de jets : D100/D20/autres dés, roll-under/roll-over, stat/difficulté/modificateur partagés par les moteurs.
- Compétences et pièges peuvent référencer des jets réutilisables par `checkId`, avec compatibilité des anciens champs inline.
- Les événements peuvent désormais exécuter un jet réutilisable puis enchaîner une branche réussite/échec sans dupliquer la règle de jet.
- Combat tactique : mouvement, portée, ligne de vue, murs/portes, arme équipée et couverture configurable.
- Perception/furtivité : ligne de vue de salle partagée, sans confondre distance de vision et chemin de déplacement.
- Ciblage joueur/IA : validation avant dépense, règles IA et anti-focus.
- Alliés : placement, transitions, durée par salle, KO/réanimation, injection combat.
- Bestiaire : ressources bornées, médias, loot idempotent, drops persistants et attribution à un destinataire explicite.
- Boss : clé créée seulement à la défaite réelle; passages `requiredItemId` verrouillés sur possession réelle de l'objet.
- World Builder : objets requis et conditions choisis par menus lisibles, jamais par ID brut.
- Portes de salle runtime : état persistant, ouverture par clé, layout matérialisé avec état runtime.
- Tactique/perception : consomment automatiquement le layout matérialisé du runtime de donjon.
- Audio RPG : lifecycle de salle, sortie navigateur, session audio unique, cleanup en quittant le RPG.
- Stockage V2 : localStorage + provider abstrait local/distant; backend cloud réel volontairement différé.

## Jalons CI récents validés

- loot destinataire : `34638378209` success
- clé de boss à la défaite : `34638633003` success
- passage verrouillé par objet : `34639084070` success
- sélecteur objet requis World Builder : `34639994371` success
- sélecteur conditions World Builder : `34640343911` success
- portes persistantes / ouverture par clé : `34640631070` success
- configuration portes verrouillées dans le Créateur de salle : `34640903854` success
- layout runtime consommé par tactique/perception : `34641208857` success
- noyau générique de jets/tests : `34641462386` success
- éditeur générique de jets/tests : `34641810586` success
- correction normalisation des checks : `34642346782` success

## Dernière étape codée

Jets réutilisables dans les chaînes d'événements :
- `EVENT_ACTION_KINDS` accepte maintenant `check`;
- une action `check` peut référencer `checkId`, ou conserver un fallback inline `check` pour compatibilité;
- le héros/acteur est choisi avec `actorId` ou le `defaultTargetId` du contexte;
- le résultat passe par le noyau partagé `resolveDefinedActorCheck()`;
- selon réussite ou échec, le moteur injecte immédiatement `successActions` ou `failureActions` dans la même file d'événement;
- les sous-actions sont normalisées et gardent des IDs stables, donc restent protégées contre les doubles exécutions;
- le log `event-check-resolved` conserve acteur, checkId, résultat et détail du jet;
- une définition désactivée est refusée via le contrat partagé des checks;
- régression ajoutée avec un test d'Agilité qui choisit correctement la branche réussite puis la branche échec et applique le malus uniquement sur échec.

Commits de l'étape :
- moteur événement/check : `7f53ef5a28ecf47fb47ca83b05ea608f3c8e0eaa`
- régression événement : `e436a8880186b69bbf3d4a96eaad4ac7a804fd87`

CI de cette nouvelle étape : à vérifier sur le dernier commit/checkpoint avant validation finale.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- étendre le même modèle de jets réutilisables aux interactions de salle et à leur runtime;
- ajouter les références `checkId` dans les interfaces d'édition, sans ID brut;
- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
