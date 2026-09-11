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
- Lifecycle audio de salle : transition leave → arrêt ancienne ambience → enter → nouvelle ambience. CI run `34636291490` : success.
- Couverture dans le Créateur de salle : outil `🛡️ Couverture` + `coverModifier` éditable. CI run `34636530585` : success.
- Audio : moteur central RPG, bindings et cues runtime présents; audit complet des anciens assets audio et playback navigateur encore à faire.
- Stockage V2 actuel : `v2/src/core/storage.js` utilise encore `localStorage` avec préfixe `gensrpg_v2__`.
- Couche `v2/src/core/storage-provider.js` : provider local, provider distant injectable, routeur local/distant, copie local→distant et distant→local. Aucun backend cloud réel n'est encore branché.

## Dernière étape codée

Raccord du lifecycle audio au vrai changement de salle du donjon :
- nouveau `v2/src/modes/rpg/dungeon-transition-runtime.js`;
- `transitionDungeonRoomWithAudio()` appelle l'autorité `transitionDungeonRoom()` existante pour le monde/salle puis orchestre séparément `queueRoomTransitionAudio()`;
- l'ancienne salle et la nouvelle salle sont résolues depuis le `worldIndex`, donc leurs bindings audio réels sont utilisés;
- une transition refusée (`link-unavailable`, conditions, etc.) ne touche pas à l'état audio;
- aucune lecture navigateur n'est ajoutée au moteur monde : on reste sur des intentions audio pures;
- le test couvre Crypte → Hall, arrêt de l'ancienne ambience, cues `leave / enter / ambience`, puis vérifie qu'une transition invalide laisse l'audio intact.

Commits de l'étape :
- orchestration : `0d22adf773fa98a621dc54bb84abba23eb08e803`
- régression : `76bf747795b3e36f18fa762b394557133dd26c38`

CI : à vérifier sur le dernier commit avant de considérer cette étape totalement validée.

## Stockage — décision repoussée

- Le choix du backend cloud réel est volontairement remis à plus tard.
- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu, privilégier stockage local hors-ligne + synchronisation distante authentifiée.
- Conserver import/export manuel comme filet de sécurité.

## Points encore ouverts prioritaires

- vrai playback frontend audio encore absent;
- choisir la politique de destinataire du loot : héros précis, inventaire de groupe, ou sélection utilisateur;
- enrichir encore les obstacles/couvertures et les effets d'équipement sans dupliquer les règles tactiques;
- étendre si nécessaire les statuts persistants réversibles à d'autres familles d'effets sans restaurer artificiellement une ressource dépensée entre-temps;
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- choisir et brancher plus tard le backend distant réel, puis définir compte/synchronisation/conflits/offline;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
