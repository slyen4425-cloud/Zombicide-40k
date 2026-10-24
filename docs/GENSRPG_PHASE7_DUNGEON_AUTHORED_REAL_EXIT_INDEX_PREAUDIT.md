# GenSrpG — Phase 7 / Dungeon movement — vraie case sortie authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-exit-edge-selection-green-2026-09-28`

SHA exact de base :
`27fcd34dd606f4e751a37f07819428536fb7f629`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-real-exit-index-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-real-exit-index-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36471642373` — SUCCESS ;
- Firefox : `36471642303` — SUCCESS ;
- Tactical Dock : `36471642315` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les micro-lots authored movement déjà extraits sont :
- `planAuthoredEntryMovement(remainingValue)` ;
- `planAuthoredArrivalCell(mapCellCount, edgeEntryIndex, mapEntryIndex)` ;
- `resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)` ;
- `selectAuthoredOutgoingEdge(outgoingEdges, heroPosition, positionalEnabled)`.

Le seam suivant reste volontairement étroit dans :
`DungeonAuthoredRuntime167839.realExitIndex(x)`.

Implémentation historique ciblée :

`const map=x?.last?.map||{},cells=Array.isArray(map.cells)?map.cells:[]; const direct=Number(map.exitIdx); if(Number.isInteger(direct)&&direct>=0&&String(cells[direct]||"").toLowerCase()==="exit")return direct; return cells.findIndex(v=>String(v||"").toLowerCase()==="exit")`

## Cible stricte du micro-lot 11

Isoler uniquement la résolution pure de la vraie case SORTIE à partir de valeurs déjà résolues.

API candidate après caractérisation GREEN :
`GensDungeonV1.movement.resolveAuthoredRealExitIndex(cells, directExitIndex)`.

Responsabilité unique :
1. utiliser `Number(directExitIndex)` ;
2. accepter l’index direct uniquement s’il est entier, >= 0 et pointe vers une cellule dont la valeur normalisée est `"exit"` ;
3. sinon rechercher la première cellule dont la valeur normalisée est `"exit"` ;
4. retourner `-1` si aucune vraie sortie n’existe.

## Parité historique à préserver

- index direct valide sur une cellule `exit` : priorité à cet index ;
- index direct chaîne numérique valide : conversion `Number(...)` conservée ;
- index direct négatif, fractionnaire, hors tableau ou pointant ailleurs : fallback par recherche ;
- comparaison cellule via `String(value||"").toLowerCase()==="exit"` ;
- première cellule `exit` gagnante au fallback ;
- absence de sortie : `-1`.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839
Reste propriétaire de :
- lecture `x?.last?.map` ;
- `realExitIndex(x)` comme consommateur/raccord ;
- `activeHero(x)` ;
- `atTerminalExit(x)` ;
- `positional()` et ses lectures globales ;
- lecture de `x.positions[hero]` ;
- travel et politique de fin authored.

### DungeonSpatial313
Reste entièrement propriétaire de la persistance / activation spatiale.

## Hors périmètre absolu

Ne pas toucher :
- logique `atTerminalExit(x)` ;
- politique positional ;
- positions ;
- déplacement case-à-case ;
- pathfinding ;
- consommation de mouvement ;
- entrée / arrivée / move allowance / outgoing edge déjà extraits ;
- `DungeonSpatial313` ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- ennemis / LOS ;
- Tactical / combat ;
- generated movement ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de `realExitIndex(x)` sur cette base exacte ;
2. raccord de cette caractérisation à Architecture ;
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


## TDD observé

### Caractérisation GREEN

SHA :
`e74acac774e77e709ecc4be8dbc8b5fb1c716790`.

Validation :
- Architecture + Browser : `36473130186` — SUCCESS ;
- Firefox : `36473130614` — SUCCESS ;
- Tactical Dock : `36473130177` — SUCCESS.

La caractérisation verrouille :
- priorité de l’index direct uniquement s’il pointe réellement vers une cellule `exit` ;
- coercition numérique historique de `exitIdx` ;
- fallback vers la première vraie cellule `exit` si l’index direct est invalide ;
- comparaison insensible à la casse via `String(value||"").toLowerCase()` ;
- absence de sortie => `-1` ;
- politique `atTerminalExit(x)` inchangée.

### RED isolé

SHA RED :
`15dd8983b3d54d79117b8d9a7cb8575061c8508c`.

CI :
- Architecture : `36474354853` — FAILURE attendue ;
- seule étape rouge : `#202 — Exiger la vraie case sortie Dungeon Phase 7` ;
- Browser : SKIPPED uniquement à cause du RED Architecture ;
- Firefox : `36474354955` — SUCCESS ;
- Tactical Dock : `36474354836` — SUCCESS.

Le RED exige uniquement :
`GensDungeonV1.movement.resolveAuthoredRealExitIndex(cells, directExitIndex)`
et son raccord unique dans `DungeonAuthoredRuntime167839.realExitIndex(x)`.

### Micro-diff

Runtime modifié uniquement dans :
- `assets/gensrpg/dungeon/entry-v1.js` : ajout du resolver pur ;
- `assets/dungeon/dungeon-authored-runtime-167839.js` : délégation de `realExitIndex(x)` ;
- `assets/gensrpg/dungeon/module-contract-v1.json` : déclaration de frontière.

Authored Runtime conserve :
- lecture `x?.last?.map` ;
- normalisation de `map.cells` en tableau ;
- `realExitIndex(x)` comme consommateur ;
- `atTerminalExit(x)` ;
- `positional()` ;
- lecture `x.positions[hero]` ;
- travel et politique de fin authored.

`DungeonSpatial313` reste inchangé.

Après le raccord, la caractérisation pré-extraction a logiquement échoué seule sur le SHA
`c502b8c3234fa786d2473e3f4ecd628b89eecb62`
(run Architecture `36474878468`, étape #201), tandis que Firefox `36474878465` et Tactical `36474878491` restaient SUCCESS.
La caractérisation a ensuite été réalignée vers le raccord post-extraction sans modifier les cas de parité ni assouplir la garde métier.

## Fermeture candidate GREEN

SHA technique final :
`416de48972c4a2305ab452e80457a684686764fa`.

CI complète :
- Architecture + Browser Chromium : `36474978235` — SUCCESS ;
- Firefox : `36474978288` — SUCCESS ;
- Tactical Dock : `36474978210` — SUCCESS.

Résultat :
- `GensDungeonV1.movement.resolveAuthoredRealExitIndex(...)` est pur ;
- aucun DOM, storage, timer, listener, observer ou Spatial dans le resolver ;
- Authored Runtime conserve lecture map, terminal-exit policy, positional et position héros ;
- consommation unique du resolver ;
- `atTerminalExit`, déplacement réel, pathfinding, événements/spawn, interactions et Tactical inchangés ;
- `index.html` inchangé : `8169990` octets / `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082` ;
- aucun changement utilisateur visible, donc aucun test utilisateur supplémentaire requis.

Checkpoint final prévu après CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-authored-real-exit-index-green-2026-09-28`.
