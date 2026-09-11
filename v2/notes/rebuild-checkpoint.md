# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

Ce fichier sert de point de reprise entre les fils de discussion. Il doit être mis à jour après chaque étape importante validée.

## État important au 2026-09-11

- Reconstruction V2 isolée de `main`; la version stable n'est pas remplacée.
- Séparation Survie / RPG conservée.
- Moteur RPG data-driven : stats, ressources, effets, compétences, formes, inventaire, sets, marchands, progression, bestiaire, quêtes, alliés, salles, événements.
- Combat D100/tours : identité de tour `turnSequence`, rejet des actions obsolètes `stale-turn`, résolution unique.
- Compétences : une seule autorité centrale dans `v2/src/core/skills.js`; suppression du chevauchement de cooldown/charges.
- Inventaire : remplacement propre des équipements multi-slot, sans slot fantôme.
- Bestiaire : ressources de créature bornées entre min et max au spawn.
- Combat tactique : portée, mouvement, ligne de vue, murs/portes, arme équipée.
- Perception/furtivité : vraie ligne de vue de salle, murs bloquants respectés.
- Ciblage joueur : sélection manuelle validée avant dépense de ressource/charge/cooldown.
- Ciblage IA : règles `nearest`, `weakest`, `random`, `varied`; mémoire de cible et anti-focus immédiat lorsque plusieurs cibles sont valides.
- Runtime ennemi : choix coordonné compétence + cible + mémoire.
- Alliés : transition par salle, durées `room` décrémentées uniquement dans la salle concernée; métadonnées de combat conservées à l'entrée en combat.
- Audio : moteur central RPG, bindings et cues runtime présents; audit complet des anciens assets audio et playback navigateur encore à faire.
- Stockage V2 actuel : `v2/src/core/storage.js` utilise encore `localStorage` avec préfixe `gensrpg_v2__`.
- Nouvelle couche `v2/src/core/storage-provider.js` : provider local, provider distant injectable, routeur local/distant, copie local→distant et distant→local. Aucun backend cloud réel n'est encore branché.

## Dernière étape codée

Architecture de stockage rendue interchangeable afin de ne plus lier la V2 au seul stockage local du téléphone. Le comportement local existant reste disponible, mais la V2 peut désormais recevoir un provider distant sans réécrire les systèmes de jeu.

Commits de l'étape :
- provider : `64092ce0455d5f571a6292c1bc8970562f62a7a9`
- test : `3172b3cc799549f626db6b39962170b70b33c15c`

CI : run `34632693337`, encore en cours au dernier contrôle.

## Décision stockage à prendre

- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si « YouTube » était littéral : ce n'est pas un backend adapté au stockage de mondes/sauvegardes GenSrpG.
- Si l'intention était « GitHub » : techniquement possible via API, mais à étudier seulement avec une authentification sécurisée côté serveur; ne pas écrire directement depuis le navigateur avec un secret embarqué.
- Option recommandée à étudier : backend cloud authentifié (par exemple Supabase ou équivalent) avec stockage local hors-ligne + synchronisation distante.
- Conserver import/export manuel comme filet de sécurité, même avec cloud.

## Points encore ouverts prioritaires

- choisir et brancher le backend distant réel, puis définir compte/synchronisation/conflits/offline;
- auto-injection complète des alliés dans la session de combat;
- cohérence KO/active côté alliés;
- placement valide des alliés suiveurs à l'entrée d'une salle (éviter le même carreau pour tous);
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- couverture/obstacles et modificateurs d'équipement tactiques;
- lifecycle audio de salle et vrai playback frontend;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
