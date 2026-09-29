# GenSrpG — Phase 7 / Dungeon movement — décision de verrouillage de sortie authored — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-terminal-exit-green-2026-09-28`

SHA exact de base :
`0621441a3b39f07e82ce97238e70037d7a9f9db9`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-exit-lock-decision-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-exit-lock-decision-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale documentaire de la base :
- Architecture + Browser : `36516451500` — SUCCESS ;
- Firefox : `36516451759` — SUCCESS ;
- Tactical Dock : `36516451884` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les seams authored movement déjà extraits sont :
- `planAuthoredEntryMovement(remainingValue)` ;
- `planAuthoredArrivalCell(mapCellCount, edgeEntryIndex, mapEntryIndex)` ;
- `resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)` ;
- `selectAuthoredOutgoingEdge(outgoingEdges, heroPosition, positionalEnabled)` ;
- `resolveAuthoredRealExitIndex(cells, directExitIndex)` ;
- `isAuthoredTerminalExit(heroId, realExitIndex, positionalEnabled, heroPosition)`.

Le seam suivant reste volontairement étroit dans :
`DungeonAuthoredRuntime167839.blocked(x)`.

Implémentation historique ciblée :

`try { if (ROOT.dungeonRoomExitLocked102?.()) return true } catch (e) {} ; if (x?.last?.exitLocked) return true ; return String(x?.last?.map?.objective?.status || x?.last?.objective?.status || "") === "locked"`.

## Cible stricte du micro-lot 13

Extraire uniquement la décision pure fondée sur l'état déjà lu dans le runtime :
`GensDungeonV1.movement.isAuthoredExitBlocked(lastExitLocked, mapObjectiveStatus, objectiveStatus)`.

Responsabilité pure candidate :
1. retourner `true` si `lastExitLocked` est truthy ;
2. sinon choisir `mapObjectiveStatus || objectiveStatus || ""` ;
3. convertir en chaîne et retourner `true` uniquement pour `"locked"`.

Le garde dynamique `ROOT.dungeonRoomExitLocked102?.()` reste volontairement **hors** du helper pur afin de conserver exactement :
- son évaluation avant les lectures d'état locales ;
- son `try/catch` historique ;
- son court-circuit immédiat en cas de verrouillage externe.

## Parité historique à préserver

- garde dynamique truthy : `true` immédiatement ;
- garde dynamique false/absente : continuer sur l'état authored ;
- garde dynamique qui lève une exception : ignorer l'exception et continuer ;
- `last.exitLocked` truthy : `true` ;
- `last.exitLocked` false + `map.objective.status === "locked"` : `true` ;
- statut map vide/falsy + `last.objective.status === "locked"` : `true` ;
- statut map non vide autre que `"locked"` : il garde la priorité sur le statut fallback ;
- aucun verrou : `false`.

Aucune normalisation de casse n'est ajoutée : la comparaison historique reste strictement `"locked"`.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839

Reste propriétaire de :
- appel `dungeonRoomExitLocked102?.()` ;
- `try/catch` autour de ce garde dynamique ;
- lectures `x.last.exitLocked`, `x.last.map.objective.status`, `x.last.objective.status` ;
- `blocked(x)` comme consommateur/raccord ;
- `travel()` ;
- `syncActionButton()` ;
- notices et politique de navigation authored.

### GensDungeonV1.movement

Ne reçoit qu'une décision pure à partir de valeurs explicites déjà lues.

### DungeonSpatial313

Reste entièrement inchangé et propriétaire de la persistance / activation spatiale.

## Hors périmètre absolu

Ne pas toucher :
- garde dynamique `dungeonRoomExitLocked102` ;
- terminal exit déjà extrait ;
- vraie case sortie ;
- sélection des arêtes ;
- entrée / arrivée / move allowance ;
- déplacement case-à-case ;
- pathfinding ;
- consommation de mouvement ;
- positions ;
- `positional()` ;
- `travel()` et `finishTerminal()` hors simple consommation de `blocked(x)` existante ;
- `syncActionButton()` hors simple consommation de `blocked(x)` existante ;
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

1. caractérisation GREEN de la politique actuelle de `blocked(x)` sur cette base exacte ;
2. raccord de cette caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. UNE garde RED exigeant le helper pur et un consommateur unique dans `blocked(x)` ;
5. preuve RED isolée ;
6. micro-diff minimal dans `entry-v1.js`, `dungeon-authored-runtime-167839.js` et contrat Dungeon uniquement ;
7. conserver le garde dynamique et son ordre dans Authored Runtime ;
8. aucun changement `index.html` attendu ;
9. triple CI ;
10. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune modification de `index.html` n'est prévue.
Si le périmètre change et exige son contenu exact, arrêter le lot et appliquer Rule 26 avant toute modification.
