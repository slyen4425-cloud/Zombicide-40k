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
- Le résumé adverse affiche désormais aussi la distance praticable réelle jusqu’à l’adversaire, calculée par `shortestPathDistance()` dans un presenter dédié. Les détours autour des obstacles sont pris en compte ; absence de chemin => `inaccessible`.
- L’inspection adverse affiche `Votre position`, `Position adverse` et `Distance praticable` sans modifier le combat ni déduire une règle de portée.

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

## Dernière étape terminée

Retour visuel spatial lecture seule :
- nouveau presenter `v2/src/modes/capture/ui-spatial-summary.js` ;
- `buildCaptureSpatialSummary()` lit les actor IDs et positions autoritaires du combat ;
- la distance est calculée avec le Core partagé `shortestPathDistance()` en non-diagonal par défaut ;
- un détour autour d’obstacles retourne sa vraie longueur ;
- un chemin impossible retourne `distance:null` et `distanceLabel:'inaccessible'` ;
- aucun déplacement, aucune capacité, aucune capture et aucune mutation ne sont effectués ;
- `capture/runtime.js` expose `CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT` et `buildCaptureSpatialSummary()` via la façade canonique ;
- `buildCaptureOpponentSummary()` réutilise ce presenter et ajoute la distance au titre visible (`Nom · distance N`) ;
- l’inspection adverse ajoute position joueur, position adverse et distance praticable ;
- aucune règle de portée de capacité n’est recalculée dans l’UI.

Régression :
- `v2/tests/capture-ui-spatial-summary.test.mjs` couvre distance directe, détour, inaccessible, absence de combat et non-mutation ;
- `v2/tests/capture-ui-opponent-summary.test.mjs` couvre l’intégration de la distance et les nouveaux champs d’inspection ;
- batterie complète : `34699538838` success.

Commits de l’étape :
- presenter spatial : `8ceb8df6d1583ae57a86e7edfd5edba042217316`
- façade runtime : `c6ec4de8ba39c18cd0106d5e531f27324f068eb7`
- intégration résumé/inspection adverse : `4f711c7f56c98ab8c7d6105dbee7601cd6529829`
- régression résumé adverse : `c514e20f485418a4414554948b176934d0635c7f`
- régression presenter spatial : `ac7c8a9197617675d4e018d3f4fa3aa215325aa6`

## Priorités ouvertes

1. prochaine étape Capture : afficher aussi la portée explicite des capacités définies à côté de leur commande, sans calculer leur utilisabilité dans l’UI ;
2. améliorer ensuite le retour utilisateur des tentatives de capture (ratée/réussie/configuration indisponible) via les notices existantes, sans modal bloquante ;
3. importer les vrais arts principaux + icônes quand les fichiers validés sont disponibles ;
4. figer les coefficients réels des 4 orbes et le multiplicateur bas PV uniquement quand leurs valeurs auront été validées ;
5. finalisation V2 globale : sons, PWA/cache, mobile, parité legacy, multiplayer restant, nettoyage des comportements cachés et batterie finale avant toute publication.
