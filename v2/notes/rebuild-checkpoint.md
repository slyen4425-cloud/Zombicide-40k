# GenSrpG V2 — point de reprise

Branche de travail : `rebuild/v2`

La V2 reste isolée de `main` tant que la parité et la validation utilisateur ne sont pas suffisantes.

## État important au 2026-09-12

- Séparation stricte Survie / RPG / Monster Capture / VS-PVP.
- RPG data-driven et combat D100/tours protégés par leurs régressions existantes.
- Donjon/World Builder/tactique déjà construits : déplacement individuel, pathfinding, portes/passages, obstacles/couverture, LOS/portée, salles authored, quêtes/événements/PNJ/alliés/loot et combats réels.
- Monster Capture autonome, stockage `gensrpg:v2:capture:*`, aucun partage gameplay mutable avec RPG.
- Runtime Capture : roster/équipe/réserve, migrations IDs, assets canoniques, objets/capacités, biomes/rencontres, exploration, capture, combat dynamique dédié, IA, PV/KO, statuts, réactions/esquive, temps abstrait, scheduler/driver, UI events/notices, overlay/inspection, commandes gameplay et résumé spatial.
- Registre assets Capture lazy, aucun fallback RPG/Dungeon ; les 14 visuels restent `pending_import` avec `path:null`.
- La page Capture expose quatre commandes gameplay autoritaires : switch manuel, capacité explicitement définie, déplacement tactique cardinal d’une case et tentative de capture par orbe explicitement configurée.
- `abilityDefs` reste injecté explicitement ; aucune capacité absente n’est rendue jouable.
- Le déplacement joueur passe exclusivement par `executeCapturePlayerMove()` ; obstacles/pathfinding restent décidés par le Core spatial.
- La capture joueur passe par `executeCapturePlayerCaptureAttempt()` ; taux d’espèce, coefficient d’orbe et multiplicateur bas PV éventuel restent explicitement requis.
- La règle bas PV reste strictement `<30%`; aucun coefficient/multiplicateur n’est inventé.
- Le résumé adverse affiche la distance praticable réelle jusqu’à l’adversaire, calculée par `shortestPathDistance()` dans un presenter dédié. Les détours autour des obstacles sont pris en compte ; absence de chemin => `inaccessible`.
- L’inspection adverse affiche `Votre position`, `Position adverse` et `Distance praticable` sans modifier le combat ni déduire une règle de portée.
- Les tentatives de capture alimentent désormais le feed non bloquant existant : réussite, échec et configuration indisponible produisent des notices `aria-live` sans popup ni pause gameplay.

## Jalons CI récents validés

- runtime Capture isolé : `34679708898` success
- capture/IA/KO/statuts/réactions : jalons success jusqu’à `34684569147`
- façade/scheduler/driver/lifecycle UI : success jusqu’à `34685171946`
- événements/dispatcher UI : `34685389994`, `34685525379` success
- feed / temps visuel / visibilité / overlay : success jusqu’à `34687557658`
- inspection/listes/états combat : success jusqu’à `34694675567`
- switch manuel de créature active : `34695849063` success
- persistance capacités joueur : `34696817140` success
- commande UI capacité : `34698467186` success
- déplacement tactique cardinal : `34698850672` success
- tentative de capture par orbe configurée explicitement : `34699118520` success
- retour spatial position/distance praticable : `34699538838` success
- notices non bloquantes des tentatives de capture : `34699910099` success

## Dernière étape terminée

Retour utilisateur non bloquant des tentatives de capture :
- `CAPTURE_UI_EVENT_CONTRACT.captureAttemptEvents` est actif ;
- nouveau `captureUiEventsFromCaptureAttempt()` transforme un résultat autoritaire en `capture_success`, `capture_failed` ou `capture_unavailable` ;
- une configuration indisponible conserve le `reason` réel (`missing_species_capture_rate`, `pending_orb_coefficient`, `pending_low_hp_multiplier`, etc.) ;
- `ui-dispatcher.js` transforme ces événements en messages français lisibles ;
- toutes ces notices ont `blocking:false` et ne suspendent jamais le combat ;
- `capture/runtime.js` expose le nouvel event builder via la façade canonique ;
- `capture-page.js` injecte le résultat de chaque `attemptCapture()` dans le feed existant avec `appendCaptureUiNotices()` ;
- une capture réussie affiche `Capture réussie !`, une tentative ratée `Capture ratée. Le combat continue.`, et une configuration manquante explique le blocage ;
- aucun `alert`, `confirm`, overlay, `setCaptureBattleBlocking()` ou timer supplémentaire n’a été ajouté.

Régression :
- `v2/tests/capture-ui-events.test.mjs` couvre les trois événements capture ;
- `v2/tests/capture-ui-dispatcher.test.mjs` couvre les textes, le caractère non bloquant et le raccordement de la page au feed ;
- batterie complète : `34699910099` success.

Commits de l’étape :
- événements capture UI : `4a54a4e2bd5e83e8429cb8fc407b0dc10bfa9ec0`
- dispatcher notices capture : `1bc0c5e66c57fae2398f56fd905b4073a4ba240f`
- façade runtime : `8db645fb0f217265483249dfc5899bac7dfa560f`
- raccordement page/feed : `93675ba8bb74c45c6b2dd1d14e769194e94c02c9`
- régression événements : `9797feba01471fe2444cfd054778085df4fae901`
- régression dispatcher/page : `7e27d5fb95659dee19ce9eada7788ce95d4118db`

## Priorités ouvertes

1. prochaine étape Capture : afficher la portée explicite des capacités définies à côté de leur commande, sans calculer leur utilisabilité dans l’UI ;
2. ensuite améliorer le retour des actions refusées (capacité hors portée, déplacement impossible) via les notices existantes, sans modal bloquante ;
3. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles ;
4. figer les coefficients réels des 4 orbes et le multiplicateur bas PV uniquement quand leurs valeurs auront été validées ;
5. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
