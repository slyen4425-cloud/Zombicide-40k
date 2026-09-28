# GenSrpG — Phase 7 / Dungeon movement — normalisation du mouvement authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-entry-movement-green-2026-09-28`

SHA exact de base :
`c6553ce1a381c356515c4791eab327c0bc16db35`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-move-allowance-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-move-allowance-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36441524650` — SUCCESS ;
- Firefox : `36441524372` — SUCCESS ;
- Tactical Dock : `36441524344` — SUCCESS.

Runtime `index.html` de base :
- `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Le micro-lot 7 a extrait :
`GensDungeonV1.movement.planAuthoredEntryMovement(remainingValue)`

Il décide uniquement :
- conserver un mouvement restant numérique, borné à zéro ;
- ou demander un fallback authored.

Le fallback reste aujourd'hui propriétaire de :
`DungeonAuthoredRuntime167839.heroMoveAllowance(id)`.

Implémentation historique à préserver :
`Math.max(0, Number(ROOT.dungeonHeroMoveValue083?.(id)) || Number(ROOT.CHARS?.[id]?.dungeonStats?.movement) || 3)`
dans un `try/catch` dont l'erreur retourne `3`.

## Cible stricte du micro-lot 8

Isoler uniquement la normalisation pure des deux valeurs déjà lues par l'Authored Runtime.

API cible proposée après caractérisation GREEN :
`GensDungeonV1.movement.resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)`

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
- les chaînes numériques suivent `Number(...)` ;
- `Infinity` reste `Infinity` comme dans l'historique ;
- une exception lors des lectures globales reste gérée par le `try/catch` authored et retourne `3`.

## Hors périmètre absolu

Ne pas déplacer/modifier :
- `movementForEntry(x, hero)` ;
- `planAuthoredEntryMovement(...)` ;
- propriété des lectures `dungeonHeroMoveValue083` / `CHARS` ;
- `DungeonSpatial313` ;
- positions ;
- remaining writes ;
- déplacement réel / consommation par case ;
- pathfinding ;
- arrivée / cellule d'entrée ;
- authored travel / graph ;
- événements / spawn ;
- coffres / pièges / interactions ;
- Tactical / combat ;
- Survie / Capture / PvP ;
- `index.html`.

## Invariants

- helper pur sans DOM, storage, timer, listener, observer, spatial ou Tactical ;
- aucune lecture de `ROOT` ou `CHARS` dans le helper pur ;
- `DungeonAuthoredRuntime167839.heroMoveAllowance(id)` reste le seul lecteur des valeurs runtime/stat ;
- le `try/catch` historique reste Authored Runtime ;
- `movementForEntry` conserve son fallback lazy ;
- `DungeonSpatial313` reste downstream et inchangé ;
- aucun wrapper, retry, polling ou observer ajouté.

## Rule 26

Ce micro-lot ne prévoit aucune modification de `index.html`.
Le fingerprint de base reste :
- `8169990` octets ;
- blob `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Si une modification exacte de `index.html` devenait nécessaire, le lot doit s'arrêter et Rule 26 s'applique avant tout changement.

## TDD obligatoire

1. caractérisation GREEN de `heroMoveAllowance(id)` et de ses cas limites ;
2. raccord de la caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. ajout d'UNE garde RED exigeant l'API pure et son consommateur unique ;
5. preuve RED isolée ;
6. micro-diff minimal dans `entry-v1.js` et `dungeon-authored-runtime-167839.js` uniquement ;
7. mise à jour minimale du contrat Dungeon ;
8. triple CI ;
9. aucun test utilisateur si le comportement reste strictement identique ;
10. fermeture documentaire + checkpoint GREEN.

## RED isolé — prouvé

SHA RED :
`0e34b070fae984e83cfb294d65b2ca03e9488a24`.

CI :
- Architecture : `36445516538` — FAILURE attendue ;
- nouvelle garde rouge unique : `#196 — Exiger la normalisation Dungeon du mouvement authored Phase 7` ;
- erreur : `Phase 7 micro-lot 8 requires Dungeon-owned authored hero move-allowance normalization` ;
- Browser : SKIPPED uniquement parce qu'Architecture est rouge ;
- Firefox : `36445516297` — SUCCESS ;
- Tactical Dock : `36445516491` — contract / Firefox / Chromium SUCCESS.

La caractérisation #195 reste GREEN.
Aucun runtime `index.html` n'a été modifié.

## Micro-diff autorisé après RED

Fichiers uniquement :
- `assets/gensrpg/dungeon/entry-v1.js` ;
- `assets/dungeon/dungeon-authored-runtime-167839.js` ;
- `assets/gensrpg/dungeon/module-contract-v1.json`.

Changement autorisé :
1. ajouter le helper pur `resolveAuthoredHeroMoveAllowance(runtimeMovementValue, statMovementValue)` ;
2. exposer ce helper sous `GensDungeonV1.movement` ;
3. faire déléguer `heroMoveAllowance(id)` à ce helper avec les deux lectures explicites ;
4. conserver le `try/catch` et son fallback `3` dans Authored Runtime ;
5. documenter la propriété pure dans le contrat Dungeon.

Tout le reste reste hors périmètre.

