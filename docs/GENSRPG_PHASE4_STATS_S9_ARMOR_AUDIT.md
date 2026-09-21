# GenSrpG — Phase 4 Core Stats / S9 — audit contrat Armure

Date : 2026-09-21

Branche :
`work/gensrpg-phase4-stats-s9-armor-contract-2026-09-21`

Base / checkpoint de départ :
`a1a7d7ccd4183db30b258898aed4c0207c4a30aa`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-stats-s9-armor-contract-2026-09-21`

Production `main` inchangée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## But

Caractériser les sens actuellement attachés à « Armure » avant toute extraction ou
consolidation. S9 ne change aucune formule de gameplay.

Le mot `armor` recouvre aujourd'hui plusieurs responsabilités qu'il est interdit
de confondre :

1. **armorScore** : valeur canonique de stat ;
2. **armorReduction** : réduction calculée par les règles Dungeon ;
3. **tacticalArmorReduction** : soustraction directe du score dans le résolveur
   Tactical V114.11 ;
4. **armorFloorPolicy** : règle de blocage 0 / minimum quand la réduction absorbe
   tout le dégât physique.

## Autorité du gros index

Le fichier utilisateur retrouvé dans la Library est :
`work_8.zip / index_work_8.txt`.

Vérification locale :
- taille : `8 174 580` octets ;
- blob Git calculé : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Le tree Git du HEAD S9 `d56b7a279f23994b3bf83b405bd70a9ec8795f5c`
donne pour `index.html` exactement :
- taille : `8 174 580` ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Le fichier local est donc bit-identique au gros `index.html` Git requis par la
règle 26 et peut être utilisé pour l'audit S9 sans nouveau transfert.

## Graphe runtime actif pertinent

La composition réelle reste :

`index.html`
→ `gens-mobile-combat-performance-16781022.js`
→ `core/runtime-bootstrap-v1.js`
→ Tactical V2 base
→ adapter
→ rules
→ integration
→ UI
→ bridge.

L'intégration Tactical charge ensuite dynamiquement :
V108 → V109 → **V110 Stats** → V111 → V112 → V113 → **V114.11 visual dice**.

Le workflow Pages et `preview.html` injectent également les modules structurels
documentés, notamment `stats-normalization-v1.js` puis
`gens-rpg-stats-clean-167874.js`.

`dungeon-core-317.js` est déjà référencé par le `index.html` source et expose
`DungeonCore317.resolveArmorFloor`.

## Propriétaire du score d'armure héros

Le propriétaire canonique courant du score RPG est
`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

Le module :
- déclare `armor` parmi les stats Core ;
- calcule la valeur par `value(hero,"armor")` ;
- inclut base, équipement, compétences et effets dynamiques visant `armor` ;
- remplace `dungeonArmorScore()` par la valeur canonique lorsque la stat Armor
  est active ;
- conserve le fallback natif historique hors de ce contexte.

Le snapshot Tactical V110 appelle ensuite le vrai `dungeonArmorScore()`, place
le résultat dans `snapshot.derived.armor`, puis l'applique à `actor.armor`.

Conclusion : **V110 transporte un armorScore ; il ne calcule pas une réduction
Dungeon.**

## Sémantique Dungeon native

Dans le `index.html` exact :

`dungeonArmorReductionFromScore(score)` :
- charge `loadDungeonRpgRules()` ;
- calcule
  `floor(max(0,score) / max(1,armorReductionStep)) * max(0,armorReductionGain)`.

Valeurs par défaut :
- `armorReductionStep = 2` ;
- `armorReductionGain = 1` ;
- `minPhysicalDamage = 1` ;
- `armorZeroBlockChance = 75`.

Ainsi, avec les règles par défaut :

| armorScore | armorReduction Dungeon |
| ---: | ---: |
| 0 | 0 |
| 1 | 0 |
| 2 | 1 |
| 3 | 1 |
| 4 | 2 |
| 5 | 2 |
| 6 | 3 |

`dungeonDerivedForHero()` et `dungeonCombatHeroSnapshot()` conservent
**les deux champs séparés** :
- `armor` = score ;
- `armorReduction` = réduction Dungeon.

Les ennemis font de même :
`dungeonEnemyDerived()` retourne `armor` et calcule séparément
`armorReduction:dungeonArmorReductionFromScore(s.armor)`.

## Provenance et normalisation des règles

`defaultDungeonRpgRules()` fournit les valeurs par défaut.

`normalizeDungeonRpgRules()` :
- impose `armorReductionStep >= 1` ;
- borne `armorReductionGain >= 0` ;
- borne `minPhysicalDamage >= 0` ;
- borne `armorZeroBlockChance` dans `[0,100]`.

`loadDungeonRpgRules()` lit
`gensrpg_dungeon_rpg_rules_v1` dans `localStorage` puis normalise.

Le panneau de règles mappe explicitement :
- `drArmorStep -> armorReductionStep` ;
- `drArmorGain -> armorReductionGain` ;
- `drMinPhysicalDamage -> minPhysicalDamage` ;
- `drArmorZeroBlockChance -> armorZeroBlockChance`.

Ces règles sont donc des données configurables, pas des constantes Core.

## Sémantique Tactical V114.11

Le moteur Tactical V2 de base expose déjà :
`damage = max(0, attack.power - target.armor)`.

V110 transporte le score canonique dans `actor.armor`.

Le résolveur final V114.11
`gens-rpg-tactical-visual-dice-16781142.js` recalcule explicitement :

- `rawDamage = baseWeaponDamage + canonicalDamageBonus` ;
- `armor = preview.armor / target.armor` ;
- `damage = max(0, rawDamage - armor)`.

Donc **Tactical utilise armorScore comme réduction directe 1:1**.

Il n'utilise pas `armorReductionStep` ni `armorReductionGain`.

## Plancher / blocage Armor

`DungeonCore317.resolveArmorFloor()` possède la règle suivante :

- si dégâts entrants <= 0 : 0 ;
- après réduction, si le type est physique et le résultat <= 0 :
  - lire `armorZeroBlockChance` (75 par défaut) ;
  - roll < chance → 0 dégât ;
  - sinon → 1 dégât ;
- sinon :
  `max(1, configuredMin, reduced)`.

Le Tactical V114.11 appelle ce propriétaire avec :
- `reduction = armorScore` ;
- `configuredMin = 1` **en dur** ;
- `armorZeroBlockChance` provenant des règles Dungeon.

Conséquence importante :
- Tactical partage la probabilité `armorZeroBlockChance` ;
- Tactical **n'emploie pas** `minPhysicalDamage` configuré pour cette borne ;
- Dungeon natif transmet son `mit.min = minPhysicalDamage`.

Cette divergence doit rester visible ; S9 ne doit pas la « corriger » en silence.

## Matrice de comparaison à figer

Pour un même score avec règles par défaut :

| armorScore | réduction Dungeon | réduction Tactical |
| ---: | ---: | ---: |
| 0 | 0 | 0 |
| 1 | 0 | 1 |
| 2 | 1 | 2 |
| 3 | 1 | 3 |
| 4 | 2 | 4 |
| 6 | 3 | 6 |

Avec `armorReductionStep=3`, `armorReductionGain=2` :

| armorScore | réduction Dungeon | réduction Tactical |
| ---: | ---: | ---: |
| 2 | 0 | 2 |
| 3 | 2 | 3 |
| 4 | 2 | 4 |
| 6 | 4 | 6 |

Tactical reste indépendant de `armorReductionStep/gain`.

## Contrat S9 proposé avant extraction

Le futur Core S9 doit rester pur et inert. Il doit **nommer les sens**, pas en
choisir un implicitement :

- `normalizeScore(value)` → score non négatif ;
- `dungeonReductionFromScore(score,rules)` → sémantique Dungeon actuelle ;
- `tacticalReductionFromScore(score,{ignoreArmor})` → sémantique Tactical
  actuelle (score direct ou 0 si ignoreArmor) ;
- `floorPolicy(rules)` → données de politique normalisées
  (`zeroBlockChance`, `minPhysicalDamage`) sans lancer de dé et sans appliquer
  de dégâts.

Le futur module ne doit pas :
- modifier des PV ;
- lancer de RNG ;
- appeler `DungeonCore317.resolveArmorFloor` ;
- lire DOM, storage, héros, équipement, talents ou combat ;
- décider qu'une des deux sémantiques doit remplacer l'autre ;
- être raccordé au runtime dans S9.

## TDD attendu

1. Ajouter une sentinelle de caractérisation qui appelle/extrait les propriétaires
   réels et verrouille la divergence Dungeon/Tactical.
2. Ajouter le test de contrat Core S9 en RED : le nouveau module est absent.
3. Le RED doit être causé uniquement par cette absence.
4. Implémenter le module pur/inert.
5. Obtenir parité avec les deux sémantiques historiques sans changer le gameplay.
6. Repasser Architecture + navigateur, Firefox et Tactical Dock.
