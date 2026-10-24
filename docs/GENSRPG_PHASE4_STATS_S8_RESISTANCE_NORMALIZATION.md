# GenSrpG — Phase 4 Core Stats — S8 normalisation des résistances

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s8-resistance-normalization-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-stats-s8-resistance-normalization-2026-09-21`.
- Base exacte / dernier GREEN :
  `e7443fbaf1bffb8f53685cc33d7af5858a54db4e`.
- Checkpoint précédent :
  `checkpoint/gensrpg-phase4-stats-s7-core-snapshot-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

S8 extrait uniquement un contrat **pur de normalisation de données de
résistances** capable de représenter les deux formes historiques actives :

```text
tableau générique : [{kind:"element:fire", value:25}, ...]
objet Tactical     : {fire:25, ...}
```

Le lot ne décide jamais comment une résistance réduit des dégâts.

Fichier Core prévu :
`assets/gensrpg/core/stats-resistance-normalization-v1.js`.

Global prévu :
`GensStatsResistanceNormalizationV1`.

Le module reste **Phase 4 inert**.

## Source inline exacte

Le `index.html` du HEAD S8 reste :
- taille : `8 174 580` octets ;
- blob Git : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Il est bit à bit identique au fichier utilisateur déjà vérifié pour S6.
La règle 26 est donc satisfaite sans nouveau transfert.

## Producteur générique actif

Le monolithe possède `gensNormalizeResistances(v)`.

Comportement historique :
- accepte uniquement un tableau ;
- conserve l'ordre ;
- conserve les doublons ;
- `kind` est seulement converti en chaîne, sans alias ;
- ligne sans kind -> supprimée ;
- `value` non numérique -> 0 ;
- chaque valeur est clampée entre -1000 et 1000.

L'éditeur héros sauvegarde la valeur au niveau héros dans :
`hero.resistances`.

La forme produite par l'éditeur est :
`[{kind,value}, ...]`.

Les éditeurs d'objets, ennemis, entités et compétences réutilisent le même
éditeur de résistances générique.

Les tableaux Capture `elementResistances` / `elementWeaknesses` contenant
uniquement des IDs d'éléments sont une autre représentation métier. S8 ne doit
jamais les interpréter comme des pourcentages.

## Application générique historique

`gensResistanceMultiplier(resistances,damageType,element)` relit le tableau
normalisé puis :
- additionne toutes les lignes `physical` ou `magic` correspondant au type ;
- additionne toutes les lignes `element:<id>` correspondant à l'élément ;
- les doublons sont donc **additifs** ;
- le multiplicateur final reste une responsabilité combat et n'entre pas dans S8.

Cette sémantique explique pourquoi S8 ne peut pas écraser silencieusement les
doublons d'un tableau.

## Consommateur Tactical V110 actif

`gens-rpg-tactical-combat-v2-integration.js` charge activement
`gens-rpg-tactical-combat-v2-stats-1678110.js`.

V110 contient :

### normalizeResistanceKey

Normalisation :
- trim + lowercase ;
- suppression des accents ;
- aliases historiques :
  feu/fire -> fire,
  eau/water -> water,
  terre/earth -> earth,
  lumiere/light -> light,
  ombre/shadow -> shadow,
  air -> air,
  electricite/electric/electricity/lightning -> electric ;
- autre clé -> conservée normalisée.

### collectResistanceObjects

Comportement :
- ignore toute source qui n'est pas un objet simple ;
- **ignore explicitement les tableaux** ;
- valeur non finie -> ignorée ;
- valeur clampée [-100,100] ;
- collision de clé normalisée -> la dernière entrée gagne ;
- entre plusieurs sources -> une source plus tardive gagne.

### resistanceSnapshot héros

Ordre historique des sources :
1. state.resistances ;
2. state.rpgResistances ;
3. state.elementResistances ;
4. state.elements.resistances ;
5. record.resistances ;
6. record.rpgResistances ;
7. record.elementResistances ;
8. record.elements.resistances.

Une source plus tardive écrase donc une clé précédente.

### enemySnapshot

Ordre historique :
1. derived.resistances ;
2. derived.elementResistances ;
3. definition.resistances ;
4. definition.elementResistances ;
5. definition.rule.resistances.

Même règle : dernière source gagnante.

## Divergence prouvée

Le format générique réel :
`[{kind:"element:fire",value:25}]`

n'est pas lu par V110 car :
- c'est un tableau ;
- la clé générique contient le préfixe `element:` ;
- V110 attend un objet tel que `{fire:25}`.

Cette divergence est une incompatibilité de **transport de données**, pas une
raison de modifier les dégâts.

## Contrat Core S8

### Représentation canonique

La représentation commune est une suite ordonnée immuable :

```text
ResistanceEntry {
  key: string
  value: number
}
```

Pourquoi une suite et non directement un objet :
- elle préserve les doublons du format générique ;
- elle préserve l'ordre des sources Tactical ;
- aucune stratégie de fusion gameplay n'est cachée dans la normalisation.

### Clé commune

`element:<id>` devient la clé élémentaire canonique `<id>`.

Exemples :
- `element:fire` -> `fire` ;
- `element:feu` -> `fire` ;
- objet `{feu:25}` -> `fire` ;
- `element:psy` -> `psy`.

Les aliases historiques V110 sont conservés.

### API prévue

`normalizeKey(value)`
- produit la clé canonique commune ;
- aucune règle de dégâts.

`normalize(input, options?)`
- accepte tableau de lignes ou objet clé -> valeur ;
- retourne des `ResistanceEntry` ordonnées et immuables ;
- tableau de chaînes Capture -> aucune entrée numérique ;
- ne fusionne aucun doublon.

Options de transport explicites :
- `invalid: "skip" | "zero"` ;
- `min` ;
- `max`.

Ces paramètres sont des paramètres de compatibilité fournis par l'adaptateur,
pas des règles gameplay codées en dur dans Core.

Par défaut :
- valeur non finie -> ignorée ;
- aucun clamp.

`collapse(entries,{strategy})`
- `strategy:"sum"` : projection additive explicite ;
- `strategy:"last"` : projection dernière valeur gagnante explicite ;
- retourne un objet immuable.

Aucune stratégie n'est choisie implicitement.

## Parités à démontrer

### Projection générique historique

Avec :
`invalid:"zero", min:-1000, max:1000`

la valeur et l'ordre des lignes doivent correspondre à
`gensNormalizeResistances`, puis :
- `collapse(...,{strategy:"sum"})` conserve l'effet des doublons additifs.

### Projection V110 historique

Avec :
`invalid:"skip", min:-100, max:100`

et les sources concaténées dans leur ordre historique :
- `collapse(...,{strategy:"last"})` doit produire le même objet que
  `collectResistanceObjects`.

### Convergence array/object

Pour une résistance équivalente :
- `[{kind:"element:fire",value:25}]`
- `{fire:25}`
- `{feu:25}`

la représentation commune doit exposer la même clé `fire` et la même valeur.

## Frontières strictes

S8 ne doit pas :
- appeler `gensResistanceMultiplier` ;
- appeler `resistanceFor` ;
- appeler `adjustedDamage` ;
- appliquer un pourcentage ;
- calculer un multiplicateur ;
- posséder magicResistance flat ;
- décider Armor / hit / D100 / critique ;
- lire CHARS/state/profil/inventaire ;
- lire DOM/localStorage ;
- installer wrapper/observer/timer/retry ;
- modifier le snapshot S7 ;
- modifier Tactical.

## TDD

Avant le fichier Core :
1. extraire le vrai `gensNormalizeResistances` depuis le `index.html` courant ;
2. instrumenter le vrai V110 pour exposer uniquement
   `normalizeResistanceKey` et `collectResistanceObjects` comme oracle de test ;
3. vérifier les deux politiques historiques par options explicites ;
4. vérifier la convergence array/object ;
5. vérifier doublons, aliases, invalides, bornes et source order ;
6. vérifier immutabilité et absence de mutation ;
7. brancher la sentinelle Architecture ;
8. observer RED uniquement parce que le fichier Core manque ;
9. seulement ensuite créer le module.

## Critère de sortie

S8 GREEN uniquement si :
- RED attendu observé ;
- normaliseur pur créé ;
- parités array/object démontrées ;
- aucune formule de dégâts déplacée ;
- service classé Phase 4 inert ;
- graphe production inchangé ;
- Architecture + navigateur complet, Firefox et Tactical Dock GREEN sur le SHA
  documentaire final ;
- checkpoint S8 créé.

## Suite

Après S8 GREEN :
S9 — contrat Armure, sur un lot distinct.

Aucune décision Armor n'est incluse dans S8.


## Validation technique S8

Chaîne TDD observée :
- RED : commit `f0ea7ad0d3ef12d3483465ebeba1ec3227a019b5` ;
- Architecture `35587505339` — FAILURE attendu sur l'étape S8 ;
- cause exacte : `ENOENT assets/gensrpg/core/stats-resistance-normalization-v1.js` ;
- Firefox `35587505241` — SUCCESS ;
- Tactical Dock `35587505324` — SUCCESS.

Extraction :
- module pur ajouté au commit `e123d195dbc06b892db82c5a56e629b14affd72b` ;
- classification explicite Phase 4 inert au commit
  `e55c6efb03c4c57b89c805d0ec3b453207b9a729` ;
- correction de l'attente de test additive/clamp au commit
  `e109ef34ef45941347f6e9d1f27cafc8827857b5`.

Validation du HEAD technique `e109ef34ef45941347f6e9d1f27cafc8827857b5` :
- Architecture + navigateur complet `35589043087` — SUCCESS ;
- Firefox `35589043070` — SUCCESS ;
- Tactical Dock `35589043075` — SUCCESS.

Le diff S8 depuis la base S7 reste limité au contrat/documentation, au test TDD,
au branchement CI du test, à la classification du graphe et au nouveau module
Core inert. Aucun fichier Tactical, Dungeon gameplay ou `index.html` n'a été
modifié.

Le module :
- normalise tableaux et objets vers des entrées immuables ;
- ne choisit aucune stratégie de fusion implicitement ;
- exige `sum` ou `last` explicitement lors de la projection ;
- conserve les politiques historiques via options fournies par l'adaptateur ;
- ne contient aucune application de résistance aux dégâts.

## Clôture

S8 est techniquement GREEN. Le SHA documentaire final doit repasser les trois
batteries avant création du checkpoint GREEN.

Après ce checkpoint, ouvrir S9 — contrat Armure — sur une branche dédiée, sans
réutiliser la branche S8 et sans modifier les formules avant caractérisation.
