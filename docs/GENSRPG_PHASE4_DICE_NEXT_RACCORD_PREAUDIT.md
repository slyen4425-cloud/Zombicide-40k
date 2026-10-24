# GenSrpG — Phase 4 Core Dice — pré-audit du prochain raccord

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-dice-next-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-next-raccord-preaudit-2026-09-22`.
- Base exacte :
  `e19d479c5559da9215d4456b4ea62c05a9f8bbf6`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-dice-first-raccord-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Ce lot est documentaire/diagnostic uniquement. Aucun runtime n'est modifié.

## Source index vérifiée

Le fichier utilisateur `work_10.zip` contient `index_work10.txt`, qui correspond
exactement au `index.html` du checkpoint GREEN de départ :

- taille : `8 174 637` octets ;
- blob Git : `5b8e790fefe7970a250fd9485ee80549511737e6`.

Le premier raccord `d100ThresholdFromChance` reste donc audité sur la vraie
composition GREEN actuelle.

## Raccord GREEN déjà protégé

`d100ThresholdFromChance(chance)` reste :

- 1 définition ;
- 15 callsites ;
- frontière historique `Number(chance) || 1`, clamp `1..100` ;
- délégation unique à `GensDiceV1.thresholdFromChance`.

Aucun de ses consommateurs n'est candidat à une seconde migration dans ce pré-audit.

## Inventaire des principaux seams restants

### 1. d10048(chance) — meilleur candidat

Occurrences :
- 1 définition ;
- 4 consommateurs.

Consommateurs identifiés :
- `dc047StealthPrompt` ;
- `dc048TrapDetectRoll` ;
- `dc048TrapActionRoll` ;
- `dc048TrapTrigger`.

Contrat historique exact :

1. `Number(chance) || 50` ;
2. `Math.round(...)` ;
3. clamp `5..95` ;
4. seuil `101 - chance` ;
5. un seul D100 : `1 + floor(Math.random() * 100)` ;
6. réussite haute : `roll >= threshold` ;
7. résultat :
   `{chance, threshold, roll, ok}`.

### Parité Core Dice

Après conservation de la seule frontière historique :

`c = Math.max(5, Math.min(95, Math.round(Number(chance) || 50)))`

le résultat de :

`GensDiceV1.rollChanceHigh(c,{min:5,max:95},rng)`

est exactement compatible avec le helper historique pour :
- la chance normalisée ;
- le seuil ;
- le nombre et l'ordre des appels RNG ;
- la transformation RNG -> D100 ;
- la condition de réussite.

Une matrice déterministe de 95 cas a été vérifiée :
- valeurs finies ;
- décimales autour des arrondis ;
- 0 ;
- chaînes numériques ;
- chaîne vide ;
- null / false ;
- undefined / NaN ;
- ±Infinity ;
- cinq valeurs RNG représentatives jusqu'à `0.999999`.

Les différences de strictesse du Core ne nécessitent pas d'assouplir le service :
la tolérance historique peut rester dans la frontière `d10048`.

### Forme de résultat

Le Core renvoie `success`, tandis que le legacy expose `ok`.

Un futur raccord exact devra conserver la forme historique pour les quatre
consommateurs, par exemple en projetant le résultat Core vers :
`{chance,threshold,roll,ok:success}`.

Cette projection est une frontière de compatibilité locale, pas un nouveau moteur.

## 2. dungeonUniversalTest — toujours différé

Occurrences :
- 1 définition ;
- 1 callsite direct.

Responsabilités encore mélangées :
- lecture de `loadDungeonRpgRules()` ;
- branche `testsEnabled` ;
- choix du nombre de faces ;
- coercions historiques tolérantes ;
- RNG direct ;
- stat + jet + modificateur ;
- normalisation de difficulté ;
- forme de résultat legacy incluant `enabled` et `sides`.

Le contrat `GensDiceV1.rollCheck` est plus strict et ne possède pas ces
responsabilités de configuration.

Conclusion : ce n'est toujours pas le prochain raccord recommandé.

## 3. showSpecialD6Roll — primitive simple mais propriétaire UI

Occurrences :
- 1 définition ;
- 2 consommateurs.

La génération est un D6 simple et pourrait techniquement être produite par
`GensDiceV1.roll(6)`.

Mais la fonction possède aussi :
- modal ;
- métadonnées UI ;
- animation ;
- callback `onResolved` ;
- événement de présentation ;
- interprétation du seuil.

Conclusion : ce n'est pas un seam moteur assez propre pour être choisi avant
`d10048`.

## 4. rollDungeonRpDice073 — UI composite

Le propriétaire UI traite trois chemins différents :
- arme : utilise déjà `d100ThresholdFromChance`, mais génère son D100 localement ;
- esquive : recalcule encore un seuil inline `101 - chance` ;
- caractéristique : délègue à `dungeonUniversalTest`.

Cette fonction mélange présentation et plusieurs contrats Dice différents.

Conclusion : ne pas la raccorder comme un bloc.

## 5. dc051RollStatChallenge — D100 5..95 distinct

Ce chemin est inline et n'a qu'un consommateur UI direct.

Contrat :
- `Number(chance) || 50` ;
- clamp `5..95` ;
- **pas de `Math.round` explicite** ;
- D100 direct ;
- succès haut `roll >= 101 - chance`.

Cette normalisation n'est donc pas strictement identique à `d10048`.

Conclusion : ne pas fusionner ces deux seams dans le même lot.

## 6. Puzzle / détection pièges — convention succès bas

`dc201PuzzleRoll` :
- clamp `5..95` ;
- D100 ;
- réussite `roll <= chance`.

`dc211TrapTest` :
- chance calculée puis arrondie ;
- clamp `0..100` ;
- D100 ;
- réussite `roll <= chance`.

Le Core actuel fournit `rollChanceHigh`, pas une primitive explicite
`rollChanceLow`.

Même si les probabilités peuvent être transformées mathématiquement, ce pré-audit
interdit une normalisation qui changerait les conventions d'affichage ou de bord.

Conclusion : différés.

## 7. dungeonInitiativeScore — définition sans consommateur actuel

Le symbole apparaît uniquement dans sa définition sur la composition courante.

Il contient un dé configurable quand `initiativeTurnMode === "die"`, mais aucun
callsite actif n'a été identifié.

Conclusion : ne pas raccorder un propriétaire actuellement non consommé avant les
seams runtime réellement actifs.

## Sélection du prochain micro-lot

**Candidat sélectionné : `d10048(chance)`.**

Raisons :
1. helper central déjà existant ;
2. quatre consommateurs réels bénéficient d'un seul raccord ;
3. une seule responsabilité Dice ;
4. parité déterministe exacte avec `GensDiceV1.rollChanceHigh` après conservation
   de la normalisation de frontière ;
5. un seul appel RNG avant/après ;
6. aucune convention Tactical n'est impliquée ;
7. aucun changement de gameplay, de clamp ou de probabilité n'est nécessaire ;
8. le service Core Dice lui-même n'a pas besoin d'être modifié.

## Futur lot TDD recommandé

Après GREEN de ce pré-audit seulement, ouvrir un lot séparé dédié uniquement à
`d10048`.

Le RED devra exiger au minimum :

1. normalisation historique exacte :
   `Math.round(Number(chance)||50)`, clamp `5..95` ;
2. disparition de la formule locale `101 - chance` et du générateur D100 local
   du helper ;
3. délégation à `GensDiceV1.rollChanceHigh(c,{min:5,max:95})` ;
4. conservation exacte du résultat legacy
   `{chance,threshold,roll,ok}` ;
5. un seul tirage RNG avec même ordre et mêmes bornes ;
6. quatre consommateurs byte-identiques ;
7. premier raccord `d100ThresholdFromChance` inchangé ;
8. Tactical / RNG seedé Tactical inchangés ;
9. aucun autre seam Dice raccordé ;
10. aucun wrapper, observer, timer, retry ou fallback.

## Sentinelle

Test :
`tests/gens_phase4_dice_next_raccord_preaudit_v1.test.cjs`.

Il verrouille :
- blob/taille exacts de l'index GREEN ;
- premier raccord existant ;
- inventaire et contrats des candidats ;
- parité déterministe `d10048` / Core Dice ;
- sélection unique de `d10048` ;
- différé explicite des autres seams.

## Interdictions du lot

- aucune modification de `index.html` ;
- aucune modification de `assets/gensrpg/core/dice-v1.js` ;
- aucun changement RNG ;
- aucun changement de clamps ;
- aucun changement Tactical / Stats / Inventory / Storage / Progression ;
- aucun changement Survie / Dungeon / Capture / PvP ;
- aucun wrapper/observer/timer/retry/fallback ;
- aucun changement de `main`.

## Clôture

Avant création du checkpoint GREEN cible :

`checkpoint/gensrpg-phase4-dice-next-raccord-preaudit-green-2026-09-22`

il faut trois SUCCESS sur le même SHA documentaire final exact :
1. Architecture + navigateur complet ;
2. Firefox ;
3. Tactical Dock.
