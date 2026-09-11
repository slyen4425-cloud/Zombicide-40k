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
- Raccord audio au vrai changement de salle : `transitionDungeonRoomWithAudio()` conserve le moteur monde pur et orchestre les cues audio séparément. CI run `34636880180` : success.
- Sortie audio navigateur : `createBrowserAudioOutput()` gère lecture, boucle, volume, délai, arrêt par son/canal et nettoyage. CI run `34637035449` : success.
- Pont moteur→sortie audio : `audio-output-runtime.js` synchronise l'état audio RPG avec la lecture navigateur. CI run `34637467293` : success.
- Audio : moteur central RPG, bindings, cues runtime, sortie navigateur et pont runtime présents; audit complet des anciens assets audio et raccord final au shell restent à faire.
- Stockage V2 actuel : `v2/src/core/storage.js` utilise encore `localStorage` avec préfixe `gensrpg_v2__`.
- Couche `v2/src/core/storage-provider.js` : provider local, provider distant injectable, routeur local/distant, copie local→distant et distant→local. Aucun backend cloud réel n'est encore branché.

## Dernière étape codée

Contrôleur de session audio RPG :
- nouveau `v2/src/modes/rpg/rpg-audio-session.js`;
- `createRpgAudioSession()` conserve un état audio courant unique pour une session RPG;
- `commit()` applique des intentions audio ordinaires au moteur + sortie navigateur;
- `commitRoomTransition()` consomme directement une transition audio de salle tout en gardant l'état de session comme autorité;
- `snapshot()` expose une copie sûre de l'état courant;
- `dispose()` coupe proprement toutes les lectures actives quand la session RPG est détruite;
- une session détruite refuse tout nouveau son avec `session-disposed`;
- le test vérifie lecture normale, transition d'ambiance, arrêt de l'ancienne ambiance, nettoyage et refus après destruction.

Commits de l'étape :
- contrôleur : `ca20d2647d978ea6217dc6841a48fc041c6eb491`
- régression : `14d58491b9c3f110f6795f9670b43be7227d9e4c`

CI : à vérifier sur le dernier commit avant de considérer cette étape totalement validée.

## Stockage — décision repoussée

- Le choix du backend cloud réel est volontairement remis à plus tard.
- Ne pas exposer de jeton GitHub personnel dans la PWA.
- Si un cloud est retenu, privilégier stockage local hors-ligne + synchronisation distante authentifiée.
- Conserver import/export manuel comme filet de sécurité.

## Points encore ouverts prioritaires

- brancher `createRpgAudioSession()` au vrai `mountRpgPage()` puis disposer la session quand on quitte le mode RPG;
- choisir la politique de destinataire du loot : héros précis, inventaire de groupe, ou sélection utilisateur;
- enrichir encore les obstacles/couvertures et les effets d'équipement sans dupliquer les règles tactiques;
- étendre si nécessaire les statuts persistants réversibles à d'autres familles d'effets sans restaurer artificiellement une ressource dépensée entre-temps;
- ligne de vue/perception et combat à continuer d'unifier sans doublons;
- choisir et brancher plus tard le backend distant réel, puis définir compte/synchronisation/conflits/offline;
- audit systématique ancien GenSrpG : assets, sons, sauvegardes, PWA/cache, historique Capture, UI cachées et tests legacy.
