# GenSrpG — Phase 5 / Pré-audit retrait goMenu Core 0.30

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-core030-retirement-preaudit-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core030-retirement-preaudit-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-e2e-characterization-green-2026-09-23` ;
- SHA de base :
  `3bfa092908f233e2e518ef6a5dcdc6bb4cb5b946` ;
- runtime :
  index blob `4f8c3b9be4189a9ac163fcb17531c95cbd783b05` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

Aucun runtime n'est modifié dans ce pré-audit.

## Candidat

`dungeonCore030HeroReturnFix -> window.goMenu`.

## Propriétaire final

`dungeonCore200Rebuild` possède le dernier `window.goMenu`.

Sa condition d'interception est :

`active200 && isDungeonMode()`.

Dans ce cas, Core 2.00 retourne sans déléguer.

Il ne délègue vers Core 0.30 que lorsque cette condition est fausse.

## Condition Core 0.30

Core 0.30 intercepte seulement si :

`window.DungeonCore01.active && DungeonCore01.eligible()`.

Après installation de Core 2.00, le `DungeonCore01` public final est celui de
Core 2.00 :
- `DungeonCore01.active -> active200` ;
- `DungeonCore01.eligible() -> isDungeonMode()`.

La condition Core 0.30 est donc, dans la composition finale :

`active200 && isDungeonMode()`.

C'est exactement la condition qui empêche Core 2.00 de déléguer.

## Preuve par table de vérité

La sentinelle
`tests/gens_phase5_gomenu_core030_retirement_preaudit_v1.test.cjs`
teste les quatre combinaisons :

- `active200=false / dungeon=false` : Core 2.00 délègue, Core 0.30 faux ;
- `active200=false / dungeon=true` : Core 2.00 délègue, Core 0.30 faux ;
- `active200=true / dungeon=false` : Core 2.00 délègue, Core 0.30 faux ;
- `active200=true / dungeon=true` : Core 2.00 intercepte, Core 0.30 non appelé.

Il n'existe donc aucun état où :
- Core 2.00 délègue ;
- et Core 0.30 peut ensuite intercepter.

Résultat :
**le branchement goMenu de Core 0.30 est structurellement inatteignable dans la
composition runtime actuelle**.

## Différence avec le précédent incident captureFix135

La décision n'est pas fondée uniquement sur l'ordre des wrappers.

Elle est protégée par :
- une équivalence explicite des conditions ;
- une table de vérité ;
- des sentinelles E2E réelles déjà GREEN :
  - Dungeon fiche -> goMenu -> map ;
  - Capture + vieille sauvegarde Dungeon -> goMenu -> Hub ;
  - Survie fiche -> goMenu -> menu ;
  - non-interférence quatre modules.

## Décision

Le prochain lot peut sélectionner un retrait TDD strictement soustractif :

- retirer uniquement l'affectation `window.goMenu` de
  `dungeonCore030HeroReturnFix` ;
- conserver toutes les autres responsabilités du bloc Core 0.30 ;
- aucune migration de logique n'est nécessaire puisque la branche prouvée
  n'est plus exécutable ;
- aucun wrapper de compatibilité.

## TDD du futur lot

Avant retrait :
- sentinelle RED exigeant 4 affectations `goMenu` ;
- chaîne attendue après retrait :
  `captureFix139 -> gensDungeonCore01Js -> dungeonCore023StabilityFix ->
  dungeonCore200Rebuild`.

Après retrait :
- nouvelles sentinelles goMenu E2E ;
- Dungeon map/Tactical ;
- Capture victoire/reprise ;
- Save & Quit/reprise Dungeon ;
- Builder ;
- Survie ;
- non-interférence quatre modules ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

## Dettes hors périmètre

- détection ennemie immédiate hors embuscade : différée ;
- embuscade proche des héros : automatique GREEN, validation manuelle non
  acquise.

Aucun merge sur `main`.
