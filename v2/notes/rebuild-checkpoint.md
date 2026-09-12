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
- La liste Équipe active expose désormais une première commande gameplay réelle : le switch manuel de créature active pendant un combat, via `switchCaptureBattleCreature()` uniquement.
- Le bouton `Changer` n’apparaît que pour une créature de l’équipe active, vivante, différente de la créature actuellement active et pendant un combat actif ; la réserve n’expose jamais cette commande.
- Le switch réussi resynchronise l’état global autoritaire, puis rerend le roster et le résumé adverse ; aucun switch direct bas niveau n’est utilisé depuis l’UI.
- Le chemin autoritaire des capacités joueur possède maintenant un contrôleur dédié `executeCapturePlayerAbility()` qui appelle `useCaptureBattleAbility()` et persiste le `abilityState` retourné dans `activeTeam`, `roster` et la copie de créature du combat.
- Ce contrôleur utilise le resolver Capture de PV existant par défaut et refuse d’initialiser implicitement un `abilityState` absent : aucune charge, cooldown ou définition n’est inventée.
- Le bouton UI de capacité n’est volontairement pas encore exposé tant que les définitions exactes de capacités Capture ne sont pas fournies explicitement à la page.
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

## Dernière étape terminée

Persistance autoritaire de l’état des capacités joueur avant raccordement UI :
- nouveau module `v2/src/modes/capture/player-ability-action.js` ;
- `executeCapturePlayerAbility()` utilise exclusivement `useCaptureBattleAbility()` pour résoudre portée, charges, cooldown, réactions, effets et KO ;
- `resolveCaptureVitalEffect()` reste le resolver Capture par défaut pour les effets PV déjà supportés ;
- après une action valide, le `abilityState` retourné par le moteur est persisté sur l’instance active dans `activeTeam`, puis répercuté dans `roster` ;
- tant que la même instance reste active, la copie `battle.player.creature` reçoit le même `abilityState` ;
- l’état d’entrée n’est pas muté ;
- si la créature active ne possède pas de `abilityState` explicite, l’action est refusée avec `capture-player-ability-state-missing` au lieu d’initialiser ou d’inventer des charges/cooldowns ;
- aucun runtime RPG, aucune valeur aléatoire et aucune définition de capacité implicite n’est utilisé.

Régression :
- `v2/tests/capture-player-ability-action.test.mjs` vérifie dégâts réels via le resolver Capture, décrément de charge, pose du cooldown, persistance dans `activeTeam`/`roster`/combat, non-mutation de l’état source, refus en cooldown, refus sans `abilityState` et refus sans combat ;
- batterie complète : `34696817140` success.

Commits de l’étape :
- contrôleur capacité joueur + persistance : `c12c0d882d7f2027742ffeb9567d8d98252c49d4`
- régression dédiée : `7eaeff3724a1618917e8b944eee889b3b950c487`

## Priorités ouvertes

1. prochaine étape Capture : raccorder le bouton/commande UI de capacité sur `executeCapturePlayerAbility()` uniquement quand une définition Capture explicite correspond à la capacité de l’instance active ;
2. ne jamais afficher de capacité jouable si sa définition exacte n’est pas disponible ;
3. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
4. compléter les règles d’orbes/coefficient uniquement à partir de valeurs validées ;
5. enrichir les autres réactions/effets tactiques uniquement si leurs contrats sont validés ;
6. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
