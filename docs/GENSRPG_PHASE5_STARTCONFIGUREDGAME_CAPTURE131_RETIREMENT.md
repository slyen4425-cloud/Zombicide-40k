# GenSrpG — Phase 5 / startConfiguredGame — retrait du wrapper captureFix131

Date : 2026-09-22

## Base

- branche :
  `work/gensrpg-phase5-startconfiguredgame-capture131-retirement-2026-09-22` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-startconfiguredgame-capture131-retirement-2026-09-22` ;
- base exacte :
  `fbab85b75a1eb304eb4b081f36549b66f45eec58` ;
- dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase5-startconfiguredgame-authority-preaudit-green-2026-09-22` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission

Retirer uniquement l'affectation `window.startConfiguredGame` du bloc
`captureFix131`, caractérisée comme wrapper strictement transitif.

Le bloc `captureFix131` reste présent.
Aucune autre logique Capture n'est retirée.

## TDD

Sentinelle dédiée :

`tests/gens_phase5_startconfiguredgame_capture131_retirement_v1.test.cjs`.

Contrat cible :
- chaîne `startConfiguredGame` : 6 -> 5 affectations ;
- `captureFix131` ne doit plus affecter `startConfiguredGame` ;
- propriétaires conservés :
  - `captureFix135` ;
  - `captureFix138` ;
  - `captureFix139` ;
  - `gensDungeonCore01Js` ;
  - `dungeonCore200Rebuild` ;
- dernier propriétaire inchangé :
  `dungeonCore200Rebuild`.

## Modification runtime

Une seule modification métier/runtime volontaire :

- retrait du wrapper transitif `captureFix131 -> startConfiguredGame`.

La fonction supprimée ne contenait :
- aucun test de contexte ;
- aucune règle Capture ;
- aucune règle Dungeon ;
- aucune mutation de session ;
- aucun effet DOM ;
- aucun timer ;
- aucun observer ;
- aucune logique de gameplay.

Elle déléguait uniquement au propriétaire précédent avec `this` et
`arguments`.

Conséquence source :
- `index.html` : -166 octets ;
- taille vérifiée : `8174148` octets ;
- blob Git : `f13835a2827dbfa9e2698cb026d3e732ad62aba4`.

## Réalignement des cartographies

La chaîne active devient :

`captureFix135 -> captureFix138 -> captureFix139 -> gensDungeonCore01Js -> dungeonCore200Rebuild`.

Les manifestes/cartographies Phase 2 ont été réalignés avec ce runtime :
- inline global last owners ;
- inline owners ;
- layered responsibilities ;
- storage owners ;
- timer classification ;
- tests de cartographie correspondants.

Le dernier propriétaire reste Dungeon Core 2.00.

## Réalignement des sentinelles historiques

Le retrait de 166 octets change le blob/taille de `index.html`.

Plusieurs sentinelles Phase 4 vérifiaient volontairement l'empreinte exacte de
l'ancien index. Elles ont été réalignées uniquement sur :
- nouvelle taille ;
- nouveau blob.

Aucune règle métier, formule, stockage, Stats, Inventory, Dice ou Progression n'a
été modifiée lors de ces réalignements.

Domaines concernés :
- Storage ;
- Stats S7 ;
- Inventory/Equipment ;
- Dice ;
- Progression ;
- Asset Resolver.

## Validation technique GREEN avant clôture documentaire

SHA technique :
`c71234cbf7e69ab9202a26796f2d220449b10bd0`.

CI :
- Architecture + navigateur complet :
  run `35778341539` — SUCCESS ;
- Firefox :
  run `35778341492` — SUCCESS ;
- Tactical Dock :
  run `35778341723` — SUCCESS.

Le navigateur complet confirme notamment :
- Survie réelle ;
- Fouiller + arts ;
- Dungeon après Survie ;
- Dungeon Builder ;
- Config objet ;
- fiche RPG ;
- cache / retour / pièges authored ;
- Save & Quit / reprise ;
- PvP placeholder ;
- Monster Capture ;
- non-interférence quatre modules ;
- Preview ;
- assets Phase 4 ;
- wrappers Equipment.

## Conclusion

Micro-lot soustractif réussi :
- 1 wrapper transitif retiré ;
- 5 propriétaires actifs restants ;
- aucun changement de comportement attendu ;
- aucune fuite inter-module détectée ;
- aucun nouveau Shell runtime connecté ;
- aucun wrapper/observer/timer ajouté.

Le prochain lot Phase 5 doit repartir de ce checkpoint GREEN et ré-auditer la
chaîne restante avant tout nouveau retrait.

## Validation finale obligatoire

La présente clôture documentaire change le SHA.

Avant création du checkpoint GREEN final :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock

doivent repasser sur le même SHA documentaire final.

Aucun merge sur `main`.
