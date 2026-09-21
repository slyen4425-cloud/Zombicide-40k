# GenSrpG — Phase 4 Core Stats — S6 Audit dérivées génériques

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s6-derived-values-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s6-derived-values-2026-09-21`.
- Base exacte / dernier GREEN :
  `c96650bf133432091c0adcf1a2c1a85686d0079b`.
- Checkpoint précédent :
  `checkpoint/gensrpg-phase4-stats-s5-modifier-providers-green-2026-09-21`.
- Production `main` reste gelée sur
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission de cet audit

Classer les dérivées candidates S6 avant toute extraction.

Aucune formule, aucun runtime et aucun fichier de production n'est modifié par
cet audit.

## Surcouches Stats actuellement prouvées

Dans `assets/gensrpg/gens-rpg-stats-clean-167874.js`, le propriétaire Stats
décore les helpers historiques avec les règles suivantes.

### Dégâts physiques

```text
historicalPhysical
+ extraTotal("damage:physical")
+ extraTotal("damage:melee")
```

Cette valeur est un **bonus dérivé**, pas l'application finale des dégâts.

### Dégâts magiques

```text
historicalMagic
+ extraTotal("damage:magic")
```

### Bonus PV maximum

```text
historicalHpBonus
+ extraTotal("max_hp")
```

Le HP courant reste hors Core Stats.

### Mana maximum

```text
max(0, historicalMaxMana + extraTotal("max_mana"))
```

Le mana courant reste hors Core Stats.

### Critique

```text
clamp(
  historicalCrit + extraTotal("crit"),
  0,
  rules.critCap || 100
)
```

S6 peut fournir la valeur dérivée.
La résolution d'un critique reste au moteur combat.

### Esquive

```text
clamp(
  historicalDodge + extraTotal("dodge"),
  0,
  rules.dodgeCap || 100
)
```

S6 peut fournir la valeur.
L'application de l'esquive au toucher reste hors S6.

### Résistance magique

```text
max(
  0,
  historicalMagicResistance + extraTotal("magic_resistance")
)
```

Il s'agit uniquement de la dérivée magique historique.
La normalisation et l'application des résistances génériques/élémentaires restent
réservées au lot S8.

### Initiative

```text
historicalInitiative + extraTotal("initiative")
```

S6 peut fournir la valeur.
L'ordre de tour Tactical reste propriétaire Tactical.

## Frontières exclues du premier sous-lot S6

### Défense

`dungeonDerivedDefense` est déjà remplacé par la valeur canonique Stats dans le
contexte Dungeon.

L'application de Défense au toucher diverge encore entre Dungeon et Tactical.
Ne pas l'inclure dans S6.

### Armure

`dungeonArmorScore` expose actuellement le score canonique.

La transformation score -> réduction Dungeon et la soustraction Tactical ont des
sémantiques différentes.
Ne pas inclure leur application dans S6.

### Mouvement

`dungeonHeroMoveValue083` est une projection directe de la stat canonique avec
fallback de profil, pas une dérivée générique du même type que le présent lot.

### Hit / ranged damage via applyDungeonCombatScaling

Le wrapper `applyDungeonCombatScaling` :
- choisit melee/ranged/magic selon l'attaque ;
- modifie `hitChance` ;
- ajoute une ligne d'explication UI ;
- ajoute `damage:ranged` uniquement en mode ranged.

Il s'agit d'un adaptateur **Combat/Equipment**, pas d'un moteur de dérivées pur.
S6 ne doit pas déplacer cette mutation d'attaque.

Les totaux Stats `hit:*` et `damage:ranged` existent déjà dans S3 et pourront
être consommés par un adaptateur explicite plus tard.

## Tests existants relus

### gens_stat_engine_cleanup_v167894

Ce test prouve notamment :
- migration des anciens coefficients vers des effets visibles ;
- neutralisation des gains legacy cachés ;
- physical = 5 dans sa fixture ;
- magic = 3 ;
- HP = 4 ;
- mana = 6 ;
- crit = 8.

Il protège la non-duplication de l'ancien moteur et des effets configurables.

### gens_rpg_tactical_combat_v2_stats_v1678110

Le snapshot historique Tactical consomme encore :
- max HP ;
- movement ;
- initiative ;
- defense ;
- armor ;
- dodge ;
- crit ;
- magic resistance ;
- max mana ;
- physical/magic damage bonus.

Ce test confirme les consommateurs mais S6 ne doit pas encore modifier le
snapshot V110 : ce raccord appartient à S7.

### gens_v11411_final_melee_damage_contract

Le contrat final Tactical verrouille :
arme 5 + bonus physique 3 - armure 2 = 6.

Cela confirme que S6 peut produire le bonus physique, mais **ne doit jamais**
appliquer l'armure ni calculer le dégât final.

## Blocage d'extraction complète

Les surcouches Stats sont connues précisément, mais les valeurs
`historicalPhysical`, `historicalMagic`, `historicalHpBonus`,
`historicalMaxMana`, `historicalCrit`, `historicalDodge`,
`historicalMagicResistance` et `historicalInitiative` proviennent encore de
helpers historiques dont les formules de base sont dans le gros runtime inline.

Pour extraire les **formules complètes** S6 sans approximation, il faut inspecter
le `index.html` exact du HEAD S6.

Aucune formule ne sera reconstruite depuis une supposition ou depuis un test
partiel.

## Règle 26 déclenchée

SHA exact :
`8f6fa73c365a107e50fa759346955354ddfa59ea`.

Fichier requis :
`index.html`.

Permalink :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/8f6fa73c365a107e50fa759346955354ddfa59ea/index.html`

Procédure :
1. télécharger ce fichier exact ;
2. le compresser en ZIP ;
3. l'envoyer dans la conversation ;
4. vérifier le blob/taille contre Git avant inspection ;
5. inspecter uniquement les helpers dérivés S6 ;
6. poser ensuite le TDD de parité ;
7. aucun patch du gros HTML dans le lot d'extraction pure.

## État

Audit S6 : caractérisation externe terminée.

Implémentation S6 : non commencée tant que le fichier exact requis par la règle
26 n'a pas été vérifié.


## Règle 26 satisfaite — source inline exacte vérifiée

Le fichier fourni dans le fil a été vérifié avant inspection :

- taille : `8 174 580` octets ;
- blob Git : `5b9b9ae780f735eadef049afeb10acf0b57441fe` ;
- blob identique au `index.html` du commit d'ouverture S6
  `8f6fa73c365a107e50fa759346955354ddfa59ea`.

Le fichier reçu porte le nom local `index_work_8.txt`, mais son contenu est
bit à bit celui du `index.html` demandé.

Helpers inline inspectés uniquement dans le périmètre S6 :
- `dungeonPhysicalDamageBonus` ;
- `dungeonMagicDamageBonus` ;
- `dungeonEnduranceHpBonus` ;
- `dungeonMaxMana` ;
- `dungeonCriticalChance` ;
- `dungeonDodgeChance` ;
- `dungeonDerivedInitiative` ;
- `dungeonMagicResistance`.

### Formules historiques exactes confirmées

Dégâts physiques :
```text
si physicalDamageFormula == percent -> 0
sinon floor(force / max(1, physicalDamageStep)) * physicalDamageGain
puis + damage:physical + damage:melee
```

Dégâts magiques :
```text
si magicDamageFormula == percent -> 0
sinon floor(intelligence / max(1, magicDamageStep)) * magicDamageGain
puis + damage:magic
```

Bonus PV :
```text
si hpFormula == percent
  -> round(baseHp * (endurance * max(0, hpPercentPerPoint)) / 100)
sinon
  -> floor(endurance / max(1, enduranceHpStep)) * hpGain
puis + max_hp
```

Mana maximum :
```text
historical =
  max(0,
    baseMana
    + derived spirit
    + external mana
  )
final = max(0, historical + max_mana)
```

Critique et esquive conservent obligatoirement **deux étages de cap** :
```text
historicalCrit  = clamp(baseCrit  + derived + external crit,  0, critCap)
finalCrit       = clamp(historicalCrit  + effet crit,  0, critCap)

historicalDodge = clamp(baseDodge + derived + external dodge, 0, dodgeCap)
finalDodge      = clamp(historicalDodge + effet dodge, 0, dodgeCap)
```

Ces deux étages ne doivent pas être fusionnés : avec des modificateurs négatifs
et des effets positifs/négatifs, une simplification algébrique changerait le
résultat historique.

Initiative :
```text
canonical initiative + effet initiative
```

Résistance magique :
```text
historical =
  max(0, derived spirit + external magicDefense)
final =
  max(0, historical + magic_resistance)
```

### Contrat d'extraction autorisé

Le futur moteur S6 reçoit explicitement :
- valeurs canoniques de stats ;
- règles Dungeon déjà normalisées par leur propriétaire ;
- base HP déjà résolue par l'adaptateur ;
- totaux externes déjà calculés pour mana/crit/dodge/magicDefense ;
- totaux d'effets déjà calculés par Core Stats/S3.

Il ne lit aucun global du jeu et ne sait pas si un total externe vient d'un
équipement, d'un talent ou d'un autre propriétaire.

Le mode percent des dégâts reste volontairement à 0 dans les helpers S6 :
l'application du pourcentage à une attaque appartient toujours à
`applyDungeonCombatScaling` et reste hors de ce lot.

## Étape suivante autorisée

La règle 26 étant satisfaite, poser maintenant le TDD de parité S6 avant de
créer le moteur pur. Le RED attendu doit être l'absence du nouveau fichier Core,
et non une divergence des propriétaires historiques.
