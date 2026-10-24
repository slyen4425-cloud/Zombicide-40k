# GenSrpG — Phase 4 / U1 Text Utils — raccord Room Creator

Date : 2026-09-22

## Périmètre

Raccord minimal du consommateur :

`assets/dungeon/dungeon-room-creator-100.js`

vers le service Core pur :

`assets/gensrpg/core/text-utils-v1.js`.

Ce lot ne modifie aucun gameplay Dungeon, aucun combat, aucun stockage métier,
aucun Stats/Dice/Progression/Inventory, aucun Tactical et aucun World Builder.

## Base et branche

- base GREEN :
  `6be892c9ef7bd93702bab9b21a93eb31366adfd9` ;
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-text-utils-u1-room-creator-raccord-2026-09-22` ;
- branche :
  `work/gensrpg-phase4-text-utils-u1-room-creator-raccord-2026-09-22` ;
- production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## TDD

La sentinelle dédiée a d'abord été ajoutée en RED.

RED prouvé sur :
`ce607a0ecbb512b1d102089dd5064ba298182543`.

Cause attendue :
- U1 non chargé dans la composition ;
- helper local `esc(v)` encore présent dans Room Creator.

Aucun défaut gameplay n'a été corrigé dans ce RED.

## Raccord réalisé

1. `DungeonRoomCreator100` exige maintenant explicitement
   `GensTextUtilsV1`.
2. Le helper local `function esc(v)` a été retiré.
3. `escapeHtml` du Core devient l'unique implémentation utilisée par ce
   consommateur.
4. Pages charge U1 avant Room Creator.
5. `preview.html` charge U1 avant Room Creator.
6. Le PWA précache U1 avec les dépendances Room Creator.
7. Les harness VM historiques Room Creator 1.0/V2 chargent la vraie dépendance
   U1 avant le module.
8. La cartographie Phase 2 reclasse U1 de inert -> connected.
9. Le manifeste propriétaire contient désormais
   `GenSrpG Core Text Utils`.

## Cartographie

Conséquences attendues et validées :
- modules injectés Pages : 29 -> 30 ;
- fichiers JS production-reachable : 78 -> 79 ;
- fichiers directs production : 34 -> 35 ;
- U1 quitte `phase4InertServices` et rejoint
  `phase4ConnectedServices` ;
- aucune nouvelle source timer ;
- aucun nouvel accès stockage ;
- aucun nouvel observer ;
- aucun wrapper/monkey-patch ajouté.

`index.html` source reste inchangé.

## Réalignements de sentinelles

Les RED rencontrés après le raccord étaient uniquement des attentes de
cartographie/composition devenues obsolètes :
- graphe runtime 78 -> 79 ;
- manifest propriétaire 78 -> 79 ;
- inventaire effets globaux 78 -> 79 ;
- inventaire stockage 78 -> 79 ;
- classification timers : 78 -> 79 fichiers externes atteignables ;
- structure Phase 3 : owner graph 78 -> 79 ;
- caractérisation Capture Pages : 29 -> 30 modules ;
- Preview navigateur : 29 -> 30 scripts.

Ces réalignements ne modifient pas les comportements testés.

## Validation technique GREEN avant clôture documentaire

SHA technique :
`b9679a42d6481407648e6b9144c2e789ae9fe218`.

CI :
- Architecture + navigateur complet :
  run `35766655446` — SUCCESS ;
- Firefox :
  run `35766655432` — SUCCESS ;
- Tactical Dock :
  run `35766655458` — SUCCESS.

Scénarios navigateur confirmés GREEN notamment :
- Survie ;
- Fouiller + arts ;
- Dungeon après Survie ;
- vrai Dungeon Builder ;
- configuration objet moderne ;
- fiche RPG sans flash Survie ;
- cache / retour / pièges authored ;
- Save & Quit + reprise ;
- PvP placeholder ;
- Monster Capture ;
- composition Capture complète ;
- non-interférence des quatre modules ;
- murs Tactical ;
- preview manuelle ;
- assets Phase 4 ;
- wrappers Equipment.

## Conclusion du point 7 Phase 4

Le pré-audit Event Bus/utilitaires avait conclu :
- ne pas créer de Event Bus générique ;
- extraire uniquement un utilitaire commun sûr.

U1 `escapeHtml()` est maintenant :
- créé ;
- testé ;
- raccordé à son premier vrai consommateur ;
- propriétaire unique de cette responsabilité pour Room Creator.

Ce lot termine le micro-lot U1 prévu par la décision du pré-audit
Event Bus/utilitaires.

## Validation finale obligatoire

La présente clôture documentaire change le SHA.

Avant création du checkpoint GREEN final, le même SHA documentaire doit repasser :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.

Aucun merge sur `main`.
