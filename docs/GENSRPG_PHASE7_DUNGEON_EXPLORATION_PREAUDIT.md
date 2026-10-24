# GenSrpG — Phase 7 / Dungeon exploration — pré-audit d'entrée — 2026-09-26

## Base sûre

- checkpoint GREEN Phase 6 :
  `checkpoint/gensrpg-phase6-complete-green-2026-09-26`
- SHA exact :
  `4a39617cd1b25f5a52d587e9fa19dd25976a3d3e`
- checkpoint de départ Phase 7 :
  `checkpoint/gensrpg-start-phase7-dungeon-exploration-2026-09-26`
- branche :
  `work/gensrpg-phase7-dungeon-exploration-2026-09-26`
- production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

CI Phase 6 finale :
- Architecture + Browser `36239664419` — SUCCESS ;
- Firefox `36239664454` — SUCCESS ;
- Tactical Dock `36239664435` — SUCCESS.

## Objectif Phase 7

Selon la roadmap :
- exploration ;
- salles / branches ;
- déplacement ;
- événements / spawn ;
- portes / coffres / pièges / énigmes ;
- déclenchement de combat ;
- sauvegarde d'état Dungeon ;
doivent devenir explicitement propriétaires Dungeon.

Dungeon décide quand Tactical démarre.
Tactical ne doit pas posséder l'exploration.

Critère de sortie :
**exploration complète sans dépendance UI Tactical globale.**

## État du module cible

`assets/gensrpg/dungeon/entry-v1.js` est encore l'entrée inerte Phase 3 :
- aucun runtime ;
- aucun DOM ;
- aucun stockage ;
- aucune installation.

`assets/gensrpg/dungeon/module-contract-v1.json` annonce déjà comme responsabilités :
- Dungeon world state ;
- exploration ;
- movement ;
- events ;
- combat trigger ;
- Dungeon persistence state.

Il interdit :
- Tactical combat resolution ;
- Capture runtime ;
- Survival runtime ;
- PvP runtime.

Le présent chantier doit rendre ce contrat réel progressivement, sans big-bang.

## Cartographie externe initiale de l'exploration

### DungeonRoomRuntime167822
- enveloppe `DungeonCore01.explore` ;
- applique éventuellement une géométrie Room Creator après l'exploration legacy ;
- conserve le pipeline encounter/combat/spawn existant ;
- possède encore des réinstallations après clic / timeout.

### DungeonWorldRuntime167823
- enveloppe `DungeonCore01.explore` ;
- possède `travel()`, `targetPlan()`, `directFixedNode()` ;
- enveloppe `DungeonCore01.render` ;
- maintient un ancien runtime World Builder ;
- réinstalle encore par timeouts 0/50/250/1000 ms.

### DungeonAuthoredRuntime167839
- possède `travel()`, `enterNode()`, `plan()`, `resetForWorld()` ;
- enveloppe `DungeonCore01.explore`, `render`, `show`, `start` ;
- marque le wrapper final avec les anciens marqueurs `__drr167822`, `__dlr167835`, `__dwr167823` ;
- désactive explicitement `DungeonWorldRuntime167823` lorsqu'un monde construit est actif ;
- route alors l'exploration vers son propre `travel()`.

### DungeonWorldSessionBridge167832
- sélectionne adventure générée ou world construit ;
- neutralise le générateur aléatoire pour un world construit ;
- désactive le legacy World Runtime ;
- enveloppe `startConfiguredGame` ;
- route un world construit vers `DungeonAuthoredRuntime167839.startConfigured()`.

### Couches adjacentes à protéger

`DungeonAuthoredReturnPersist167862` :
- enveloppe `DungeonAuthoredRuntime167839.enterNode` ;
- persiste la position spatiale finale.

`DungeonAuthoredActionFix167857` :
- enveloppe `DungeonSpatial313.persist` ;
- resynchronise les actions après mouvement ;
- intercepte encore certains clics legacy de coffre.

`DungeonAuthoredEventCells167877` :
- enveloppe `DungeonCore01.render/show` ;
- déclenche les cases événements authored ;
- contient encore des listeners capture et des refresh différés ;
- reste hors du premier micro-lot.

## Première question d'architecture

Quel propriétaire doit devenir l'entrée unique de l'exploration Dungeon pour :
1. adventure générée ;
2. world construit ;
sans dupliquer la logique et sans laisser des wrappers concurrents ?

Aucune réponse n'est présumée avant tests.

## Périmètre du premier micro-lot

Seulement :
**chaîne d'autorité `DungeonCore01.explore -> travel / entrée de zone`.**

Ne pas toucher :
- déplacement dans la grille ;
- portée / movement allowance ;
- événements/spawn ;
- coffres/pièges/énigmes ;
- branches ;
- combat ;
- Tactical ;
- sauvegarde détaillée ;
- Builder ;
- progression ;
- UI héros ;
- assets.

## Invariants à protéger

- generated adventure fonctionne comme avant ;
- authored world fonctionne comme avant ;
- entrée de salle conserve position/mouvement ;
- retour dans une salle conserve état ;
- contenu exact authored reste appliqué ;
- aucune génération aléatoire parasite dans authored world ;
- aucune bataille Tactical créée tant qu'aucun combat n'est déclenché ;
- Tactical ne décide jamais d'un déplacement/explore Dungeon ;
- Save & Quit / reprise ne régresse pas ;
- Builder reste accessible.

## TDD obligatoire

1. caractérisation statique externe de la chaîne actuelle ;
2. caractérisation navigateur generated adventure ;
3. caractérisation navigateur authored world ;
4. identifier le propriétaire final réel de `DungeonCore01.explore` ;
5. écrire ensuite une sentinelle RED pour UNE seule frontière à retirer ou déplacer ;
6. seulement après RED isolé, effectuer un raccord minimal ;
7. triple CI ;
8. preview + validation utilisateur si comportement visible ;
9. checkpoint GREEN du micro-lot.

## Rule 26

Le présent pré-audit peut avancer sans lire le gros `index.html`.

Dès qu'il devient nécessaire de :
- inspecter la définition native exacte de `DungeonCore01.explore` ;
- comparer ses wrappers inline ;
- modifier ce propriétaire dans `index.html` ;

alors appliquer immédiatement Rule 26 sur le HEAD Phase 7 courant :
- résoudre SHA ;
- vérifier blob + taille de `index.html` ;
- fournir le permalink exact à Sylvain ;
- demander le fichier exact ZIP ;
- vérifier sa correspondance avant toute inspection/modification.

Aucune ancienne copie de `index.html` ne doit être réutilisée sans vérification.
