# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture actuel : roster/équipe/réserve, migration IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts/effets périodiques, réactions/esquive, coût/cooldown, fenêtres temporelles, pas temporel unifié, scheduler, driver gameplay, lifecycle UI/app, événements UI, dispatcher non bloquant, feed borné, driver visuel UI isolé, adaptateur/source d’horloge visuelle, source activité/visibilité, contrôleur multi-raisons de pause visuelle, blocage UI présentationnel, overlay concret non modal, inspection métier détaillée de créature, listes Équipe active/Réserve inspectables, état combat/PV/KO/statuts/capacités/réactions, résumé adverse actif et inspection adverse.
- Le résumé adverse, les cartes Équipe active/Réserve et l’overlay d’inspection des créatures possédées utilisent le registre canonique `capture-creature-assets.json` pour résoudre les IDs/noms canoniques.
- Le registre Capture est chargé de façon lazy uniquement à l’ouverture du mode ; aucun fallback RPG/Dungeon n’est accepté.
- Les 14 visuels canoniques actuels restent `pending_import` avec `path:null`; les noms canoniques sont actifs, mais aucune image réelle n’est encore affichée.
- Le temps visuel des notices reste strictement séparé du temps gameplay et l’overlay ne bloque jamais le moteur.
- La page Capture expose maintenant quatre commandes gameplay autoritaires : switch manuel, capacité explicitement définie, déplacement tactique cardinal d’une case et tentative de capture par orbe explicitement configurée.
- Le bouton `Changer` n’apparaît que pour une créature active-team vivante, différente de l’actuelle et pendant un combat actif.
- Le chemin capacité joueur utilise `executeCapturePlayerAbility()` et persiste charges/cooldowns dans `activeTeam`, `roster` et la créature de combat ; aucune définition/charge/cooldown absente n’est inventé.
- `abilityDefs` reste une bibliothèque injectée explicitement ; une capacité sans définition exacte reste seulement consultative.
- Le déplacement joueur passe exclusivement par `executeCapturePlayerMove()` : `↑ ↓ ← →`, une case, sans diagonale ; obstacles/pathfinding restent décidés par le Core spatial.
- La capture joueur passe désormais par `executeCapturePlayerCaptureAttempt()` ; la page reçoit un `captureConfig` explicite contenant `speciesCaptureRates`, `orbLibrary` et éventuellement `lowHpMultiplier`.
- Aucun bouton d’orbe n’est rendu si le taux de l’espèce manque, si le coefficient de l’orbe manque ou vaut <=0, si le stock est nul, si les PV adverses sont invalides, ou si l’adversaire est strictement sous 30 % PV sans multiplicateur bas PV explicite.
- La règle bas PV reste strictement `<30%`, conforme au contrat existant ; aucun multiplicateur n’est inventé.
- Une tentative refusée pour configuration incomplète ne consomme pas d’orbe ; une tentative valide ratée consomme une orbe et garde le combat ; une capture réussie consomme l’orbe, ajoute une instance distincte à l’équipe ou à la réserve, termine le combat et relibère l’exploration.
- Les 4 IDs d’orbes reconnus restent `capture_orb_basic`, `capture_orb_plus`, `capture_orb_ultra`, `capture_orb_master`; leurs coefficients par défaut restent volontairement `null` tant qu’ils ne sont pas validés.

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
- tentative de capture par orbe configurée explicitement : `34699118520` success

## Dernière étape terminée

Tentative de capture par orbe depuis la page Capture, sans inventer aucune valeur :
- nouveau module `v2/src/modes/capture/player-capture-action.js` ;
- `executeCapturePlayerCaptureAttempt()` lit l’espèce et les PV adverses depuis le combat autoritaire puis appelle exclusivement `attemptCaptureInBattle()` ;
- le taux d’espèce doit exister explicitement dans `speciesCaptureRates` ;
- l’orbe doit exister dans l’`orbLibrary` injectée et posséder un `captureCoefficient` fini > 0 ;
- si l’adversaire est strictement sous 30 % PV, `lowHpMultiplier` doit être explicitement fourni et > 0 ;
- aucune configuration incomplète ne consomme d’orbe ;
- la page n’affiche que les orbes avec configuration valide ET stock > 0 ;
- une tentative ratée décrémente le stock de l’orbe mais conserve combat/rencontre ;
- une capture réussie ajoute une instance distincte à l’équipe si elle contient moins de 6 créatures, sinon à la réserve, puis termine le combat et arrête le driver gameplay de la session ;
- aucun coefficient de `CAPTURE_ORB_LIBRARY` n’a été modifié : les quatre coefficients intégrés restent `null`.

Régression :
- `v2/tests/capture-player-capture-action.test.mjs` couvre taux manquant sans consommation, multiplicateur bas PV manquant sans consommation, échec valide avec consommation et combat conservé, réussite avec capture/roster/fin de combat ;
- `v2/tests/capture-ui-player-capture-action.test.mjs` protège l’injection explicite de `captureConfig`, le gating du stock/coefficient/taux/bas-PV et l’absence de coefficient ou multiplicateur codé en dur dans la page ;
- batterie complète : `34699118520` success.

Commits de l’étape :
- contrôleur tentative capture joueur : `d5ca587bfd1fd54ba1e0499816cd8057d3c5cac0`
- façade runtime : `28ec7856e48cbacce576318c220e43ede108c909`
- commande UI orbes : `1bc74d4ab332b9606ec043b58bb0d1cf48f44eb2`
- régression contrôleur : `366e58812ff14fa045c90ec0767082a3f06a3488`
- régression UI : `42891c7a090a2add61e4564a718cb17ff3e38b37`

## Priorités ouvertes

1. prochaine étape Capture : ajouter un retour visuel simple de position/distance/portée pour aider à comprendre pourquoi une capacité ou un déplacement est refusé, sans recalculer les règles dans l’UI ;
2. ensuite améliorer le retour utilisateur des tentatives de capture (ratée/réussie/configuration indisponible) via le système de notices existant, sans modal bloquante ;
3. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles, une seule paire par espèce canonique ;
4. figer les coefficients réels des 4 orbes et le multiplicateur bas PV uniquement quand leurs valeurs auront été validées ;
5. enrichir les autres réactions/effets tactiques uniquement si leurs contrats sont validés ;
6. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
