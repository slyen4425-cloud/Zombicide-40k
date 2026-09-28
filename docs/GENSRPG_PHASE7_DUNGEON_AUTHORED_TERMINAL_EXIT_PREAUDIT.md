# GenSrpG — Phase 7 / Dungeon movement — politique de sortie terminale authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-real-exit-index-green-2026-09-28`

SHA exact de base :
`f470567fe25c2ed2b9f8dc9ff73eb59bf0d04b79`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-terminal-exit-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-terminal-exit-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36476396122` — SUCCESS ;
- Firefox : `36476396302` — SUCCESS ;
- Tactical Dock : `36476396223` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les micro-lots authored movement déjà extraits sont :
- `planAuthoredEntryMovement(remainingValue)` ;
- `planAuthoredArrivalCell(mapCellCount, edgeEntryIndex, mapEntryIndex)` ;
- `resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)` ;
- `selectAuthoredOutgoingEdge(outgoingEdges, heroPosition, positionalEnabled)` ;
- `resolveAuthoredRealExitIndex(cells, directExitIndex)`.

Le seam suivant reste volontairement étroit dans :
`DungeonAuthoredRuntime167839.atTerminalExit(x)`.

Implémentation historique ciblée :

`const hero=activeHero(x),exitIdx=realExitIndex(x); if(!hero||exitIdx<0)return false; if(!positional())return true; return Number(x?.positions?.[hero])===exitIdx`.

## Cible stricte du micro-lot 12

Isoler uniquement la décision booléenne terminale à partir de valeurs déjà résolues.

API candidate après caractérisation GREEN :
`GensDungeonV1.movement.isAuthoredTerminalExit(heroId, realExitIndex, positionalEnabled, heroPosition)`.

Responsabilité unique :
1. retourner `false` si aucun héros actif ;
2. retourner `false` si l’index de sortie réel est négatif ;
3. si le déplacement positionnel est désactivé, retourner `true` ;
4. sinon comparer `Number(heroPosition) === realExitIndex`.

## Parité historique à préserver

- héros vide + sortie valide : `false` ;
- héros présent + sortie `-1` : `false` ;
- héros présent + sortie valide + positional OFF : `true` quelle que soit la position ;
- positional ON + position numérique correspondante : `true` ;
- positional ON + chaîne numérique correspondante : `true` via `Number(...)` ;
- positional ON + position différente / absente / invalide : `false`.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839

Reste propriétaire de :
- `activeHero(x)` ;
- `realExitIndex(x)` comme consommateur du resolver déjà extrait ;
- `positional()` et ses lectures globales ;
- lecture de `x.positions[hero]` ;
- `atTerminalExit(x)` comme consommateur/raccord ;
- `travel()`, `finishTerminal()`, notifications et politique de navigation authored.

### DungeonSpatial313

Reste entièrement propriétaire de la persistance / activation spatiale.

## Hors périmètre absolu

Ne pas toucher :
- résolution de la vraie case sortie déjà extraite ;
- sélection des arêtes ;
- entrée / arrivée / move allowance ;
- déplacement case-à-case ;
- pathfinding ;
- consommation de mouvement ;
- positions ;
- `positional()` ;
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

1. caractérisation GREEN de `atTerminalExit(x)` sur cette base exacte ;
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
