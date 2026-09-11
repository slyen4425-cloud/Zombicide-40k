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
- Équipement de départ héros : `startingEquipment` permet d'équiper proprement l'objet prévu dès la création du runtime. CI run `34635030983` : success.
- Loot de salle : `resolveRoomCreatureDefeat()` persiste la défaite et le loot idempotent directement dans l'entité de salle. CI run `34635256399` : success.
- Statuts persistants réversibles : les modificateurs temporaires de stats ne se cumulent plus à chaque tick et restaurent la valeur d'origine à l'expiration. CI run `34635529424` : success.
- Attribution de loot : `grantRoomCreatureDrops()` distribue les drops à l'inventaire une seule fois, de façon atomique. CI run `34635840687` : success.
- Couverture tactique configurable : `coverModifier` de la case cible se combine aux autres modificateurs et peut être ignoré par une source `ignoresCover`. CI run `34636060720` : success.
- Audio : moteur central RPG, bindings et cues runtime présents; audit complet des anciens assets audio et playback navigateur encore à faire.
- Stockage V2 actuel : `v2/src/core/storage.js` utilise encore `localStorage` avec préfixe `gensrpg_v2__`.
- Couche `v2/src/core/storage-provider.js` : provider local, provider distant injectable, routeur local/distant, copie local→distant et distant→local. Aucun backend cloud réel n'est encore branché.

## Dernière étape codée

Lifecycle audio lors d'un changement de salle :
- `audio-engine.js` expose maintenant `stopAudioChannel(state, channel)` pour arrêter proprement toutes les lectures actives d'un canal donné;
- `audio-runtime.js` expose `queueRoomTransitionAudio()`;
- lors d'une transition il peut enchaîner le son `leave` de l'ancienne salle, arrêter l'ancienne ambiance active, puis préparer `enter` et `ambience` de la nouvelle salle;
- l'absence d'un binding individuel ne bloque pas toute la transition audio;
- le test démarre réellement l'ambiance de la Crypte dans l'état audio, effectue la transition vers le Hall, vérifie que l'ancienne ambiance n'est plus active et que les trois cues `leave / enter / ambience` attendus sont bien préparés.

Commits de l'étape :
- moteur canal audio : `d32f9cbaa5e010ec5b75c4330d7a3dae5e7835d1`
- orchestration salle : `3688de5a080e92e912f7589e19f2f2676df717eb`
- régression : `77ce347e6e26191388bca3b2e5ef1ee87a81c692`

CI : à vérifier sur le dernier commit avant de considérer cette étape totalement validée.

## Stockage — décision repoussée

- Le choix du backend cloud réel est volontairement remis à plus tard.
- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu, privilégier stockage local hors-ligne + synchronisation distante authentifiée.
- Conserver import/export manuel comme filet de sécurité.

## Points encore ouverts prioritaires

- raccorder ensuite `queueRoomTransitionAudio()` au vrai flux `transitionDungeonRoom()` sans mélanger moteur de monde et sortie audio navigateur;
- choisir la politique de destinataire du loot : héros précis, inventaire de groupe, ou sélection utilisateur;
- enrichir les obstacles/couvertures via l'éditeur de salle et les effets d'équipement sans dupliquer les règles tactiques;
- étendre si nécessaire les statuts persistants réversibles à d'autres familles d'effets sans restaurer artificiellement une ressource dépensée entre-temps;
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- vrai playback frontend audio encore absent;
- choisir et brancher plus tard le backend distant réel, puis définir compte/synchronisation/conflits/offline;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
