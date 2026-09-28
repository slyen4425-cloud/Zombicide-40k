# GenSrpG — Phase 7 / Dungeon movement — autorité du mouvement héros authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-entry-movement-green-2026-09-28`

SHA exact de base :
`c6553ce1a381c356515c4791eab327c0bc16db35`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-hero-move-allowance-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-hero-move-allowance-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Runtime de base :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Le micro-lot 7 a isolé la décision `remaining-versus-fallback` de `movementForEntry(x, hero)`.

Le seam suivant reste volontairement plus petit que `heroMoveAllowance(id)` complet :
la décision portant sur le premier candidat fourni par
`ROOT.dungeonHeroMoveValue083?.(id)`.

Comportement historique exact :

`Math.max(0, Number(primary) || Number(CHARS movement) || 3)`

dans un `try/catch` qui retourne `3` en cas d'exception.

## Cible stricte du micro-lot 8

Isoler uniquement la décision pure sur le candidat principal :

API cible proposée :
`GensDungeonV1.movement.planAuthoredHeroMoveAllowance(primaryValue)`

Contrat cible :
- si `Number(primaryValue)` est truthy -> `{status:"primary", movement:Math.max(0, Number(primaryValue))}` ;
- sinon -> `{status:"fallback", movement:null}`.

Le planner ne lit ni `CHARS`, ni `dungeonHeroMoveValue083`, ni le runtime spatial.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839
Reste propriétaire de :
- l'appel à `ROOT.dungeonHeroMoveValue083?.(id)` ;
- la lecture fallback `ROOT.CHARS?.[id]?.dungeonStats?.movement` ;
- la valeur par défaut `3` ;
- le `try/catch` historique ;
- `heroMoveAllowance(id)` comme consommateur/raccord ;
- `movementForEntry(x, hero)` ;
- `enterNode(...)`, positions, remaining et authored travel.

### DungeonSpatial313
Reste entièrement propriétaire de :
- `ensure` ;
- `persist` ;
- `setRoom` ;
- `activate` ;
- snapshots spatiaux.

## Invariants de parité

- primary `4` -> 4, sans lecture CHARS ;
- primary `-2` -> 0, sans lecture CHARS ;
- primary `"4"` -> 4, sans lecture CHARS ;
- primary `0` -> fallback CHARS ;
- primary `"0"` -> fallback CHARS ;
- primary `undefined` -> fallback CHARS ;
- primary `null` -> fallback CHARS ;
- primary `NaN` -> fallback CHARS ;
- fallback CHARS `9` -> 9 ;
- fallback CHARS `-2` -> 0 ;
- fallback CHARS `0` / absent -> 3 ;
- exception de `dungeonHeroMoveValue083` -> 3 directement, sans nouvelle logique ;
- aucun accès `DungeonSpatial313` dans le planner.

## Hors périmètre absolu

Ne pas toucher :
- déplacement réel de case en case ;
- pathfinding ;
- consommation du mouvement ;
- positions ;
- `remaining` hors du raccord existant ;
- `DungeonSpatial313` ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- LOS / ennemis ;
- Tactical / combat ;
- authored action fix / return persist ;
- generated movement ;
- Survival / Capture / PvP ;
- assets.

## TDD obligatoire

1. caractérisation GREEN du `heroMoveAllowance` historique ;
2. raccord de cette caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. UNE garde RED exigeant le planner pur et son consommateur unique ;
5. preuve RED isolée ;
6. micro-diff minimal ;
7. aucun changement `index.html` attendu ;
8. triple CI ;
9. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucune modification de `index.html` n'est prévue dans ce micro-lot.
Si ce périmètre change, Rule 26 s'applique avant toute modification du runtime inline.
