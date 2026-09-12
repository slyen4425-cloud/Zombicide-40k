# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, état combat/PV/KO/statuts/capacités/réactions, résumé adverse actif et inspection adverse.
- Le résumé adverse, les cartes Équipe active/Réserve et l’overlay d’inspection des créatures possédées utilisent désormais le registre canonique `capture-creature-assets.json` pour résoudre les IDs/noms canoniques.
- Le registre Capture est chargé de façon lazy en parallèle du module Capture, uniquement à l’ouverture du mode.
- Un art/icône ne peut être rendu que si le registre fournit un `path` autorisé dans `v2/assets/capture/creatures/` et que son statut n’est plus `pending_import`.
- Aucun fallback RPG/Dungeon n’est accepté. Si le registre est absent, invalide ou encore `pending_import`, la vue reste sans image.
- Les 14 visuels canoniques actuels restent tous `pending_import` avec `path:null`; les noms canoniques sont actifs, mais aucune image réelle n’est encore affichée.
- Le temps visuel des notices reste strictement séparé du temps gameplay.
- L’overlay concret suspend uniquement le temps visuel et n’appelle jamais le blocage gameplay.
- Les inspections et résumés restent strictement consultatifs.
- La page Capture expose maintenant trois commandes gameplay autoritaires déjà raccordées : switch manuel de créature active, utilisation de capacité explicitement définie, déplacement tactique cardinal d’une case.
- Le bouton `Changer` n’apparaît que pour une créature de l’équipe active, vivante, différente de la créature actuellement active et pendant un combat actif ; la réserve n’expose jamais cette commande.
- Le chemin autoritaire des capacités joueur utilise `executeCapturePlayerAbility()`, qui appelle `useCaptureBattleAbility()` et persiste le `abilityState` retourné dans `activeTeam`, `roster` et la copie de créature du combat.
- La page Capture accepte une bibliothèque explicite `abilityDefs`. Une capacité n’est jouable dans l’UI que si son ID possède une définition exacte dans cette bibliothèque.
- Le bouton `Utiliser` apparaît uniquement sur la créature actuellement active, pendant un combat actif, pour une capacité explicitement définie ; il est désactivé si le cooldown autoritaire est > 0 ou si les charges autoritaires sont à 0.
- L’UI ne calcule ni portée, ni dégâts, ni coût, ni réaction, ni KO : le clic passe exclusivement par `executeCapturePlayerAbility()`.
- Le déplacement joueur passe exclusivement par `executeCapturePlayerMove()` : quatre commandes cardinales `↑ ↓ ← →`, une case par commande, sans diagonale.
- Les contrôles de déplacement n’apparaissent que sur la créature actuellement active, vivante et pendant un combat actif ; ils n’apparaissent ni sur les autres membres de l’équipe ni dans la réserve.
- `executeCapturePlayerMove()` lit la position autoritaire avec le Core spatial puis appelle `moveCaptureBattleCreature()` ; murs/cases bloquées/pathfinding restent décidés par le moteur spatial.
- Aucun accès direct de la page à `getActorPosition()`, `setActorPosition()` ou `moveCaptureBattleCreature()` n’est autorisé.
- Aucun `abilityState` manquant, aucune charge, aucun cooldown et aucune définition de capacité ne sont inventés.
- Les 4 orbes reconnues restent `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; coefficients non inventés.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu’à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu’à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed / temps visuel / visibilité / overlay : success jusqu’à `34687557658`
- inspection métier de créature : `34688278893` success
- listes Équipe active/Réserve inspectables : `34688524627` success
- marquage créature active en combat : `34690135197` success
- affichage PV / KO du roster : `34690466513` success
- affichage statuts actifs du roster : `34690816101` success
- affichage charges / cooldowns capacités : `34691249135` success
- affichage état réactions / esquive : `34692442765` success
- inspection détaillée PV/KO/statuts/capacités/réactions : `34692774662` success
- résumé visuel adversaire actif : `34693245713` success
- inspection adverse depuis le résumé : `34693630321` success
- nom canonique + gating assets adversaire : `34693958720` success
- nom canonique + gating assets roster : `34694300782` success
- nom canonique dans inspection créature possédée : `34694675567` success
- switch manuel de créature active : `34695849063` success
- persistance autoritaire des charges/cooldowns après capacité joueur : `34696817140` success
- commande UI de capacité pour la créature active : `34698467186` success
- déplacement tactique cardinal joueur : `34698850672` success

## Dernière étape terminée

Déplacement tactique manuel de la créature active depuis la page Capture :
- nouveau module `v2/src/modes/capture/player-move-action.js` ;
- `executeCapturePlayerMove(state,{direction})` accepte seulement `up`, `down`, `left`, `right` ;
- la position courante est lue depuis le Core spatial avec `getActorPosition()` ;
- la cible est strictement la case cardinale voisine ;
- le mouvement autoritaire passe par `moveCaptureBattleCreature(state,'player',target,{movement:1,diagonal:false})` ;
- une direction invalide est refusée ;
- un héros/créature KO ne peut pas se déplacer ;
- une case bloquée est refusée par le moteur spatial existant ;
- l’état source n’est pas muté ;
- `capture/runtime.js` expose `CAPTURE_PLAYER_MOVE_ACTION_CONTRACT` et `executeCapturePlayerMove()` via la façade canonique ;
- la carte de la créature active affiche `↑ ↓ ← →` pendant un combat actif uniquement ;
- la page appelle seulement `executeCapturePlayerMove()` puis rerend roster et résumé adverse après succès ;
- aucun calcul spatial direct n’a été ajouté dans l’UI.

Régression :
- `v2/tests/capture-player-move-action.test.mjs` couvre déplacement droit/haut, blocage obstacle, KO, absence de combat, direction invalide et non-mutation ;
- `v2/tests/capture-ui-player-move-action.test.mjs` protège l’exposition publique, les quatre contrôles cardinaux et l’absence d’accès spatial bas niveau dans la page ;
- batterie complète : `34698850672` success.

Commits de l’étape :
- contrôleur déplacement cardinal : `d6e631e1995fb2a2a5de17c2e497ae00a835db5a`
- façade runtime : `eb0230bafe02c360674a9ad1d33f3f2a1d65ca5a`
- régression contrôleur : `939b5fb5e00bcd07df1b50312a5bc060f5e93903`
- contrôles UI : `81459c8f5a4fa39ac87e7205abf1f25bb683729c`
- régression UI : `134a3d08a2af2e8393eee5b884d7de56386f642b`

## Priorités ouvertes

1. prochaine étape Capture : ajouter un retour visuel simple de position/distance pour aider le joueur à comprendre la portée sans calculer la règle dans l’UI ;
2. ensuite raccorder la tentative de capture par orbe uniquement lorsque les coefficients/valeurs requis sont explicitement validés et disponibles ;
3. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
4. enrichir les autres réactions/effets tactiques uniquement si leurs contrats sont validés ;
5. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
