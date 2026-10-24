# GenSrpG — Phase 4 Core Dice — pré-audit premier raccord

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-dice-first-raccord-preaudit-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-dice-first-raccord-preaudit-2026-09-22`.
- Base exacte :
  `0ac5882199f845eec0b811e680b8ef624b95720a`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-dice-contract-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

Aucun runtime n'est modifié dans ce pré-audit.

## Base index vérifiée

Le fichier utilisateur `index_work_9.zip` contient le HTML complet correspondant au
blob Git :
`5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Aucun lot entre la base Equipment et ce pré-audit n'a modifié `index.html`.
Cette copie reste donc l'autorité locale pour l'inspection du gros fichier.

## Candidat 1 — d100ThresholdFromChance

Définition historique :

`d100ThresholdFromChance(chance)`.

Occurrences exactes :
- 1 définition ;
- 15 callsites.

Contrat historique :
- `Number(chance)` ;
- fallback `|| 1` ;
- clamp 1..100 ;
- seuil `101 - chance` ;
- clamp final 1..100.

Le helper est consommé par :
- affichages de formule ;
- attaques ennemies Dungeon ;
- affichage d'attaque RPG ;
- chemins IA historiques ;
- previews / labels ;
- jet RPG libre arme.

Tous ces consommateurs partagent le même seam central.

### Parité Core

`GensDiceV1.thresholdFromChance(value)` est exactement équivalent au helper
historique pour les valeurs finies / coercibles représentatives :
- valeurs négatives ;
- 0 ;
- 1 ;
- 5 ;
- 25 ;
- 50 ;
- 50.5 ;
- 95 ;
- 99 ;
- 100 ;
- valeurs > 100 ;
- chaînes numériques ;
- chaîne vide ;
- null ;
- false.

Différence volontaire du Core pur :
- `undefined` ;
- `NaN` ;
- `+Infinity` ;
- `-Infinity`.

Le legacy les tolère via ses coercions/clamps ; le Core strict refuse les valeurs
non finies.

Conclusion : un futur raccord exact peut conserver uniquement une **normalisation
de frontière** dans l'adapter historique, puis déléguer la formule au Core. Il
n'est pas nécessaire d'assouplir le Core pur.

## Candidat 2 — dungeonUniversalTest

Occurrences exactes :
- 1 définition ;
- 1 callsite direct dans le jet RPG libre de fiche.

Malgré ce faible nombre de callsites, la fonction possède davantage de
responsabilités :
- lecture `loadDungeonRpgRules()` ;
- branche `testsEnabled` ;
- sélection du nombre de faces depuis options/règles ;
- coercions historiques tolérantes ;
- `Math.random()` direct ;
- addition stat + jet + modificateur ;
- normalisation difficulté ;
- structure résultat historique avec `enabled`, `sides`, etc.

Le Core `rollCheck` est volontairement plus strict et ne possède pas ces
responsabilités de configuration.

Conclusion : raccorder `dungeonUniversalTest` en premier demanderait davantage
d'adaptation et présente un risque plus élevé de changement subtil.

## Sélection

**Premier raccord recommandé : `d100ThresholdFromChance`.**

Raisons :
1. une seule responsabilité ;
2. un seul seam central pour 15 consommateurs ;
3. formule Core déjà en parité sur le domaine fini/coercible réel ;
4. les différences non finies peuvent être préservées dans une frontière minuscule ;
5. aucun RNG n'est déplacé dans ce premier raccord ;
6. Tactical et son RNG seedé restent hors périmètre ;
7. aucun calcul de réussite/dégâts n'est déplacé.

`dungeonUniversalTest` est différé dans un lot ultérieur.

## Sentinelle

Test :
`tests/gens_phase4_dice_first_raccord_preaudit_v1.test.cjs`.

Il vérifie :
- 15 callsites D100 ;
- 1 callsite Universal Test ;
- corps historique exact du helper ;
- parité Core sur valeurs finies/coercibles ;
- divergence non-finie explicitement caractérisée ;
- responsabilités supplémentaires de `dungeonUniversalTest` ;
- Core Dice toujours inert / non chargé.

## Lot correctif suivant — RED attendu

Après GREEN uniquement, ouvrir un lot dédié au raccord du helper partagé.

Le RED devra exiger :
1. Core Dice chargé explicitement avant consommation ;
2. `d100ThresholdFromChance` ne possède plus la formule `101-c` ;
3. normalisation historique non-finie conservée à la frontière ;
4. délégation à `GensDiceV1.thresholdFromChance` ;
5. parité exacte sur valeurs représentatives + non-finies ;
6. aucun changement de génération du jet D100 ;
7. aucun changement Tactical ;
8. aucune autre migration Dice dans le même lot.

## Interdictions

- aucun changement runtime dans ce pré-audit ;
- aucun chargement Core Dice ;
- aucune modification de `index.html` ;
- aucun changement de chance/seuil ;
- aucun changement RNG ;
- aucun changement Tactical ;
- aucun wrapper/observer/timer/retry/fallback ;
- aucun changement de `main`.

## Clôture

Checkpoint cible après trois SUCCESS sur le SHA documentaire final :

`checkpoint/gensrpg-phase4-dice-first-raccord-preaudit-green-2026-09-22`.
