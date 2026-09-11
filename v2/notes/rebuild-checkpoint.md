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
- Portes de salle runtime : état persistant, ouverture par clé, option future de consommation de clé, layout matérialisé avec état runtime.
- Audio RPG : lifecycle de salle, sortie navigateur, session audio unique, cleanup en quittant le RPG.
- Stockage V2 : localStorage + provider abstrait local/distant; backend cloud réel volontairement différé.

## Jalons CI récents validés

- loot destinataire : `34638378209` success
- clé de boss à la défaite : `34638633003` success
- passage verrouillé par objet : `34639084070` success
- sélecteur objet requis World Builder : `34639994371` success
- sélecteur conditions World Builder : `34640343911` success
- portes persistantes / ouverture par clé : `34640631070` success

## Dernière étape codée

Configuration des portes verrouillées directement dans le Créateur de salle :
- `mountRoomEditor(host, universe)` reçoit maintenant le vrai univers RPG;
- ajout d'un réglage `🔒 Verrouiller les prochaines portes placées`;
- ajout d'un sélecteur `Clé / objet de porte` alimenté par les objets RPG actifs;
- le sélecteur affiche icône + nom et jamais un ID technique;
- les objets désactivés sont exclus;
- une porte/entrée/sortie placée avec le verrou actif reçoit `locked:true` et le `keyItemId` choisi;
- si aucun objet n'est choisi, la porte peut rester verrouillée pour être ouverte plus tard par événement/énigme/interrupteur;
- `rpg-page.js` transmet `loadRpgUniverse()` au Créateur de salle;
- la régression vérifie la persistance `locked/keyItemId`, le libellé `Clé du boss`, la sélection et l'exclusion d'une clé désactivée.

Commits de l'étape :
- éditeur de salle : `cd70a79bec4d6bfd10994a5f1a28f1196709493a`
- raccord page RPG : `d2292c39ed65cf5be2dd02103a734f35d7c5e1a3`
- régression : `e5f5128b2b68de0497adccf654eb22ac3c9c5ba7`

CI de cette nouvelle étape : à vérifier sur le dernier commit/checkpoint avant validation finale.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- brancher automatiquement `materializeRoomLayout()` dans les vrais appels tactiques/perception du runtime de donjon;
- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- construire le noyau générique de jets/tests et son éditeur;
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
