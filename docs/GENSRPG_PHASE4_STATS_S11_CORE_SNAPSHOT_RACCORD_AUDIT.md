# GenSrpG — Phase 4 Core Stats — S11 audit raccord Core Snapshot → Tactical

Date : 2026-09-21

- Branche :
  `work/gensrpg-phase4-stats-s11-core-snapshot-raccord-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s11-core-snapshot-raccord-2026-09-21`.
- Base exacte / dernier GREEN :
  `8ead920b56dcebc16c78ada38fa1481476bc9cc2`.
- Checkpoint précédent :
  `checkpoint/gensrpg-phase4-stats-s11-melee-damage-double-application-fix-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Préparer le raccord réel des services Core Stats S3-S7 vers le snapshot Tactical
V110 sans modifier les valeurs ni déplacer la résolution combat.

Aucun raccord runtime n'est effectué dans cet audit.

## Snapshot V110 actuellement actif

`buildHeroSnapshot()` compose aujourd'hui plusieurs catégories.

### 1. Définitions et valeurs canoniques

Pour chaque définition active :
- V110 lit `GensCleanRpgStats167874.runtimeDefs()` ;
- V110 appelle `GensCleanRpgStats167874.value(hero,id)` ;
- il produit `canonical[]` et `values{}`.

Ce rôle correspond structurellement au snapshot Core S7, mais le pipeline Core
S3/S4/S5 n'est pas encore raccordé au runtime Tactical.

### 2. Données session qui doivent rester hors Core S7

V110 compose :
- `maxHp` depuis acteur / `effectiveMaxWounds` ;
- `hp` depuis acteur ou wounds ;
- `mana` courant depuis l'état héros ;
- `resistances` depuis les formes runtime/record ;
- `rules.criticalMultiplier` depuis les règles Dungeon ;
- timestamp/version V110.

Ces données ne doivent pas être absorbées dans le snapshot pur S7.

### 3. Valeurs canoniques utilisées directement par V110

V110 préfère actuellement `values.*` pour :
- movement ;
- initiative ;
- defense ;
- armor.

Les helpers Dungeon correspondants ne sont que des fallbacks si la valeur
canonique n'est pas finie/présente.

Conséquence :
- movement/defense/armor peuvent à terme venir de `S7.values` ;
- ils ne doivent pas être transformés en nouvelles dérivées Core ;
- le comportement de l'initiative demande une caractérisation spécifique.

### 4. Dérivées relues depuis Dungeon

V110 relit encore directement :
- `dungeonDodgeChance` ;
- `dungeonCriticalChance` ;
- `dungeonMagicResistance` ;
- `dungeonMaxMana` ;
- `dungeonPhysicalDamageBonus` ;
- `dungeonMagicDamageBonus`.

Ces six valeurs appartiennent au sous-ensemble déjà modélisé par S6/S7.

## Correspondance Core disponible

S6 produit :
- physicalDamageBonus ;
- magicDamageBonus ;
- hpBonus ;
- maxMana ;
- crit ;
- dodge ;
- initiative ;
- magicResistance.

S7 transporte immuablement exactement ce sous-ensemble avec les valeurs
canoniques.

Les candidates naturelles au remplacement de relecture V110 sont donc :
- physicalDamageBonus ;
- magicDamageBonus ;
- maxMana ;
- crit ;
- dodge ;
- magicResistance.

Mais leur remplacement n'est autorisé qu'après une fixture runtime qui construit
les entrées S3/S4/S5/S6 de façon identique aux propriétaires historiques.

## Piège prouvé : initiative

V110 actuel fait conceptuellement :

`initiative = values.initiative ?? dungeonDerivedInitiative()`.

Or :
- `GensCleanRpgStats167874.value(...,"initiative")` fournit la valeur canonique
  et les effets `stat:initiative` ;
- le wrapper historique `dungeonDerivedInitiative` ajoute en plus
  `extraTotal("initiative")` ;
- S6 `derived.initiative` reproduit ce second chemin avec l'effet
  `initiative`.

Donc remplacer directement `values.initiative` par
`S7.derived.initiative` pourrait changer le Tactical pour les profils qui
utilisent un effet cible `initiative`.

Aucun raccord initiative n'est autorisé avant une sentinelle dédiée.

## Autre contrainte : ordre de chargement

Les modules :
- stats-value-engine-v1 ;
- stats-hero-values-v1 ;
- stats-modifier-provider-v1 ;
- stats-derived-values-v1 ;
- stats-snapshot-v1

restent actuellement Phase 4 inert et ne sont pas injectés dans la composition
Pages/preview.

Seule la normalisation Core est déjà chargée dans cette chaîne.

Le raccord doit donc traiter explicitement :
1. ordre de chargement ;
2. dépendances Core ;
3. fallback sûr si l'API Core n'est pas disponible pendant un audit ;
4. absence de deuxième implémentation locale dans V110.

## Frontière autorisée

Core :
- normalisation ;
- calcul des valeurs à partir d'entrées explicites ;
- composition des modifiers à partir de sources explicites ;
- dérivées S6 ;
- snapshot S7 immutable.

Adaptateur runtime / Stats owner :
- collecte des définitions ;
- runtime attributes / définitions héros ;
- sources Equipment/Talents/Challenge explicites ;
- règles Dungeon explicites ;
- effets Stats explicites ;
- base HP explicite.

V110 :
- ajoute uniquement les données session/combat Tactical ;
- reçoit le snapshot Core ;
- applique les champs nécessaires à l'acteur.

Tactical final :
- arme/type ;
- hit ;
- résistances ;
- armure/floor ;
- critique ;
- dégâts finaux ;
- mutation PV.

## Prochaine sentinelle obligatoire

Avant un RED de raccord production, créer une caractérisation qui compare sur
les mêmes fixtures :
1. snapshot V110 historique ;
2. pipeline S3/S4/S5/S6/S7 pur alimenté explicitement ;
3. canonical/values ;
4. physicalDamageBonus ;
5. magicDamageBonus ;
6. maxMana ;
7. crit ;
8. dodge ;
9. magicResistance ;
10. cas initiative avec et sans effet cible `initiative`.

La sentinelle doit mesurer les appels aux six helpers dérivés Dungeon afin de
prouver ensuite leur suppression réelle.

## État

Audit initial du raccord : ouvert.

Aucun fichier gameplay modifié.
Aucun `index.html` modifié.
Aucun changement sur `main`.
