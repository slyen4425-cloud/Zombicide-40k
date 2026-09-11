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
- configuration portes verrouillées dans le Créateur de salle : `34640903854` success

## Dernière étape codée

Consommation automatique du layout runtime par le tactique et la perception :
- nouveau helper `resolveRuntimeRoomLayout(config)` dans `runtime-room-layout.js`;
- si `roomLayout` est fourni explicitement, il reste prioritaire;
- sinon `baseRoomLayout` + `dungeonRuntime` matérialisent automatiquement l'état persistant courant des portes via `materializeRoomLayout()`;
- `evaluateAttackPosition()` utilise maintenant ce layout résolu pour portée, ligne de vue, contact et couverture;
- `moveCombatActor()` utilise le même layout résolu pour le déplacement;
- `canDetectActor()` utilise le même layout résolu pour la ligne de vue de perception;
- une porte fermée dans le runtime bloque donc attaque/mouvement/vision même si le layout auteur n'a pas été muté;
- dès que le runtime passe cette porte à `open/unlocked`, tactique et perception la voient immédiatement ouverte;
- le layout auteur reste immuable.

Commits de l'étape :
- helper runtime layout : `f5ff3841bbeb6099d1b469d252f8e8a5bc0ca251`
- perception : `7c1b9090984ad4769b34dc4bccda5c905e9a6a98`
- combat tactique : `af7cdc388bb1771592bb8996bcda807936c2c62d`
- régression tactique : `609b1586d70de29af530cb0ac7709a4312344d78`
- régression perception : `4fe977a7c67055a39687e4de5f445fb428ef75ae`

CI de cette nouvelle étape : à vérifier sur le dernier commit/checkpoint avant validation finale.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- construire le noyau générique de jets/tests et son éditeur;
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
