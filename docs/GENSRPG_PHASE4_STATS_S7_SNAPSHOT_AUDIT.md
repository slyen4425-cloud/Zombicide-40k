# GenSrpG — Phase 4 Core Stats — S7 audit snapshot Core unique

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s7-core-snapshot-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s7-core-snapshot-2026-09-21`.
- Base exacte / dernier GREEN : `a98c32968fbb32a32827c7f6d03b9666db392be8`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-stats-s6-derived-values-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Caractériser le double chemin de snapshot héros réellement actif avant toute
création ou migration vers un snapshot Core unique.

S7 ne change aucune formule et ne retire aucun lecteur historique dans cet audit.

## Source inline exacte

Le `index.html` de la base S7 est toujours le blob vérifié par la règle 26 :
- taille : `8 174 580` octets ;
- blob Git : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Le fichier fourni dans le fil et déjà vérifié pour S6 est donc exactement
réutilisable pour l'inspection S7.

### dungeonCombatHeroSnapshot

Le snapshot Dungeon inline :
1. remplace temporairement `current/state` par le héros demandé ;
2. lit max HP / wounds ;
3. relit Force, Agilité, Intelligence, Esprit, Endurance ;
4. relit Defense, Armor, armorReduction, magicResistance ;
5. relit mana/maxMana, crit, dodge et initiative ;
6. restaure `current/state`.

Il produit déjà un premier snapshot avant Tactical.

## Adapter Tactical actif

Fichier :
`assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js`.

`heroSnapshot(rt,id)` :
- appelle d'abord `dungeonCombatHeroSnapshot(id)` s'il existe ;
- possède encore un fallback qui relit les helpers Dungeon.

`heroActor()` consomme ce premier snapshot pour :
- hp/maxHp ;
- movement ;
- initiative ;
- defense ;
- armor ;
- dodge.

Il conserve des fallbacks `canonicalStat()` vers
`GensCleanRpgStats167874.value()`.

Le chemin attaque reste séparé :
- `effectiveAttackStats` ;
- `weaponHitProfile` ;
- lecture de la caractéristique de scaling ;
- calcul hit/range/power.

Ce chemin attaque appartient aux frontières Equipment/Combat/S10-S11 et ne doit
pas être absorbé par S7.

## V110 actif : second snapshot

Fichier :
`assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js`.

Le graphe actif charge V110 via
`gens-rpg-tactical-combat-v2-integration.js`.

`hookAdapter()` wrappe l'Adapter `createBattle()` :
1. l'Adapter crée d'abord les acteurs depuis le snapshot Dungeon ;
2. V110 appelle ensuite `decorateBattle(...,{force:true})` ;
3. `buildHeroSnapshot()` reconstruit un second snapshot ;
4. `applyHeroSnapshot()` réapplique une partie des valeurs sur l'acteur.

### Relectures du second snapshot

Pour chaque définition active, `buildHeroSnapshot()` appelle
`GensCleanRpgStats167874.value(hero,id)`.

Il relit aussi les dérivées historiques :
- effectiveMaxWounds ;
- movement fallback ;
- initiative ;
- defense ;
- armor ;
- dodge ;
- crit ;
- magicResistance ;
- maxMana ;
- physicalDamageBonus ;
- magicDamageBonus.

Puis il ajoute :
- mana courant ;
- résistances ;
- criticalMultiplier.

### Valeurs réappliquées à l'acteur

`applyHeroSnapshot()` réécrit :
- movement ;
- initiative ;
- defense ;
- armor ;
- dodge ;
- `actor.meta.rpgStats`.

Le mouvement restant est préservé/clampé.

## Cache V110

Après la création initiale, V110 n'est pas une boucle de recalcul permanente :
- le snapshot reste en mémoire ;
- `decorateBattle()` ne reconstruit que si version absente ou héros dirty ;
- `markHeroDirty()` / invalidation contrôlent les reconstructions ;
- preview et rendu lisent le snapshot.

S7 doit donc supprimer à terme le **double passage initial**, pas casser ce
principe de snapshot en mémoire.

## V114.5

`assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js` contient
`buildLinkedSnapshot/repairBattleStats`, mais la cartographie Phase 2 le classe
explicitement dans les fichiers non atteignables de production.

Il reste dette historique/dormante et ne doit pas devenir une autorité S7.

## Contrat Core S7 recommandé

Nouveau fichier cible :
`assets/gensrpg/core/stats-snapshot-v1.js`.

Global :
`GensStatsSnapshotV1`.

Entrée pure proposée :

```text
{
  heroId,
  definitions,
  values,
  derived
}
```

Où :
- `values` provient de la chaîne Core S3/S4/S5 ;
- `derived` provient de S6 ;
- `definitions` sert uniquement à produire les lignes canoniques
  id/name/icon/value.

Sortie immuable :

```text
{
  heroId,
  canonical: [{id,name,icon,value}],
  values: {...},
  derived: {...}
}
```

### Dérivées admises S7

Uniquement celles stabilisées par S6 :
- physicalDamageBonus ;
- magicDamageBonus ;
- hpBonus ;
- maxMana ;
- crit ;
- dodge ;
- initiative ;
- magicResistance.

Movement, Defense et Armor restent accessibles comme **valeurs canoniques**
dans `values`, sans nouvelle sémantique dérivée S7.

## Hors du snapshot Core S7

Ne pas mettre dans le propriétaire Core :
- hp courant ;
- mana courant ;
- wounds ;
- résistances (S8) ;
- armorReduction (S9) ;
- hitChance / D100 / couvert (S10) ;
- dégâts finaux / attaque (S11) ;
- criticalMultiplier ou règles combat ;
- équipement/armes ;
- positions ou ressources de tour.

Un futur adaptateur peut composer ces données autour du snapshot Core sans en
faire la responsabilité de Core Stats.

## TDD S7 attendu

La future sentinelle doit :
1. construire un oracle V110 avec valeurs connues ;
2. fournir les mêmes valeurs/definitions/derived au Core ;
3. comparer `canonical` et `values` ;
4. comparer le sous-ensemble dérivé S6 ;
5. vérifier aliases et définitions ;
6. vérifier immutabilité profonde utile ;
7. vérifier absence de current resources / resistances / rules ;
8. vérifier pureté : aucun DOM, stockage, runtime global, Tactical, timer,
   observer ou wrapper.

Le premier RED doit être l'absence du fichier
`assets/gensrpg/core/stats-snapshot-v1.js`.

## Raccord futur

La création du module pur et le raccord Tactical ne doivent pas être confondus.

Après GREEN du snapshot pur :
- caractériser un adaptateur qui compose snapshot Core + données session ;
- faire recevoir ce snapshot à Tactical ;
- seulement après preuve comparative, retirer les doubles lectures démontrées.

Aucune suppression de `dungeonCombatHeroSnapshot` ou de V110 n'est autorisée
dans l'extraction pure.
