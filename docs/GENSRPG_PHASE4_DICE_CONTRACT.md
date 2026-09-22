# GenSrpG — Phase 4 Core Dice — contrat pur

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-dice-contract-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-contract-2026-09-22`.
- Base exacte :
  `b4af567cc93d8dac30e87131e7a1eb32e10c6486`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission

Créer uniquement le contrat pur du futur Core Dice.

Aucun consommateur runtime n'est raccordé dans ce lot.

## RED

Sentinelle :
`tests/gens_phase4_dice_contract_v1.test.cjs`.

Commit CI RED :
`edb46632a1a3dfb16a77f547272bc0e3e2a5a758`.

Run Architecture :
`35676025115` — FAILURE attendu.

Erreur exacte :
`Phase 4 pure Core Dice service must exist`.

Le RED a été obtenu avant création du service.

## Service Core ajouté

Commit runtime :
`8fa6c7f3e23d8118744bb890e78101310edc8da9`.

Fichier unique :
`assets/gensrpg/core/dice-v1.js`.

API :
- `roll(sides, rng?)` ;
- `thresholdFromChance(chance, bounds?)` ;
- `rollChanceHigh(chance, bounds?, rng?)` ;
- `rollCheck({sides, modifier, difficulty, rng?})`.

Le service :
- est pur ;
- accepte un RNG injecté ;
- utilise `Math.random` par défaut ;
- valide explicitement les faces et sorties RNG ;
- renvoie des résultats explicables et immuables pour chance/check ;
- ne connaît aucun module gameplay ;
- ne possède ni DOM, stockage, timer, observer ou listener.

## Bornes caractérisées

Le contrat protège :
- D6 ;
- D20 ;
- D100 ;
- chance par défaut 1..100 ;
- bornes explicites 1..99 ;
- bornes explicites 5..95 ;
- succès haut `roll >= threshold` ;
- check générique `roll + modifier >= difficulty`.

Aucune de ces bornes explicites n'est imposée aux consommateurs historiques :
elles sont fournies par l'appelant.

## Cartographie Phase 2

L'ajout physique du service a déclenché correctement la sentinelle de cartographie :

- inventaire physique : 93 -> 94 fichiers JS ;
- le service est classé **Phase 4 inert** ;
- graphe production-reachable inchangé à 76 ;
- aucun chargement de `dice-v1.js` par `index.html`, preview ou GitHub Pages.

Commit d'alignement :
`d49573f2c3b1e3b2ecc48f5ade859d8af3e9b68c`.

L'ancien pré-audit Dice a également été réaligné :
- Core Dice existe désormais ;
- les propriétaires historiques restent présents ;
- aucun raccord runtime n'existe encore.

Commit :
`8d5eb68ebe6f24368f2192f8166fcc33bd1dcee6`.

## Frontières conservées

Inchangés :
- `index.html` ;
- `d100ThresholdFromChance` ;
- `dungeonUniversalTest` ;
- `showSpecialD6Roll` ;
- `rollDungeonRpDice073` ;
- D100 historiques Dungeon ;
- puzzles/pièges ;
- Tactical V114.11 et son RNG seedé ;
- animations Mobile Combat Performance ;
- animations Tactical Wall/Dice ;
- Stats / Inventory / Storage ;
- Survie / Dungeon / Capture / PvP ;
- `main`.

Aucun wrapper, observer, timer, retry ou fallback n'a été ajouté.

## Validation technique

SHA technique :
`8d5eb68ebe6f24368f2192f8166fcc33bd1dcee6`.

- Architecture + navigateur complet :
  `35676212916` — SUCCESS ;
- Firefox :
  `35676212738` — SUCCESS ;
- Tactical Dock :
  `35676212751` — SUCCESS.

La sentinelle Core Dice et la cartographie Phase 2 sont SUCCESS.

## Suite recommandée

Après checkpoint GREEN seulement, ouvrir un lot séparé de **parité / sélection du premier raccord Core Dice**.

Ne pas raccorder plusieurs propriétaires à la fois.

Le premier candidat doit être choisi après comparaison exacte parmi :
- le helper partagé `d100ThresholdFromChance` ;
- `dungeonUniversalTest`.

Tactical reste hors du premier raccord tant que la conservation exacte de son RNG
seedé et de ses conventions 1..99 n'est pas prouvée.

## Clôture

La présente documentation change le SHA.

Avant checkpoint GREEN final :
1. Architecture + navigateur complet — SUCCESS ;
2. Firefox — SUCCESS ;
3. Tactical Dock — SUCCESS ;
sur le SHA documentaire exact.

Checkpoint cible :
`checkpoint/gensrpg-phase4-dice-contract-green-2026-09-22`.
