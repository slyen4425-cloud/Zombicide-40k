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
- Les inspections et résumés restent strictement consultatifs : aucune attaque, IA, déplacement, dégâts, soin, capture ou progression du temps n’est déclenché depuis ces vues.
- La liste Équipe active expose le switch manuel de créature active pendant un combat via `switchCaptureBattleCreature()`.
- Le bouton `Changer` n’apparaît que pour une créature de l’équipe active, vivante, différente de la créature actuellement active et pendant un combat actif ; la réserve n’expose jamais cette commande.
- Le chemin autoritaire des capacités joueur utilise `executeCapturePlayerAbility()`, qui appelle `useCaptureBattleAbility()` et persiste le `abilityState` retourné dans `activeTeam`, `roster` et la copie de créature du combat.
- La page Capture accepte maintenant une bibliothèque explicite `abilityDefs`. Une capacité n’est jouable dans l’UI que si son ID possède une définition exacte dans cette bibliothèque.
- Le bouton `Utiliser` apparaît uniquement sur la créature actuellement active, pendant un combat actif, pour une capacité explicitement définie ; il est désactivé si le cooldown autoritaire est > 0 ou si les charges autoritaires sont à 0.
- L’UI ne calcule ni portée, ni dégâts, ni coût, ni réaction, ni KO : le clic passe exclusivement par `executeCapturePlayerAbility()`.
- Si la capacité termine réellement le combat, le driver gameplay de la session est arrêté avec l’état autoritaire retourné.
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
- première commande gameplay UI — switch manuel de créature active : `34695849063` success
- persistance autoritaire des charges/cooldowns après capacité joueur : `34696817140` success
- commande UI de capacité pour la créature active : `34698467186` success

## Dernière étape terminée

Commande UI `Utiliser` pour les capacités de la créature active :
- `capture/runtime.js` expose désormais publiquement `CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT` et `executeCapturePlayerAbility()` ;
- `CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalPlayerAbilityAction` est actif ;
- `mountCapturePage(...,{abilityDefs})` indexe uniquement les définitions explicitement fournies ;
- une capacité sans définition explicite reste visible en lecture seule mais n’expose aucun bouton `Utiliser` ;
- une capacité définie sur la créature actuellement active peut exposer `Utiliser` ;
- cooldown > 0 ou charges = 0 désactivent le bouton à partir de l’état autoritaire déjà affiché ;
- le clic appelle uniquement `executeCapturePlayerAbility(session.state,{abilityDef})` ;
- après réussite, l’état autoritaire remplace celui de la session puis roster et résumé adverse sont rerendus ;
- si l’action termine le combat, le driver gameplay est arrêté ;
- aucun bouton de capacité n’est ajouté à la réserve ou aux créatures non actives ;
- aucun `useCaptureBattleAbility()` direct, aucune initialisation implicite de capacité, aucun calcul RPG ni aléatoire n’existe dans la page.

Régression :
- `v2/tests/capture-ui-player-ability-action.test.mjs` vérifie l’exposition publique du contrôleur, une résolution de dégâts réelle, la persistance charge/cooldown et les garde-fous statiques de l’UI ;
- `v2/tests/capture-ui-roster-list.test.mjs` a été ajusté pour reconnaître le nouveau rendu contextualisé des capacités sans relâcher ses protections ;
- premier run `34698412692` bloqué uniquement par l’ancienne assertion statique `entry.abilities.map(rosterAbilityHtml)` ;
- batterie complète corrigée : `34698467186` success.

Commits de l’étape :
- façade runtime capacité joueur : `a54c5127a4b7f2bb12830e970a01350ffe4c32ea`
- commande UI capacité active : `b4244e769d69f7d32629160b7a2564a73ce8719b`
- régression dédiée : `6426b02c74cc475c97a1e1f5e18aa3f504101984`
- garde roster adapté : `1bc437828dcd7466c08732272ceb1911264427ce`

## Priorités ouvertes

1. prochaine étape Capture : exposer progressivement la commande de déplacement tactique autoritaire de la créature active, sans réécrire le moteur spatial ;
2. ensuite raccorder la tentative de capture par orbe uniquement lorsque les coefficients/valeurs requis sont explicitement validés et disponibles ;
3. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
4. enrichir les autres réactions/effets tactiques uniquement si leurs contrats sont validés ;
5. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
