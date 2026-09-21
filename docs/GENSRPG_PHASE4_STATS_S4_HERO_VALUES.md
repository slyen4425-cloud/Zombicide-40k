# GenSrpG — Phase 4 Core Stats — S4 Provider valeurs héros

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s4-hero-values-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s4-hero-values-2026-09-21`.
- Base exacte / dernier GREEN : `d6d186fa48d417e76ff8a51dbdb0e67b3be1a00b`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-stats-s3-value-effects-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Extraire uniquement la résolution pure des valeurs héros qui alimentent
`baseValues` du moteur S3.

Nouveau fichier prévu :
`assets/gensrpg/core/stats-hero-values-v1.js`.

Global :
`GensStatsHeroValuesV1`.

Dépendance pure :
`GensStatsNormalizationV1`.

Le module reste volontairement **inert** en production pendant S4.

## Source historique caractérisée

Le propriétaire runtime reste :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

S4 reproduit uniquement la partie valeur héros de :
- `specialRaw(hero,id)` ;
- `customBase(hero,id)`.

S4 ne reprend pas `specialBaseTotal()` ni `baseValue()`, car ces fonctions
ajoutent déjà des modificateurs Equipment / Talents / Challenges qui
appartiennent au futur S5.

## Entrée

```text
HeroValuesConfig {
  definitions: StatDefinition[]
  definitionValues: Record<string, number>
  runtimeValues: Record<string, number> | null
  fallbackValues: Record<string, number>
  clampWithoutRuntime: string[]
}
```

Toutes les données sont explicites.
Le provider ne lit jamais `CHARS`, `state`, le héros courant ou un profil.

Les clés des trois tables de valeurs sont canonisées par
`GensStatsNormalizationV1.canon()`, donc les aliases déjà autorisés par S2
restent valides.

## Priorité de résolution

Pour chaque définition normalisée :

1. valeur runtime finie si un conteneur `runtimeValues` existe ;
2. sinon valeur héros `definitionValues` finie ;
3. sinon valeur `fallbackValues` finie ;
4. sinon `definition.defaultValue`.

Une valeur est considérée finie avec la même sémantique numérique historique :
`Number(value)` doit être fini.

## Clamp historique

Le point subtil de parité est volontairement piloté par les données.

Si `runtimeValues` est un objet :
- la valeur finalement choisie est clampée entre `min` et `max`, même si la
  valeur runtime elle-même est absente et qu'une valeur de définition/fallback
  est utilisée.

Si `runtimeValues === null` :
- la valeur choisie n'est pas clampée par défaut ;
- seules les stats listées explicitement dans `clampWithoutRuntime` sont
  clampées.

Cette entrée permet à l'adaptateur futur de reproduire la distinction historique
des stats natives sans graver `defense`, `armor`, `movement` ou tout autre
ID métier dans le Core.

## Sortie

`GensStatsHeroValuesV1.resolve(config)` retourne :

```text
{
  baseValues: Record<string, number>,
  details: Record<string, {
    id,
    source,          // runtime | definition | fallback | default
    inputKey,
    rawValue,
    value,
    min,
    max,
    runtimeContainer,
    clampApplied,
    clamped
  }>
}
```

`baseValues` est directement consommable par S3.

Le détail est explicatif ; il doit permettre de prouver la provenance de la
valeur et si un clamp a réellement changé le résultat.

## Pureté / immutabilité

Le provider :
- ne mute ni definitions ni aucune table d'entrée ;
- ne crée aucun état runtime ;
- n'écrit aucun fallback dans `runtimeValues` lorsqu'une valeur manque ;
- ne lit aucun DOM ou stockage ;
- n'utilise aucun timer, retry, observer, listener ou wrapper.

## Hors périmètre

S4 ne contient aucune connaissance :
- Equipment ;
- Talents ;
- Challenges ;
- effets stat -> stat ;
- dérivées ;
- progression ;
- Armor ;
- toucher ;
- D100 ;
- résistances ;
- dégâts finaux ;
- Tactical ;
- UI ;
- stockage.

Aucune autorité runtime n'est déplacée dans ce lot.

## TDD

Sentinelle :
`tests/gens_phase4_stats_s4_hero_values_parity_v1.test.cjs`.

Elle instrumente les helpers lexicaux historiques sans changer leur logique et
compare le provider pur sur :
1. héros actif avec valeurs runtime ;
2. aliases runtime ;
3. valeur runtime manquante avec fallback sur définition héros ;
4. stat custom au-dessus du max avec runtime ;
5. héros sans runtime ;
6. différence clamp / non-clamp sans runtime ;
7. fallback mouvement explicite ;
8. fallback defaultValue ;
9. détails de provenance et de clamp ;
10. absence de mutation ;
11. absence de noms métier spéciaux codés dans le provider.

## RED attendu

La sentinelle et son étape Architecture sont ajoutées avant
`stats-hero-values-v1.js`.

Le premier run doit échouer parce que le fichier Core S4 est absent.

## Critère de sortie

S4 est GREEN uniquement si :
- RED attendu observé ;
- provider pur créé ;
- parité des valeurs héros prouvée ;
- aliases et provenance prouvés ;
- clamp runtime / no-runtime prouvé ;
- aucune mutation ;
- aucun ID métier spécial gravé dans le Core ;
- service classé Phase 4 inert ;
- propriétaire historique inchangé ;
- Architecture + navigateur, Firefox et Tactical Dock GREEN sur le HEAD
  documentaire final ;
- checkpoint S4 créé.

## Suite

Après S4 GREEN :
S5 — providers de modificateurs Equipment / Talents / Challenges.

S5 doit rester séparé de S6 dérivées et des futurs domaines Tactical / Armor /
Hit / résistances.


## Résultat S4

### RED TDD observé

Commit pré-provider :
`5ca16a97bb02aecdc5880da2d8f8f0cd2a080b98`.

Run Architecture :
`35575341495` — FAILURE attendu.

L'échec se produit exactement à l'étape :
`Vérifier la parité du provider valeurs héros Core Stats S4`.

Cause exacte :
`ENOENT` sur
`assets/gensrpg/core/stats-hero-values-v1.js`.

Les 100 étapes Architecture précédentes, dont S1, S2, raccord S2 et S3, avaient
passé SUCCESS avant ce RED.

### Provider pur créé

Fichier :
`assets/gensrpg/core/stats-hero-values-v1.js`.

Commit :
`c8d21f488b43c3160465b34c1f5b4822fc37b523`.

API :
`GensStatsHeroValuesV1.resolve(config)`.

Le provider :
- normalise les définitions via S2 ;
- canonise les clés de valeurs via S2 ;
- applique la priorité runtime -> définition -> fallback -> default ;
- applique le clamp à toute valeur retenue quand le conteneur runtime existe ;
- n'applique hors runtime que les clamps explicitement demandés ;
- retourne `baseValues` et les détails de provenance/clamp ;
- ne mute aucune entrée.

### Parité démontrée

La sentinelle compare directement le provider aux helpers historiques
`specialRaw()` et `customBase()`.

Cas verrouillés :
- runtime actif ;
- aliases `strength -> force` et `move -> movement` ;
- valeur runtime manquante ;
- valeur héros au-dessus du max avec conteneur runtime ;
- héros sans runtime ;
- clamp explicite / non-clamp sans runtime ;
- fallback de mouvement explicite ;
- defaultValue ;
- provenance ;
- absence de mutation.

Le provider ne contient aucun ID historique spécial codé en dur.
La distinction nécessaire est apportée uniquement par
`clampWithoutRuntime`.

### Graphe Phase 2

Commit :
`fc06b2e01ce19a22539f919514a7f22bf7f9dd5a`.

`stats-hero-values-v1.js` est classé **Phase 4 inert**.

Inventaire JS physique :
`84 -> 85`.

Le graphe production reste inchangé.
Le provider n'est chargé ni par Pages ni par `preview.html`.

### Validation GREEN technique

HEAD technique :
`fc06b2e01ce19a22539f919514a7f22bf7f9dd5a`.

Runs :
- Architecture + navigateur complet : `35575443549` — SUCCESS ;
- Firefox : `35575443531` — SUCCESS ;
- Tactical Dock : `35575443522` — SUCCESS.

Le navigateur complet valide notamment :
- Survie ;
- Fouiller + arts ;
- Dungeon après Survie ;
- Builder ;
- Config objet ;
- fiche RPG sans flash Survie ;
- caches/pièges authored ;
- Save & Quit / reprise ;
- PvP ;
- Capture ;
- non-interférence quatre modules ;
- murs ;
- preview ;
- resolver d'assets et tokens tardifs.

Aucun propriétaire runtime historique, aucune règle gameplay, aucun stockage,
aucune UI et aucun snapshot Tactical n'a été modifié.

## Clôture documentaire

Le SHA documentaire final doit repasser Architecture + navigateur complet,
Firefox et Tactical Dock.

Après trois SUCCESS :
- créer `checkpoint/gensrpg-phase4-stats-s4-hero-values-green-2026-09-21` ;
- ouvrir ensuite un lot S5 séparé pour les providers de modificateurs
  Equipment / Talents / Challenges ;
- ne pas commencer S6 dérivées ni Tactical / Armor / Hit dans S5.
