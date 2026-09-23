# GenSrpG — Phase 5 / retrait de l'autorité goMenu Core 0.23

Date : 2026-09-23

## Base

- branche :
  `work/gensrpg-phase5-gomenu-core023-retirement-2026-09-23` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-gomenu-core023-retirement-2026-09-23` ;
- base GREEN :
  `checkpoint/gensrpg-phase5-gomenu-core023-e2e-characterization-green-2026-09-23` ;
- SHA de base :
  `d5e15691f4784ee1aef24c72aadbc8424054f73c` ;
- production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## TDD RED préalable

Sentinelle :
`tests/gens_phase5_gomenu_core023_retirement_v1.test.cjs`.

Commits :
- test : `fe71e22c611b95d8f6ba1fb7fb416220c8a966f0` ;
- branchement CI : `30feb32c101ce6b63550f329fa018d10a73fed80`.

Run RED :
`35866725675`.

Échec volontaire exact :
`Core 0.23 goMenu retirement target requires the three-owner chain`.

Chaîne observée avant retrait :
1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore023StabilityFix`
4. `dungeonCore200Rebuild`

Chaîne exigée :
1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore200Rebuild`

Tous les contrôles précédant cette étape étaient GREEN.

## Règle 26 / source exacte

Runtime de départ certifié :
- taille : `8171571` octets ;
- blob Git :
  `6e76a99af5fb839db5ffb20a2e67fd1572bf13ea`.

La copie locale et le blob Git ont été vérifiés avant modification.
Les commits TDD ne modifiaient pas `index.html`.

## Modification runtime soustractive

Commit fonctionnel :
`f6d9ecf912d3a0b618019d50b4e006af5062eaed`.

Retrait UNIQUE dans `dungeonCore023StabilityFix` :
- `const oldGo023=window.goMenu` ;
- l'affectation `window.goMenu=function(){...}` associée.

Diff runtime :
- 6 lignes supprimées ;
- 0 ligne ajoutée ;
- 385 octets supprimés.

Nouvelle empreinte runtime :
- taille : `8171186` octets ;
- blob Git :
  `c2424bada56517e579ffe65fa147facbb6bf2caf`.

Responsabilités Core 0.23 explicitement conservées :
- garde / wrapper `DungeonCore01.openHero` ;
- nettoyage `specialDiceModal` attaché à l'entrée fiche ;
- gardes combat ;
- responsabilités IA / loot restantes.

Aucun wrapper de remplacement, observer, timer, retry ou fallback n'a été ajouté.

## Réalignement dérivé

Commit :
`c73b6699ae6b4cd5ffe75cd31b2d095162036270`.

Modifications descriptives uniquement :
- empreintes taille/blob dans les sentinelles historiques ;
- `sourceIndexBlob` des cartographies Phase 2 ;
- total des affectations inline :
  `767 -> 766` ;
- ligne `goMenu` :
  `4 -> 3` propriétaires ;
- pré-audit global `goMenu` réaligné vers la chaîne restante.

Invariants :
- 438 globals inline distincts ;
- 121 globals multi-propriétaires ;
- 120 blocs inline actifs ;
- le bloc `dungeonCore023StabilityFix` reste cartographié et actif ;
- aucun runtime modifié par le réalignement.

Les workflows one-shot utilisés uniquement pour appliquer le gros fichier et
réaligner ses dérivés ont été supprimés de la branche.

## Chaîne goMenu candidate finale

1. `captureFix139`
2. `gensDungeonCore01Js`
3. `dungeonCore200Rebuild`

## Hors périmètre respecté

Aucune modification de :
- logique Capture ;
- Core 2.00 ;
- `resumeGame` ;
- `startConfiguredGame` ;
- Tactical ;
- Builder ;
- Storage ;
- Stats ;
- détection ennemie intermittente ;
- petits défauts de rafraîchissement UI ;
- embuscade.

Aucun merge sur `main`.

## Validation finale requise

Le commit documentaire qui accompagne ce candidat doit passer, sur le même SHA :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Le checkpoint GREEN final ne sera créé qu'après ces trois SUCCESS.
