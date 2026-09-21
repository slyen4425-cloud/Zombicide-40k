# GenSrpG — Phase 4 Core Stats / S10 — audit Toucher / Défense / Esquive

Date : 2026-09-21

Branche :
`work/gensrpg-phase4-stats-s10-hit-defense-dodge-2026-09-21`

Base / dernier GREEN :
`79744f111c9d4fd064c1dbd0dbfb599849cd06b2`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-stats-s10-hit-defense-dodge-2026-09-21`

Production `main` inchangée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## But

Rendre explicites les contrats de Toucher / Défense / Esquive actuellement
utilisés par Dungeon et Tactical avant toute consolidation.

S10 ne change aucune formule de gameplay.

## Autorité du gros index

Le fichier local déjà vérifié reste :
`work_8.zip / index_work_8.txt`.

Le tree Git du HEAD S10 confirme pour `index.html` :
- taille : `8 174 580` octets ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Le fichier local correspond donc encore exactement au gros `index.html`
autoritaire et peut être utilisé selon la règle 26.

## Graphe actif pertinent

La chaîne Tactical reste :

`index.html`
→ `gens-mobile-combat-performance-16781022.js`
→ `core/runtime-bootstrap-v1.js`
→ `gens-rpg-tactical-combat-v2.js`
→ adapter
→ rules
→ integration
→ V108/V109/V110/V111/V112/V113
→ `gens-rpg-tactical-visual-dice-16781142.js` V114.11.

Les valeurs canoniques Défense et Esquive sont transportées vers Tactical par
le snapshot V110. Leur utilisation finale appartient ensuite aux résolveurs de
combat Tactical.

## Core Stats : responsabilités déjà stables

Core Stats possède / prépare déjà :
- la caractéristique attaquante canonique ;
- les modificateurs `hit:melee`, `hit:ranged`, `hit:magic` ;
- la valeur canonique Défense ;
- la valeur dérivée Esquive.

Ces données ne doivent pas être confondues avec la **résolution finale** d'une
attaque.

## Dungeon — bonus de toucher

`dungeonHitBonusForMode(mode,value)` lit les règles :
- mêlée : `meleeHitStep / meleeHitGain` ;
- distance : `rangedHitStep / rangedHitGain` ;
- magie : `magicHitStep / magicHitGain`.

Formule historique :
`floor(max(0,attribute) / step) * gain`.

Valeurs par défaut :
- step 10 ;
- gain 5 ;
- `basicAttackBaseChance = 50`.

Exemple :
- caractéristique 10 ;
- base 50 ;
- bonus +5 ;
- chance avant Défense = 55%.

## Dungeon — Défense

Dans `dungeonCombatBasicAttack()` et la chaîne D100 des armes :

`defensePenalty = max(0, (targetDefense - attackerCharacteristic) * defensePenaltyPerPoint)`.

Valeur par défaut :
`defensePenaltyPerPoint = 1`.

Donc la Défense ne pénalise **que la partie qui dépasse la caractéristique
attaquante**.

Exemples, attaquant caractéristique 10 :
- cible DEF 5 → pénalité 0 ;
- cible DEF 10 → pénalité 0 ;
- cible DEF 12 → pénalité 2 ;
- cible DEF 20 → pénalité 10.

La chance Dungeon est ensuite bornée par les règles configurables :
- `hitChanceMin` ;
- `hitChanceMax`.

Defaults :
- min 5 ;
- max 95.

## Dungeon — D100

`d100ThresholdFromChance(chance)` retourne :
`101 - chance`.

La réussite visible Dungeon est un jet **haut** :
- 55% → objectif 46+ ;
- 80% → objectif 21+ ;
- 95% → objectif 6+.

`dungeonCombatBasicAttack()`, `rollAttack()` et `rollEnemyAttack()`
utilisent cette sémantique finale.

## Dungeon — Esquive

L'Esquive n'entre pas dans la chance initiale.

Après une touche réussie :
- un second D100 est lancé ;
- succès d'Esquive si le jet atteint `101 - dodge` ou plus ;
- une touche esquivée n'atteint pas l'étape Armure/Résistance.

Cette séparation existe :
- pour les héros ciblés par `rollEnemyAttack()` ;
- pour les ennemis ciblés via `applyDungeonAttackDamage()`.

Ainsi, deux cibles de même Défense mais avec Esquive 0% et 40% ont **la même
chance de toucher initiale** dans Dungeon, puis une probabilité différente
d'annuler une touche après coup.

## Tactical — préparation du hit

L'Adapter convertit l'arme en D100 et transporte une valeur `attack.hit`.

Pour les armes RPG :
- base de l'arme ;
- bonus de caractéristique / effets canoniques ;
- autres bonus déjà calculés ;
- valeur finale avant la cible.

L'Adapter ne doit pas devenir propriétaire de Défense/Esquive/couvert.

## Tactical — Défense, Esquive et couvert

Le moteur V2 de base calcule actuellement :

`hitChance = attack.hit - target.defense - target.dodge - lineCover`.

Le module rules retire ensuite le couvert de case pour les attaques à distance.

Donc Tactical :
- retire **toute** la Défense ;
- retire **toute** l'Esquive directement de la chance de toucher ;
- retire le couvert avant le jet ;
- borne la chance à 5..95.

V114.11 `hitCalculation()` rend ce calcul visible et utilise le
`preview.hitChance` final comme autorité de chance.

## Tactical — D100 final visible

V114.11 convertit la chance Tactical vers la même présentation D100 haut :

`thresholdForChance(chance,true) = 101 - chance`.

`displayHit()` valide alors :
`roll >= threshold`.

Donc la divergence S10 ne porte pas principalement sur le sens du D100 final :
les deux interfaces actives présentent aujourd'hui une réussite sur **jet haut**.

La divergence porte surtout sur ce qui est soustrait **avant** ce seuil.

## Divergences prouvées

Même entrée de départ :
- base + bonus = 55% ;
- caractéristique attaquante = 10 ;
- cible Défense = 12 ;
- cible Esquive = 6 ;
- pas de couvert.

Dungeon :
- pénalité Défense = (12 - 10) × 1 = 2 ;
- chance initiale = 53% ;
- Esquive 6% = jet séparé après une touche.

Tactical :
- 55 - 12 - 6 = 37% ;
- Esquive déjà consommée dans le jet de toucher ;
- aucun second jet d'Esquive dans V114.11.

Autre cas :
- caractéristique 10 ;
- DEF 5 ;
- Esquive 0 ;
- départ 55%.

Dungeon :
- DEF inférieure à la caractéristique → 0 pénalité ;
- 55%.

Tactical :
- DEF 5 soustraite directement ;
- 50%.

## Couvert

Dungeon classique ne fait pas entrer un couvert de grille Tactical dans cette
formule D100.

Tactical retire :
- couvert de ligne ;
- couvert de case (20 actuellement dans le module rules).

Le couvert doit donc rester une donnée/règle Tactical et non une dérivée Core
Stats.

## Bornes configurables

Dungeon :
- `hitChanceMin` et `hitChanceMax` sont configurables dans les règles RPG.

Tactical :
- la chaîne V2/V114.11 borne actuellement à 5..95.

Une configuration Dungeon personnalisée 20..80 n'implique donc pas
automatiquement que Tactical adopte 20..80.

Cette différence doit rester visible dans S10.

## Contrat architectural S10

Le contrat cible de cette phase est **une frontière**, pas une formule commune.

Core Stats fournit :
- valeur caractéristique ;
- bonus hit par mode ;
- Défense ;
- Esquive.

Dungeon possède :
- comparaison Défense vs caractéristique attaquante ;
- `defensePenaltyPerPoint` ;
- bornes Dungeon configurées ;
- D100 Dungeon ;
- second jet d'Esquive.

Tactical possède :
- soustraction directe Défense/Esquive ;
- couvert ligne/case ;
- bornes Tactical 5..95 ;
- D100 Tactical final V114.11.

Aucun module Core ne doit lancer le dé, appliquer Défense/Esquive/couvert ou
produire une décision hit/miss pendant S10.

## Décision S10 avant TDD

Contrairement à S8/S9, l'audit ne justifie pas la création immédiate d'un
nouveau résolveur Core :
- ce serait un deuxième moteur de combat ;
- les sémantiques sont volontairement distinctes ;
- le plan précise que Dungeon/Tactical restent propriétaires de la résolution.

Le premier livrable S10 est donc une **sentinelle comparative sur les vrais
propriétaires**, avec un contrat d'architecture explicite.

Si cette sentinelle passe, S10 pourra être clôturé sans module Core
supplémentaire, sauf si une donnée commune manquante est objectivement prouvée.

## Matrice de caractérisation

La sentinelle S10 doit couvrir :
1. bonus hit par mode ;
2. caractéristique 10 / DEF 12 / Esquive 6 ;
3. DEF inférieure à la caractéristique ;
4. Esquive 0 vs 40 avec même Défense ;
5. couvert Tactical absent vs présent ;
6. bornes Dungeon personnalisées ;
7. bornes Tactical 5..95 ;
8. seuil D100 haut ;
9. absence de RNG/résolution hit dans Core Stats.


## Sentinelle comparative S10

Test :
`tests/gens_phase4_stats_s10_hit_defense_dodge_characterization_v1.test.cjs`.

Commits :
- création de la sentinelle :
  `e177bb3a109669c15a993ca04638c1937b5c6dbc` ;
- branchement CI :
  `8ace19da3992499f38b2c54ac195d3be3c81f9b7`.

La sentinelle utilise :
- les helpers inline réels `dungeonHitBonusForMode`,
  `dungeonClampHitChance`, `d100ThresholdFromChance`,
  `dungeonAttackerCharacteristic` et `dungeonDefenseReduction` ;
- les vrais corps propriétaires `dungeonCombatBasicAttack`,
  `rollEnemyAttack` et `applyDungeonAttackDamage` pour verrouiller
  l'ordre hit → dodge ;
- le vrai moteur Tactical V2 ;
- le vrai module Tactical rules pour le couvert de case ;
- le vrai V114.11 `hitCalculation / thresholdForChance / displayHit`.

Résultat de la sentinelle dans Architecture `35594837513` :
**SUCCESS**.

Elle prouve :
- D100 final haut dans les deux chemins ;
- Défense « excès seulement » dans Dungeon ;
- Défense directe dans Tactical ;
- Esquive second jet dans Dungeon ;
- Esquive incluse dans la chance Tactical ;
- couvert Tactical inclus avant le jet ;
- bornes Dungeon configurables ;
- bornes Tactical 5..95 ;
- aucune résolution hit/miss déplacée dans Core Stats.

## Décision S10

**Aucun nouveau module Core n'est créé dans S10.**

Cette absence d'extraction est volontaire et conforme à la charte :
- Core Stats possède déjà les valeurs et modificateurs communs nécessaires ;
- créer un calcul final commun introduirait un deuxième moteur concurrent ;
- Dungeon et Tactical ont des sémantiques historiques différentes ;
- le plan exige de conserver la résolution dans les moteurs combat tant qu'un
  moteur commun explicite n'existe pas.

S10 verrouille donc la **frontière d'autorité**, pas une formule unique.

Aucun fichier gameplay, aucune formule de hit, aucun D100, aucune Défense,
aucune Esquive, aucun couvert et aucun `index.html` n'ont été modifiés.
