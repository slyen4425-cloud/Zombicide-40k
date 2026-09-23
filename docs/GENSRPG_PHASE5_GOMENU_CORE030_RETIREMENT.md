# GenSrpG — Phase 5 / retrait de l'autorité goMenu Core 0.30

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-core030-retirement-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core030-retirement-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-e2e-characterization-green-2026-09-23` ;
- SHA de base :
  `3bfa092908f233e2e518ef6a5dcdc6bb4cb5b946` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## TDD RED préalable

Sentinelle :
`tests/gens_phase5_gomenu_core030_retirement_v1.test.cjs`.

RED initial :
`35847094439`.

Échec volontaire :
`Exiger le retrait du propriétaire goMenu Core 0.30`.

Les E2E préalables `goMenu` étaient GREEN sur la base
`3bfa092908f233e2e518ef6a5dcdc6bb4cb5b946`.

## Runtime source vérifié

Fichier fourni selon la règle 26 de la charte :

- taille : `8171795` octets ;
- blob Git : `4f8c3b9be4189a9ac163fcb17531c95cbd783b05`.

Le fichier joint portait le nom `indexwork13.txt` dans le ZIP, mais ses octets
correspondaient exactement au `index.html` attendu.

## Modification soustractive

Commit runtime :
`36e53acd03fd8810a86028a24b23447103dd3ba1`.

Une seule autorité runtime a été retirée dans
`dungeonCore030HeroReturnFix` :

- capture `const prevGo=window.goMenu` ;
- affectation `window.goMenu=function(){...}`.

Toutes les autres responsabilités du bloc Core 0.30 restent intactes.

Diff runtime :
- 21 lignes supprimées ;
- 716 octets supprimés ;
- aucune ligne ajoutée.

Nouvelle empreinte :
- taille : `8171079` octets ;
- blob Git : `6a9392e667881f2087e4df931645cada4201cb3c`.

Chaîne `goMenu` obtenue :

1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore023StabilityFix`
4. `dungeonCore200Rebuild`

## Réalignement dérivé

Commit :
`1e514d694ae14243ef636fee399d1c04ea2329a7`.

Réalisé uniquement pour les dérivés du runtime :
- empreintes exactes taille/blob dans les sentinelles historiques ;
- source blob des cartographies Phase 2 ;
- table des derniers propriétaires :
  `goMenu 5 -> 4` ;
- total des affectations inline :
  `768 -> 767` ;
- pré-audit `goMenu` réaligné pour caractériser les quatre propriétaires restants.

Invariants inchangés :
- 438 globals inline distincts ;
- 121 globals multi-propriétaires ;
- 120 blocs inline actifs ;
- cartographie stockage inchangée hors source blob ;
- cartographie timers inchangée hors source blob.

## Hors périmètre respecté

Aucune modification de :
- `captureFix139` ;
- `gensDungeonCore01Js` ;
- `dungeonCore023StabilityFix` ;
- `dungeonCore200Rebuild` ;
- `resumeGame` ;
- `startConfiguredGame` ;
- gameplay Capture/Dungeon ;
- Tactical ;
- Builder ;
- Storage ;
- détection ennemie ;
- embuscade.

Aucun wrapper, observer, timer/retry ou mécanisme de compatibilité n'a été ajouté.

## Validation finale GREEN

SHA runtime/documentation validé :
`32d2c00200bf148e2c764166a3c07e4ae05bc919`.

Triple CI complète :
- Architecture + navigateur complet `35848721773` — SUCCESS ;
- Firefox `35848721942` — SUCCESS ;
- Tactical Dock `35848721777` — SUCCESS.

Scénarios explicitement couverts par le navigateur complet :
- Dungeon fiche héros -> `goMenu` -> map Dungeon — GREEN ;
- Capture active + vieille sauvegarde Dungeon -> `goMenu` -> Hub Capture — GREEN ;
- Survie fiche héros -> `goMenu` -> menu Survie — GREEN ;
- Save & Quit / reprise Dungeon — GREEN ;
- Dungeon map -> Tactical — GREEN ;
- Builder — GREEN ;
- non-interférence quatre modules — GREEN.

Checkpoint GREEN final :
`checkpoint/gensrpg-phase5-gomenu-core030-retirement-green-2026-09-23`
sur le SHA exact
`32d2c00200bf148e2c764166a3c07e4ae05bc919`.

Le runtime reste :
- taille `8171079` octets ;
- blob Git `6a9392e667881f2087e4df931645cada4201cb3c`.

Aucun merge sur `main`.
