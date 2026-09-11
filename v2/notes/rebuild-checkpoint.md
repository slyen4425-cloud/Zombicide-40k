# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils. La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-11

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
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

## Dernière étape codée

Noyau générique de jets/tests :
- nouveau `v2/src/core/checks.js` comme autorité neutre pour les jets de dés et tests;
- `rollDie()` gère n'importe quel dé, D100 compris;
- `normalizeCheckSpec()` normalise dé, stat, difficulté, modificateur et mode;
- `resolveCheck()` gère `roll-under` et `roll-over` avec résultat détaillé (`roll`, `threshold`, `success`, paramètres normalisés);
- `resolveActorCheck()` récupère une stat aussi bien depuis un runtime héros simple (`actor.stats`) que depuis un acteur de combat (`actor.state.stats`);
- `combat-engine.js` utilise maintenant ce noyau partagé et ré-exporte `rollDie/resolveCheck` pour compatibilité avec le code existant;
- `trap-engine.js` n'a plus son propre raccord de calcul de stat/test et passe par `resolveActorCheck()`;
- régression dédiée `core-checks.test.mjs` pour D100, D20, roll-under, roll-over et résolution de stat acteur.

Commits de l'étape :
- noyau checks : `0741b1d1c06fbc622dae53734b3bed0a0425cc14`
- combat raccordé : `4e5bf09316f2cf331d27845de54dd7d68f6b61df`
- pièges raccordés : `f21cf88884f3162982c34b5444727277615b1f07`
- régression : `cbad0f383d1987007455b450d7d4b454bc255417`

CI de cette nouvelle étape : à vérifier sur le dernier commit/checkpoint avant validation finale.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- ajouter l'éditeur de tests/jets génériques avec sélecteurs de stats lisibles et sans ID brut;
- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
