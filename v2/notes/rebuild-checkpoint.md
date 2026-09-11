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
- Audio : moteur central RPG, bindings et cues runtime présents; audit complet des anciens assets audio et playback navigateur encore à faire.
- Stockage V2 actuel : `v2/src/core/storage.js` utilise encore `localStorage` avec préfixe `gensrpg_v2__`.
- Couche `v2/src/core/storage-provider.js` : provider local, provider distant injectable, routeur local/distant, copie local→distant et distant→local. Aucun backend cloud réel n'est encore branché.

## Dernière étape codée

Statuts persistants réversibles pour les modificateurs de caractéristiques :
- nouveau `addPersistentStatus()` dans `status-engine.js`;
- un effet `stat-modifier` temporaire est appliqué une seule fois à l'ajout du statut;
- sa valeur précédente est conservée dans le statut pour permettre un retour exact à l'expiration;
- rafraîchir le même statut prolonge sa durée sans réappliquer le bonus une seconde fois;
- `processStatuses()` ignore volontairement ces statuts persistants pour empêcher les cumuls à chaque début de tour;
- `decayStatuses()` restaure la valeur d'origine quand le statut expire;
- les DoT/HoT et autres statuts périodiques existants continuent de fonctionner selon leur `timing` historique.

Commits de l'étape :
- moteur : `915ab5e7f264f1a2220bf1c610a8124a8798115e`
- régression : `cea29f707abf97bd40d93335fb6ad76e4d80e560`

CI : à vérifier sur le dernier commit avant de considérer cette étape totalement validée.

## Stockage — décision repoussée

- Le choix du backend cloud réel est volontairement remis à plus tard.
- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu, privilégier stockage local hors-ligne + synchronisation distante authentifiée.
- Conserver import/export manuel comme filet de sécurité.

## Points encore ouverts prioritaires

- intégrer proprement l'attribution des drops au héros/groupe après `resolveRoomCreatureDefeat()`;
- étendre si nécessaire les statuts persistants réversibles à d'autres familles d'effets sans restaurer artificiellement une ressource dépensée entre-temps;
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- couverture/obstacles et modificateurs d'équipement tactiques;
- lifecycle audio de salle et vrai playback frontend;
- choisir et brancher plus tard le backend distant réel, puis définir compte/synchronisation/conflits/offline;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
