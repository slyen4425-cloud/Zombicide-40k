# GenSrpG — Phase 7 / micro-lot 5 — présence des branches generated — pré-audit — 2026-09-27

## Base GREEN obligatoire

Checkpoint de base :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27`

SHA exact :
`49289784ee92a47fd51089815ca25954cdba4493`

CI de ce SHA :
- Architecture + Browser : `36324103034` — SUCCESS ;
- Firefox : `36324103113` — SUCCESS ;
- Tactical Dock : `36324103013` — SUCCESS.

Checkpoint de départ du présent micro-lot :
`checkpoint/gensrpg-start-phase7-dungeon-generated-branch-presence-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-branch-presence-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Runtime hérité validé :
- `index.html` : `8170062` octets ;
- blob Git : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

## Position dans la Phase 7

Les micro-lots déjà GREEN ont isolé progressivement :
- plan d'avance generated ;
- pondération du type de salle generated ;
- descripteur création/restauration d'une salle generated ;
- pondération du type de branche generated.

Le présent lot reste strictement dans :
**Dungeon exploration / salles / branches**.

Il reste volontairement avant :
- déplacement case par case ;
- événements / spawn ;
- ennemis ;
- portes / coffres / pièges / énigmes ;
- déclenchement Tactical ;
- sauvegarde générale.

## Cible du micro-lot

Pré-auditer uniquement la décision de **présence / éligibilité probabiliste** d'une branche secondaire generated dans la chaîne historiquement portée par `maybeSpecialBranch(x)`.

Question unique :

> Le calcul `specialBranchChance + roll explicite` peut-il devenir une responsabilité pure de `GensDungeonV1.exploration`, sans déplacer le tirage RNG ni aucune mutation ?

Aucune API finale n'est figée avant caractérisation GREEN.

Forme candidate à prouver seulement après caractérisation :
`GensDungeonV1.exploration.shouldCreateGeneratedBranch(specialBranchChance, roll)`.

## Autorités existantes à protéger

- `GensDungeonV1.exploration.planGeneratedAdvance` ;
- `GensDungeonV1.exploration.pickWeightedGeneratedRoomKind` ;
- `GensDungeonV1.exploration.buildGeneratedRoomTransition` ;
- `GensDungeonV1.exploration.pickWeightedGeneratedBranchType` ;
- Core 2.00 pour le callsite et les mutations tant qu'aucune extraction n'est prouvée ;
- `DungeonSpatial313` ;
- `DungeonRoomRuntime167822` ;
- `DungeonSecondaryBranchContentFix167860` ;
- `DungeonAuthoredBranchNavCleanup167863`.

Les branches authored restent une chaîne distincte et ne doivent jamais consommer cette décision generated.

## Invariants à préserver

1. aucune branche nouvelle là où l'historique n'en créait pas ;
2. comparaison de frontière identique : le roll exactement au seuil reste rejeté ;
3. `specialBranchChance` conserve la coercition historique `Math.max(0, Number(value)||0)` ;
4. aucun RNG dans l'API pure candidate ;
5. le premier `Math.random()` reste au callsite historique ;
6. un rejet de présence stoppe avant `nearestFree(x)` ;
7. `nearestFree(x)` reste après le premier tirage et avant le second ;
8. le second `Math.random()` du type reste consommé seulement si une case libre existe ;
9. `pickWeightedGeneratedBranchType` reste propriétaire du type uniquement ;
10. `addDungeonSceneElement(...)` et `m.cells[i]='trapdoor'` restent au callsite ;
11. authored / Spatial / RoomRuntime / événements-spawn / ennemis / Tactical restent inchangés ;
12. aucun wrapper, observer, listener global, retry, polling, timer ou nouvelle globale.

## Hors périmètre absolu

Ne pas modifier :
- `nearestFree(x)` ;
- recherche/choix de cellule de branche ;
- matérialisation de la trapdoor ;
- labels treasure/boss/secret ;
- pondération des types déjà isolée ;
- contenu des branches ;
- branches authored ;
- spawn / événements / ennemis ;
- coffres / pièges / énigmes ;
- déplacement ;
- combat / Tactical ;
- Survie / Capture / PvP ;
- Builder ;
- assets ;
- persistance générale.

## Caractérisation déjà acquise à réutiliser

La caractérisation GREEN du micro-lot 4 prouve déjà :
- map absente : 0 RNG ;
- rejet de chance : 1 RNG, arrêt avant `nearestFree` ;
- roll exactement à la frontière : rejet ;
- absence de case libre : 1 RNG total ;
- branche acceptée + case libre : 2 RNG ;
- ordre accepté : config -> premier RNG -> nearestFree -> second RNG -> matérialisation ;
- authored séparé.

Le nouveau lot doit construire une caractérisation dédiée de la seule règle de présence et vérifier qu'elle reste cohérente avec ces preuves, sans élargir au type ou à la matérialisation.

## TDD obligatoire

1. caractériser GREEN la règle de présence actuelle et son ordre au callsite ;
2. inclure au minimum chances 0, 20, 100, valeurs négatives, numériques sous forme de chaîne et valeur invalide ;
3. verrouiller la frontière exacte du seuil ;
4. vérifier qu'un rejet n'appelle jamais `nearestFree` ni le sélecteur de type ;
5. seulement après GREEN, sélectionner l'API pure exacte ;
6. écrire UNE sentinelle RED isolée exigeant cette API ;
7. prouver que Firefox et Tactical restent GREEN et qu'une seule garde Architecture est RED ;
8. appliquer ensuite un micro-diff minimal ;
9. réaligner les fingerprints historiques un par un ;
10. Architecture + Browser, Firefox, Tactical Dock GREEN sur le même SHA ;
11. test utilisateur seulement si un comportement visible change ;
12. checkpoint GREEN avant le micro-lot suivant.

## Rule 26

Le pré-audit et la préparation des tests peuvent avancer à partir des contrats et caractérisations déjà versionnés.

En revanche, dès qu'il faut :
- inspecter de nouveau la ligne native exacte `maybeSpecialBranch(x)` dans le runtime courant ;
- modifier son callsite dans `index.html` ;
- confirmer une ancre exacte avant patch ;

appliquer Rule 26 sur le SHA courant du micro-lot.

À ce moment-là, demander à Sylvain le `index.html` exact du SHA requis via permalink, puis vérifier taille/blob avant toute inspection ou modification locale.

Aucune ancienne copie Rule 26 ne doit être réutilisée sans vérification.

## Prochaine action

Créer une caractérisation GREEN dédiée de la présence des branches generated en réutilisant les preuves versionnées du micro-lot 4, sans modifier le runtime.

## Caractérisation GREEN

SHA :
`b97347b6a52fe16a7a5e3a10835f3ef91720308b`

Test :
`tests/gens_phase7_dungeon_generated_branch_presence_characterization_v1.test.cjs`

CI :
- Architecture + Browser : `36325079612` — SUCCESS ;
- Firefox : `36325079673` — SUCCESS ;
- Tactical Dock : `36325079788` — SUCCESS.

Preuves verrouillées :
- map absente : aucun RNG ;
- chance 0 : rejet ;
- chance 20 : roll inférieur au seuil accepté, roll exactement au seuil rejeté ;
- chance 100 : les rolls normaux de `Math.random()` passent ;
- chance négative ou invalide : normalisée à 0 ;
- chaîne numérique : coercition `Number` conservée ;
- aucune borne haute historique : une chance > 100 reste possible ;
- ordre accepté inchangé : premier RNG de présence -> `nearestFree` -> second RNG de type -> matérialisation ;
- un rejet de présence stoppe avant `nearestFree` ;
- authored reste séparé.

API pure sélectionnée après preuve :
`GensDungeonV1.exploration.shouldCreateGeneratedBranch(specialBranchChance, roll)`.

Responsabilité unique :
retourner si le roll explicite passe la règle historique
`roll * 100 < Math.max(0, Number(chance)||0)`.

Le RNG lui-même reste au callsite Core 2.00.

## RED isolé — prouvé

SHA RED :
`78e50ddfe36a33895e3c403d6db551df624bf9ef`.

CI :
- Architecture : `36325840661` — FAILURE attendue ;
- Firefox : `36325840643` — SUCCESS ;
- Tactical Dock : `36325840624` — SUCCESS ;
- Browser : skipped après échec Architecture, conformément au workflow.

Une seule nouvelle garde est RED :
`#190 — Exiger la décision Dungeon de présence des branches generated Phase 7`.

Erreur attendue :
`Phase 7 micro-lot 5 requires Dungeon-owned generated branch presence decision`.

La garde précédente de pondération du type de branche passe juste avant, ce qui prouve que le micro-lot 4 reste GREEN.

## Rule 26 — prochaine étape obligatoire

Le diff entre la base GREEN `49289784...` et le RED `78e50dd...` ne touche pas `index.html`.
Le runtime reste donc :
- taille : `8170062` octets ;
- blob : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

Avant tout micro-diff runtime, demander le `index.html` exact du HEAD courant, vérifier taille/blob, puis seulement patcher le callsite.

