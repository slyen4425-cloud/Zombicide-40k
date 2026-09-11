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
- Démarrage combat : `v2/src/modes/rpg/combat-setup.js` ajoute automatiquement les alliés éligibles/proches au combat, sans doublon, via `buildAllyCombatants` puis `createCombatState`. CI run `34632880339` : success.
- État KO alliés : les alliés KO/morts sont exclus du contrôle, du mouvement et des prochains combats; une vraie réanimation les rend à nouveau éligibles. CI run `34633451924` : success.
- Placement alliés changement de salle : placement distinct sur cases accessibles quand `roomLayout` est connu. CI run `34633817217` : success.
- Loot bestiaire : claim idempotent, pas de double tirage après sauvegarde/rechargement. CI run `34634065664` : success.
- Médias bestiaire : `icon`, `artId`, `audioId` persistent dans le runtime. CI run `34634410838` : success.
- Objets de départ héros : `startingItems` remplit maintenant l'inventaire à la création du runtime. CI run `34634619019` : success.
- Audio : moteur central RPG, bindings et cues runtime présents; audit complet des anciens assets audio et playback navigateur encore à faire.
- Stockage V2 actuel : `v2/src/core/storage.js` utilise encore `localStorage` avec préfixe `gensrpg_v2__`.
- Couche `v2/src/core/storage-provider.js` : provider local, provider distant injectable, routeur local/distant, copie local→distant et distant→local. Aucun backend cloud réel n'est encore branché.

## Dernière étape codée

Équipement de départ explicite des héros :
- `createHeroDefinition()` accepte maintenant `startingEquipment` sous forme `{ itemId, slot }`;
- la validation vérifie que l'objet existe, que le slot existe sur le héros et que l'objet est autorisé sur ce slot;
- `createHeroRuntime()` ajoute d'abord `startingItems`, puis équipe les entrées demandées via l'autorité `equipItem()` existante;
- cela permet de définir proprement Aldren avec son épée équipée, Lyra avec son arc équipé et Brom avec son bâton équipé, sans logique spéciale propre à ces héros;
- le test vérifie que l'épée d'Aldren est déjà présente ET équipée en `main-hand` dès la création du runtime.

Commits de l'étape :
- moteur : `365011e78e879c97c227956ccf8a3fa1e20db400`
- régression : `627c96e85ff757c9e649e5d006a078ab1fdcae09`

CI : à vérifier sur le dernier commit avant de considérer cette étape totalement validée.

## Stockage — décision repoussée

- Le choix du backend cloud réel est volontairement remis à plus tard.
- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu, privilégier stockage local hors-ligne + synchronisation distante authentifiée.
- Conserver import/export manuel comme filet de sécurité.

## Points encore ouverts prioritaires

- raccorder le claim de loot au flux réel de fin de combat / room runtime;
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- couverture/obstacles et modificateurs d'équipement tactiques;
- status à modificateurs persistants réversibles;
- lifecycle audio de salle et vrai playback frontend;
- choisir et brancher plus tard le backend distant réel, puis définir compte/synchronisation/conflits/offline;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
