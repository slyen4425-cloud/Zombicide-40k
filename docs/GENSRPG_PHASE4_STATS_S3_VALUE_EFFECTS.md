# GenSrpG — Phase 4 Core Stats — S3 Moteur pur value/effects

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s3-value-effects-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s3-value-effects-2026-09-21`.
- Base exacte / dernier GREEN : `128d80747a9987dd8b90dc72508dae9707f23aab`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-stats-s2-authority-raccord-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Extraire le calcul pur valeur/effets de Core Stats sans déplacer encore les
providers de données ni l'autorité runtime.

Nouveau fichier prévu :
`assets/gensrpg/core/stats-value-engine-v1.js`.

Global :
`GensStatsValueEngineV1`.

Dépendance pure :
`GensStatsNormalizationV1`.

## Entrée du moteur

```text
StatsValueEngineConfig {
  definitions: StatDefinition[]
  active: string[]
  baseValues: Record<string, number>
  modifiers: StatModifier[]
  effects: StatEffect[]
  directValueTargets: string[]
}
```

Les données sont fournies explicitement.
Le Core ne va jamais les chercher dans Dungeon, Inventory ou le profil courant.

## StatModifier S3

```text
StatModifier {
  id?: string
  target: string
  value: number
  source?: string
  enabled?: boolean
}
```

Sémantique :
- target canonisé ;
- value numérique additif ;
- enabled vaut true sauf false explicite ;
- source et id servent uniquement au détail explicatif ;
- target absent -> ligne ignorée.

S3 ne donne aucune signification métier aux sources :
equipment/talent/challenge sont des responsabilités de futurs providers.

## Base

Pour une stat active connue :

```text
rawBase = clamp(baseValues[id] ?? definition.defaultValue, min, max)
baseValue = rawBase + somme(modifiers actifs ciblant id)
```

Important :
`baseValue` n'est pas re-clampé après les modificateurs, afin de conserver la
sémantique actuelle des cycles. Le clamp final intervient dans `value`.

## Valeur canonique pure

```text
si definition absente ou stat inactive -> 0
si id déjà dans seen -> baseValue(id)

total =
  baseValue(id)
  + somme effets target stat:<id>
  + somme effets target <id> si id est explicitement dans directValueTargets

value = clamp(total, min, max)
```

`directValueTargets` est une entrée explicite pour ne pas graver dans le Core
les particularités historiques Dungeon de defense/armor/movement.

Le futur adaptateur pourra fournir exactement les cibles nécessaires.

## Effets

Le moteur réutilise le contrat S2 :

step :
```text
floor(sourceValue / max(1, step)) * gain
```

threshold :
```text
compare(sourceValue, comparator, threshold) ? gain : 0
```

La valeur source est résolue par le même moteur avec propagation du set `seen`.

## Cycle

Parité historique obligatoire :
si une récursion stat -> stat revient sur un ID déjà présent dans `seen`,
le moteur renvoie `baseValue(id)`, et non 0 ni la dernière valeur partielle.

## API

### `create(config)`

Retourne une instance pure.

### `baseValue(id)`

Base clampée + modifiers.

### `modifierTotal(id)`

Somme des lignes de modificateurs actives.

### `value(id, seen?)`

Valeur finale canonique pure.

### `effectAmount(effect, seen?)`

Contribution d'un effet avec résolution de sa source.

### `statEffectTotal(id, seen?)`

Somme des effets `stat:<id>`.

### `extraTotal(target, seen?)`

Somme des effets activés vers une cible dérivée/directe.

### `sourceEffectTotal(target, source, seen?)`

Même somme filtrée sur une source canonique.

### `detail(id)`

Objet sans DOM donnant au minimum :
- id ;
- active ;
- definition ;
- rawBase ;
- modifiers et modifierTotal ;
- baseValue ;
- statEffects ;
- directEffects ;
- subtotal avant clamp ;
- total final ;
- clamped.

Le détail est explicatif uniquement et doit retourner le même total que `value(id)`.

## Hors périmètre

Aucune lecture de :
- window.CHARS ;
- state ;
- profil courant ;
- Inventory ;
- Equipment ;
- Talents ;
- Challenges ;
- localStorage ;
- DOM.

Aucun :
- timer ;
- retry ;
- MutationObserver ;
- wrapper ;
- cache ;
- snapshot Tactical.

Aucune formule :
- Armor reduction ;
- hit final ;
- Défense/Esquive appliquées ;
- couvert ;
- résistances appliquées ;
- dégâts finaux ;
- critique final ;
- HP/mana courants.

## Autorité

S3 est un lot d'extraction **inert**.

Le runtime continue d'utiliser :
`GensCleanRpgStats167874.value()`.

Le nouveau service n'est ajouté ni à GitHub Pages ni à preview.
Il doit être explicitement classé Phase 4 inert dans la cartographie.

Un futur raccord sera un lot distinct après GREEN.

## TDD

Sentinelle prévue :
`tests/gens_phase4_stats_s3_value_effects_parity_v1.test.cjs`.

La sentinelle construit un scénario historique via
`GensCleanRpgStats167874`, puis fournit au moteur pur :
- les mêmes définitions ;
- les mêmes statuts active ;
- les valeurs de base pré-provider ;
- des modifiers reproduisant equipment/talent/challenge ;
- les mêmes effets ;
- les cibles directes historiques nécessaires.

Cas obligatoires :
1. base seule ;
2. plusieurs modifiers ;
3. effet stat -> stat ;
4. effet vers dérivée ;
5. threshold ;
6. clamp ;
7. source alias ;
8. cycle ;
9. sourceEffectTotal ;
10. détail explicatif.

## RED attendu

La sentinelle et son étape CI sont ajoutées avant
`stats-value-engine-v1.js`.

Le premier run doit échouer pour fichier Core absent.

## Critère de sortie

S3 est GREEN uniquement si :
- RED attendu observé ;
- moteur pur créé ;
- parité valeur/effets prouvée sur les fixtures ;
- detail cohérent ;
- aucun global/runtime interdit ;
- service classé inert ;
- propriétaire runtime historique inchangé ;
- Architecture+navigateur, Firefox et Tactical Dock GREEN sur le HEAD documentaire final ;
- checkpoint S3 créé.

## Suite

Après S3 GREEN :
S4 — provider de valeurs héros
`hero definition + runtime attributes -> baseValues`.

S4 sera séparé du moteur pur et Core Stats ne devra toujours pas lire directement
`CHARS` ou `state`.
