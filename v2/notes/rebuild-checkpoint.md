# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils. La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-11

- Séparation Survie / RPG conservée.
- RPG data-driven : stats, ressources, jets/tests, conditions, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles et événements.
- Combat D100/tours : `turnSequence`, rejet `stale-turn`, résolution unique, régressions KO/timeline historiques protégées.
- Noyau générique de jets : D100/D20/autres dés, roll-under/roll-over, stat/difficulté/modificateur partagés par les moteurs.
- Compétences et pièges peuvent référencer des jets réutilisables par `checkId`, avec compatibilité des anciens champs inline.
- Les événements peuvent exécuter un jet réutilisable puis enchaîner une branche réussite/échec sans dupliquer la règle de jet.
- Les interactions de salle peuvent demander un jet réutilisable via `checkId`; leurs tentatives et leur dernier résultat sont persistés dans le runtime de salle.
- Le Créateur de salle expose le jet requis d'une interaction par un sélecteur lisible nom + dé, sans saisie d'ID technique.
- L'éditeur de compétences expose maintenant le même choix de jet réutilisable; les anciens réglages locaux restent disponibles comme fallback.
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
- jets réutilisables dans les événements : `34642604129` success
- jets réutilisables sur interactions de salle : `34642816595` success
- persistance runtime des tentatives d'interaction : `34642980536` success
- sélecteur de jet dans le Créateur de salle : `34643290918` success

## Dernière étape codée

Sélecteur de jet réutilisable dans l'éditeur de compétences :
- `ensureAdvancedRpgCollections()` normalise désormais `universe.checks`;
- `newSkill()` crée explicitement `checkId:null` tout en conservant `roll` pour compatibilité;
- nouvel helper exporté `reusableCheckOptions()`;
- seuls les jets actifs sont affichés;
- les options montrent un libellé lisible `Nom · Dxx`, jamais un ID à saisir;
- une compétence peut sélectionner un `checkId` directement dans son formulaire;
- lorsqu'un jet réutilisable est choisi, les anciens champs locaux stat/difficulté et le toggle de jet local sont désactivés avec explication;
- sans `checkId`, les anciens réglages inline continuent de fonctionner;
- régression `rpg-skill-check-editor.test.mjs` vérifie sélection, D100/D20, exclusion des jets désactivés et fallback legacy.

Commits de l'étape :
- interface compétences : `b062022ff9c03f8d701617b461b5ec0a228bd73e`
- régression : `e648ab9d912190a6196fa6ccdf05f7a3385938a0`

CI de cette nouvelle étape : à vérifier au prochain tour sur le dernier commit/checkpoint.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- prévoir l'édition dédiée des pièges (détection/désarmement) avec deux sélecteurs de checks lisibles;
- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
