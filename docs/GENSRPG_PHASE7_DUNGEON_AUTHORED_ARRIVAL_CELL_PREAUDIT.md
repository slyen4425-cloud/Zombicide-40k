# GenSrpG — Phase 7 / Dungeon movement — case d'arrivée authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-entry-movement-green-2026-09-28`

SHA exact de base :
`c6553ce1a381c356515c4791eab327c0bc16db35`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-arrival-cell-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-arrival-cell-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Runtime de base :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Le micro-lot 7 a isolé la décision pure remaining-versus-fallback du mouvement d'entrée authored.

Le seam mouvement suivant retenu est volontairement étroit :
`DungeonAuthoredRuntime167839.arrival(map, edge)`.

Comportement historique :
`const n=Number(edge?.toEntryIndex); return Number.isInteger(n)&&n>=0&&n<map.cells.length ? n : Math.max(0,Number(map.entryIdx)||0)`.

## Cible stricte du micro-lot 8

Isoler uniquement le choix pur de la case d'arrivée authored.

API cible proposée après caractérisation GREEN :
`GensDungeonV1.movement.planAuthoredArrivalCell(mapCellCount, edgeEntryIndex, mapEntryIndex)`.

Contrat cible :
- `edgeEntryIndex` convertible en entier, `>=0` et `< mapCellCount` -> utiliser cette case ;
- sinon -> fallback vers `Math.max(0, Number(mapEntryIndex)||0)`.

Aucun accès à :
- DOM ;
- storage ;
- `DungeonSpatial313` ;
- positions runtime ;
- Room Creator ;
- World Builder ;
- Tactical.

## Pourquoi ce seam

Il permet de poursuivre l'isolation de `movement` sans déplacer :
- l'écriture `x.positions[hero]=...` ;
- la persistance spatiale ;
- le changement de salle ;
- le pathfinding ;
- la consommation de mouvement ;
- les événements post-déplacement ;
- les interactions ;
- le combat.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839
Reste propriétaire pendant ce micro-lot de :
- `enterNode(...)` ;
- les deux écritures `x.positions[hero]=arrival(map,edge)` ;
- l'accès au map réel ;
- `DungeonSpatial313.ensure/persist/setRoom/activate` ;
- authored travel.

### DungeonSpatial313
Reste propriétaire des snapshots et de la persistance spatiale.

### Hors périmètre absolu
Ne pas toucher :
- déplacement de case en case ;
- portée / movement allowance ;
- pathfinding ;
- fin de tour ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- LOS / ennemis ;
- combat trigger / Tactical ;
- authored action fix ;
- authored return persist ;
- generated exploration ;
- Survival / Capture / PvP ;
- assets.

## Invariants de parité

- `mapCellCount=16, edgeEntryIndex=5, mapEntryIndex=12` -> 5 ;
- `edgeEntryIndex="5"` -> 5 ;
- `edgeEntryIndex=-1` -> fallback ;
- `edgeEntryIndex=16` -> fallback ;
- `edgeEntryIndex=1.5` -> fallback ;
- `edgeEntryIndex=undefined` -> fallback ;
- fallback `mapEntryIndex=12` -> 12 ;
- fallback `mapEntryIndex=-4` -> 0 ;
- fallback `mapEntryIndex=undefined` -> 0 ;
- aucune écriture position/persistance dans le planner.

## TDD obligatoire

1. caractérisation GREEN du seam historique ;
2. raccord de la caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. UNE garde RED exigeant l'API pure Dungeon et son raccord unique ;
5. preuve RED isolée ;
6. micro-diff minimal ;
7. triple CI ;
8. aucun test utilisateur si comportement strictement neutre ;
9. fermeture documentaire + checkpoint GREEN final.

## Rule 26

Aucune modification de `index.html` prévue pour ce micro-lot.
Si le périmètre change et exige l'inline exact, Rule 26 devra être appliquée avant toute modification.
