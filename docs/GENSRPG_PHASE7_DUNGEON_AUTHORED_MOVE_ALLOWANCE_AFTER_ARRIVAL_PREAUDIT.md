# GenSrpG — Phase 7 / Dungeon movement — normalisation du mouvement authored après case d’arrivée — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-arrival-cell-green-2026-09-28`

SHA exact de base :
`0740afef16264744e02fff74246bbb8494f05bdd`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-move-allowance-after-arrival-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-move-allowance-after-arrival-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36450655832` — SUCCESS ;
- Firefox : `36450655752` — SUCCESS ;
- Tactical Dock : `36450655574` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Le micro-lot 7 a extrait :
`GensDungeonV1.movement.planAuthoredEntryMovement(remainingValue)`.

Le micro-lot suivant a extrait la décision pure de case d’arrivée authored :
`GensDungeonV1.movement.planAuthoredArrivalCell(mapCellCount, edgeEntryIndex, mapEntryIndex)`.

Le prochain seam mouvement reste volontairement étroit :
`DungeonAuthoredRuntime167839.heroMoveAllowance(id)`.

Implémentation historique à préserver :
`Math.max(0, Number(ROOT.dungeonHeroMoveValue083?.(id)) || Number(ROOT.CHARS?.[id]?.dungeonStats?.movement) || 3)`
dans un `try/catch` dont l'erreur retourne `3`.

## Décision de coordination

Des branches parallèles antérieures existent :
- `work/gensrpg-phase7-dungeon-authored-hero-move-allowance-2026-09-28` ;
- `work/gensrpg-phase7-dungeon-authored-move-allowance-2026-09-28` ;
- `work/gensrpg-phase7-dungeon-entry-movement-allowance-2026-09-28`.

Elles partent toutes d’un état antérieur au GREEN de la case d’arrivée.
Elles ne sont donc pas utilisées comme base Git du présent lot.

Leurs caractérisations peuvent être consultées comme preuves historiques, mais toute modification du présent lot doit repartir du checkpoint GREEN exact `0740afef...`.

## Cible stricte du micro-lot suivant

Isoler uniquement la normalisation pure des deux valeurs déjà lues par l’Authored Runtime.

API candidate après caractérisation GREEN :
`GensDungeonV1.movement.resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)`.

Responsabilité unique :
retourner exactement :
`Math.max(0, Number(runtimeMovementValue) || Number(statMovementValue) || 3)`.

Les lectures restent dans `DungeonAuthoredRuntime167839.heroMoveAllowance(id)`.

## Parité historique à préserver

- valeur runtime positive : prioritaire ;
- valeur runtime numérique négative : prioritaire puis clamp à `0` ;
- valeur runtime `0`, `null`, `undefined`, chaîne vide ou non numérique : fallback vers la stat ;
- stat positive : utilisée si le runtime ne fournit pas une valeur truthy numérique ;
- stat négative : clamp à `0` ;
- stat `0` ou invalide : fallback historique `3` ;
- chaînes numériques : conversion `Number(...)` historique ;
- `Infinity` reste `Infinity` comme historiquement ;
- exception lors des lectures globales : le `try/catch` authored retourne `3`.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839
Reste propriétaire de :
- l’appel `ROOT.dungeonHeroMoveValue083?.(id)` ;
- la lecture `ROOT.CHARS?.[id]?.dungeonStats?.movement` ;
- le `try/catch` historique ;
- `heroMoveAllowance(id)` comme consommateur/raccord ;
- `movementForEntry(x, hero)` ;
- `arrival(map, edge)` comme consommateur du planner d’arrivée déjà extrait ;
- `enterNode(...)`, positions, remaining et authored travel.

### DungeonSpatial313
Reste entièrement propriétaire de :
- `ensure` ;
- `persist` ;
- `setRoom` ;
- `activate` ;
- snapshots spatiaux.

## Hors périmètre absolu

Ne pas toucher :
- déplacement réel de case en case ;
- pathfinding ;
- consommation du mouvement ;
- positions ;
- `remaining` hors du raccord existant ;
- case d’arrivée déjà extraite ;
- `DungeonSpatial313` ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- LOS / ennemis ;
- Tactical / combat ;
- authored action fix / return persist ;
- generated movement ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de `heroMoveAllowance(id)` et de ses cas limites sur cette base exacte ;
2. raccord de cette caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. UNE garde RED exigeant l’API pure et son consommateur unique ;
5. preuve RED isolée ;
6. micro-diff minimal ;
7. aucun changement `index.html` attendu ;
8. triple CI ;
9. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune modification de `index.html` n’est prévue.
Le fingerprint de base reste :
- `8169990` octets ;
- blob `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Si le périmètre change et exige `index.html`, arrêter le lot et appliquer Rule 26 avant toute modification.
