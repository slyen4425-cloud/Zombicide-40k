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
- noyau générique de jets/tests : `34641462386` success
- éditeur générique de jets/tests : `34641810586` success

## Dernière étape codée

Références de jets réutilisables dans les moteurs :
- `core/checks.js` sait maintenant retrouver une définition par `checkId` et résoudre un test acteur avec fallback inline;
- une définition désactivée bloque proprement avec `check-disabled`;
- les compétences acceptent désormais `checkId`; les anciens champs `roll` restent compatibles;
- le coût/charge/cooldown d'une compétence sont consommés avant le jet, et les effets ne sont appliqués que si le jet réussit;
- `skill-runtime.js` ré-exporte `resolveSkillUse()` pour le runtime RPG;
- les pièges acceptent `detectionCheckId` et `disarmCheckId`, avec fallback vers `detectionCheck` / `disarmCheck` legacy;
- les résultats mémorisent toujours le jet réellement exécuté;
- régressions ajoutées pour compétence avec `agility-test` et piège avec `perception-test`/`agility-test`.

Commits de l'étape :
- résolution de checks réutilisables : `ed7901a1fbf6ed5a701b396ab880276a4558c672`
- compétences : `3c8622ab674d08e160467495674e26518c5923ba`
- pièges : `1b9263007397890c38337d1d28636c10a940470c`
- export runtime compétence : `e526214af31a2aaffb753e7cb8cdc4b023d99541`
- régression compétences : `0292455560e77df029600a9fa589d0177e01d2f0`
- régression pièges : `4d7ec0b35eb504d917088f8963bd30d1e9706e72`

Le run `34642221555` a échoué sur une assertion obsolète de `core-checks.test.mjs` : `normalizeCheckSpec()` expose désormais volontairement `statId:null`. Le moteur n'était pas en faute. Le test a été corrigé dans le commit `3ef5363cd68966fd4f47e0c4b19005ef7faa1aba` pour refléter le contrat actuel. Run de validation : `34642346782`, en cours au dernier contrôle.

## Stockage — décision repoussée

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu : local-first/offline + synchronisation distante authentifiée + gestion de révisions/conflits.
- Conserver import/export manuel comme filet de sécurité.

## Priorités ouvertes

- ajouter les références `checkId` dans les interfaces d'édition, sans ID brut;
- étendre le même modèle de jets réutilisables aux événements/interactions;
- choisir l'UI de jeu du destinataire de loot (héros / groupe / autre inventaire);
- poursuivre lifecycle quêtes et UI PNJ/interactions;
- enrichir obstacles/couvertures/effets d'équipement sans dupliquer les règles tactiques;
- remplacer le rollback absolu des statuts par des modificateurs superposables par source;
- audit legacy systématique encore incomplet : gros index, assets, audio, PWA/cache, sauvegardes/migrations, tests, historique Capture, UI cachées.
