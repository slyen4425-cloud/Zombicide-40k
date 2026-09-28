# GenSrpG — Phase 7 / Dungeon movement — sélection de sortie authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-move-allowance-green-2026-09-28`

SHA exact de base :
`646efe7bd37b76081bf1709e89f1a4f777f66ec9`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-exit-edge-selection-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-exit-edge-selection-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36462259908` — SUCCESS ;
- Firefox : `36462259954` — SUCCESS ;
- Tactical Dock : `36462259736` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les micro-lots mouvement authored ont déjà isolé :
- `planAuthoredEntryMovement(remainingValue)` ;
- `planAuthoredArrivalCell(mapCellCount, edgeEntryIndex, mapEntryIndex)` ;
- `resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)`.

Le seam suivant reste volontairement étroit dans :
`DungeonAuthoredRuntime167839.plan(x,g)`.

Implémentation historique ciblée :

`const list=outgoing(g,current),pos=Number(x?.positions?.[hero]); let edge=list.find(e=>Number(e.fromExitIndex)===pos)||null; if(!edge&&!positional()&&list.length===1)edge=list[0];`

## Cible stricte du micro-lot 10

Isoler uniquement la sélection pure d’une arête de sortie authored à partir de valeurs déjà résolues.

API candidate après caractérisation GREEN :
`GensDungeonV1.movement.selectAuthoredOutgoingEdge(outgoingEdges, heroPosition, positionalEnabled)`.

Responsabilité unique :
1. sélectionner la première arête dont `Number(fromExitIndex) === Number(heroPosition)` ;
2. si aucune correspondance, mouvement positionnel désactivé et exactement une arête : sélectionner cette arête ;
3. sinon retourner `null`.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839
Reste propriétaire de :
- `activeHero(x)` ;
- `ensureState(x,g)` ;
- `currentNode(x,s,hero)` ;
- `outgoing(g,current)` ;
- lecture de `x.positions[hero]` ;
- `positional()` et ses lectures globales ;
- construction complète de l’objet retourné par `plan(x,g)` ;
- authored travel ;
- notifications de sortie ;
- positions et `remaining`.

### DungeonSpatial313
Reste entièrement propriétaire de la persistance / activation spatiale.

## Parité historique à préserver

- position correspondant à une sortie : cette sortie est choisie ;
- conversion numérique de `fromExitIndex` conservée ;
- première sortie correspondante gagne en cas de doublon ;
- position sans correspondance + positional ON : `null` ;
- position sans correspondance + positional OFF + exactement 1 sortie : cette sortie est choisie ;
- position sans correspondance + positional OFF + 0 ou plusieurs sorties : `null` ;
- une correspondance de position gagne même si positional est OFF ;
- tableau absent/invalide normalisé seulement si nécessaire au callsite ; ne pas inventer de nouvelle politique gameplay.

## Hors périmètre absolu

Ne pas toucher :
- déplacement case-à-case ;
- pathfinding ;
- consommation de mouvement ;
- `heroMoveAllowance` / `movementForEntry` ;
- case d’arrivée ;
- `positional()` ;
- positions ;
- `DungeonSpatial313` ;
- snapshots ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- ennemis / LOS ;
- Tactical / combat ;
- generated movement ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de la sélection historique dans `plan(...)` ;
2. raccord de la caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. UNE garde RED exigeant l’API pure et son consommateur unique ;
5. preuve RED isolée ;
6. micro-diff minimal dans `entry-v1.js`, `dungeon-authored-runtime-167839.js` et contrat Dungeon uniquement ;
7. aucun changement `index.html` attendu ;
8. triple CI ;
9. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune modification de `index.html` n’est prévue.
Si le périmètre change et exige son contenu exact, arrêter le lot et appliquer Rule 26 avant toute modification.
