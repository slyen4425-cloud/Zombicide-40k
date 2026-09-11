# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils. La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-11

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Noyau générique de jets : D100/D20/autres dés, roll-under/roll-over, stat/difficulté/modificateur partagés par les moteurs.
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
- noyau générique de jets/tests : run `34641462386` à vérifier sur le dernier commit/checkpoint avant validation finale

## Dernière étape codée

Éditeur générique de jets/tests :
- nouveau `v2/src/modes/rpg/check-editor.js`;
- nouvelle collection persistante `universe.checks` normalisée par `ensureCheckDefinitions()`;
- création de règles de jet réutilisables avec nom, activation, dé, mode roll-under/roll-over, statistique, difficulté, modificateur et description;
- sélecteur de statistique par icône + nom, sans saisie d'ID technique;
- les statistiques désactivées sont exclues du sélecteur;
- le panneau `Jets & tests` est monté dans l'éditeur RPG principal entre Ressources et les réglages spatiaux;
- suppression d'une statistique détache automatiquement les jets qui la référencent;
- univers neuf, chargement et sauvegarde garantissent maintenant la présence de `checks`;
- régression `rpg-check-editor.test.mjs` couvre normalisation, D100, sélection de stat lisible et exclusion des stats désactivées.

Commits de l'étape :
- persistance/raccord éditeur RPG : `f20954ee1127e96b189e134e1f5985fad9288867`
- éditeur de jets : `b933d92cb63e22502588c170099b91427be5b0a6`
- régression : `0fbf9dd08a5c08a62bb3f04a61189c0378d16439`

CI de cette nouvelle étape : à vérifier sur le dernier commit/checkpoint avant validation finale.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- remplacer progressivement les configurations de jet inline des compétences/pièges/événements par des références optionnelles vers `universe.checks`, tout en gardant compatibilité avec les anciens champs;
- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
