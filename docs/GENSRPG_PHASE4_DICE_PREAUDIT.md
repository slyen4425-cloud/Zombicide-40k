# GenSrpG — Phase 4 Core Dice — pré-audit

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-dice-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-preaudit-2026-09-22`.
- Base exacte :
  `669a8b2ef1caeba2d75a97000b4716877e9e5fc9`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-wrapper-retry-scope-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'est modifié dans ce pré-audit.

## Vérification du gros index fourni

Le zip fourni contient `index_work9.txt`, qui est en réalité le HTML complet.

- taille brute : 8 174 580 octets ;
- blob Git calculé : `5b9b9ae780f735eadef049afeb10acf0b57441fe` ;
- blob `index.html` du checkpoint GREEN : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Le fichier fourni correspond donc exactement au `index.html` de la base de ce lot.

## État Core actuel

Il n'existe actuellement aucun :
`assets/gensrpg/core/dice-v1.js`.

Le futur service Core Dice n'a donc pas encore de propriétaire extrait.

## Frontière de périmètre

`Math.random()` est massivement utilisé dans `index.html` pour des responsabilités
qui ne sont pas un moteur de dés :

- IDs temporaires ;
- spawns ;
- rencontres ;
- loot ;
- sélection IA ;
- génération de carte ;
- branches ;
- Capture ;
- choix pondérés.

Le lot Dice ne doit **pas** devenir un générateur RNG global.

Le périmètre Core Dice doit rester limité aux jets de règles :
- D6 ;
- D20 / dé configurable ;
- D100 ;
- seuil/chance ;
- résultat réussite/échec ;
- éventuellement une structure de résultat pure.

Les choix aléatoires de contenu restent chez leurs propriétaires gameplay.

## Propriétaires / consommateurs caractérisés

### 1. D100 — helper partagé historique

`d100ThresholdFromChance(chance)` dans `index.html`.

Contrat actuel :
- chance clampée à 1..100 ;
- seuil = 101 - chance ;
- réussite lorsque le jet est >= seuil.

Ce helper est utilisé par plusieurs chemins combat / attaque.

### 2. Test RPG universel — dé configurable

`dungeonUniversalTest(statValue,opt)` dans `index.html`.

Contrat actuel :
- nombre de faces configurable, défaut issu des règles RPG (souvent D20) ;
- jet 1..N ;
- total = stat + jet + modificateur ;
- réussite si total >= difficulté.

`dungeonInitiativeScore` possède encore son propre jet configurable.

### 3. D6 Survie / jets spéciaux

`showSpecialD6Roll(...)`.

Contrat actuel :
- un D6 ;
- réussite sur `roll >= threshold` ;
- anime ensuite via `animateDice`.

Les attaques Survie et compagnons possèdent d'autres consommateurs D6.

### 4. Jet RPG libre Dungeon

`rollDungeonRpDice073()`.

Trois sous-cas :
- attaque arme : D100 + `d100ThresholdFromChance` ;
- esquive : D100 avec seuil recalculé inline ;
- test de caractéristique : délègue à `dungeonUniversalTest`.

Ce module est un consommateur UI, pas un bon propriétaire Core.

### 5. D100 Dungeon historiques / challenges

Des helpers/consommateurs locaux persistent :
- `d10048(chance)` avec clamp 5..95 ;
- `dc051RollStatChallenge(...)` avec clamp 5..95 ;
- plusieurs générations IA de combat relancent directement des D100 ;
- elles utilisent la même sémantique générale `roll >= 101 - chance`, mais
  restent intégrées à leur résolution gameplay.

### 6. Puzzle et détection de pièges

`dc201PuzzleRoll()` et `dc211TrapTest()` utilisent :
- D100 1..100 ;
- réussite sur `roll <= chance`.

Cette écriture est mathématiquement équivalente à un seuil haut pour une chance
entière, mais les clamps et conventions d'affichage ne sont pas identiques.

Le pré-audit ne normalise rien tant que ces différences ne sont pas couvertes par
des contrats explicites.

## Tactical V114.11 : propriétaire de règles D100 séparé

`assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js` est un acteur
distinct et important.

Il possède notamment :
- `thresholdForChance(hitChance, high)` avec clamp 1..99 ;
- `displayHit(roll, hitChance, high)` ;
- `nextRandom(state)`, qui utilise `state.rngSeed` lorsqu'il existe et
  `Math.random()` sinon ;
- le patch du vrai `resolveAttack` Tactical ;
- les jets D100 de touche ;
- les jets D100 de critique ;
- une partie de la résolution de dégâts/armure autour de ces jets.

Conclusion : ce fichier n'est pas un simple décorateur visuel. Il est actuellement
un propriétaire de résolution Tactical. Core Dice ne devra pas absorber sa logique
de hit/dégâts ; il pourra seulement, dans un lot futur et après preuve de parité,
fournir des primitives de jet pures consommées par Tactical.

Le RNG seedé est une contrainte de contrat importante : le futur Core Dice doit
permettre une source RNG injectée ou explicitement fournie, sinon un raccord
Tactical pourrait casser la reproductibilité d'une session seedée.

## Animation : propriétaires distincts

`assets/gensrpg/gens-mobile-combat-performance-16781022.js` capture :
- `animateDice` ;
- `animateRpgDice` ;

puis installe :
- `animateDiceDispatch` ;
- `animateRpgDiceDispatch`.

Ce module :
- génère des faces temporaires pour l'animation ;
- conserve les résultats finaux reçus ;
- ne calcule ni chance, ni seuil, ni règle de réussite gameplay.

Conclusion : il est un décorateur UI/performance et ne doit pas devenir le
propriétaire Core Dice.

`assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js` est un second
décorateur d'animation D100 Tactical :
- il lit la valeur finale déjà calculée depuis la carte ;
- il affiche des faces D100 temporaires avec `Math.random()` ;
- il termine sur la valeur finale reçue ;
- il ne possède pas `resolveAttack` ni le calcul du seuil de touche.

Il doit rester séparé du moteur de règles.

## Risques architecturaux

1. Centraliser tout `Math.random()` mélangerait dés de règle et RNG de contenu.
2. Extraire seulement `d100ThresholdFromChance` serait trop petit et laisserait
   plusieurs générateurs de jets redondants.
3. Déplacer les résolutions d'attaque dans Core Dice violerait les frontières Stats /
   Tactical / Dungeon : le moteur de dés doit produire des jets, pas décider dégâts,
   armure, critique ou mutation PV.
4. Un Core Dice non injectable casserait potentiellement le RNG seedé de Tactical
   V114.11.
5. Les patches d'animation Mobile Combat Performance et Tactical Wall/Dice ne
   doivent pas devenir des autorités de règle.
6. Uniformiser immédiatement les clamps 1..100, 1..99 et 5..95 pourrait modifier
   le gameplay.
7. Les animations doivent rester séparées des règles et du RNG de résolution.

## Sentinelle de pré-audit

Test :
`tests/gens_phase4_dice_preaudit_v1.test.cjs`.

Il vérifie :
- absence de Core Dice actuel ;
- présence des principaux propriétaires/consommateurs ;
- conventions D6 / dé configurable / D100 ;
- séparation animation/règles des modules performance ;
- présence du propriétaire de résolution D100 Tactical V114.11 et de son RNG seedé ;
- présence d'un grand volume de RNG non-dice, donc hors périmètre.

## Suite recommandée après GREEN

Ouvrir un lot séparé **contrat pur Core Dice**.

Avant tout raccord runtime, figer un contrat minimal sans gameplay :
- `roll(sides, rng?) -> integer` ;
- `thresholdFromChance(chance, bounds?)` ou équivalent ;
- `rollChanceHigh(chance, bounds?, rng?)` ;
- éventuellement `rollCheck({sides, modifier, difficulty})`.

Le contrat doit permettre l'injection d'un RNG pour les tests mais utiliser
`Math.random` par défaut au runtime.

Ne pas raccorder immédiatement tous les consommateurs.
Premier raccord futur à choisir seulement après test de parité exact d'un petit
propriétaire, probablement le helper D100 partagé ou `dungeonUniversalTest`.

## Interdictions pour ce pré-audit

- aucun nouveau service runtime ;
- aucun remplacement de `Math.random()` ;
- aucun changement de seuil/chance ;
- aucun changement D6/D20/D100 ;
- aucun changement d'animation ;
- aucun changement Stats/Tactical/Dungeon/Survie/Capture ;
- aucun wrapper/observer/timer/retry supplémentaire ;
- aucun changement de `index.html` ;
- aucun changement de `main`.
