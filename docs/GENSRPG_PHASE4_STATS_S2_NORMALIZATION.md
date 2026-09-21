# GenSrpG — Phase 4 Core Stats — S2 Normalisation pure

Date : 2026-09-21

- Branche : `work/gensrpg-phase4-stats-s2-normalization-2026-09-21`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s2-normalization-2026-09-21`.
- Base exacte / dernier GREEN : `56c9889dbebf84281f11ed995bb442889ffc6812`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-stats-s1-contracts-green-2026-09-21`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Objet

Créer le premier composant Core Stats **pur** à partir des contrats verrouillés par S1.

S2 ne bascule pas encore l'autorité runtime. Le fichier historique
`assets/gensrpg/gens-rpg-stats-clean-167874.js` reste l'unique propriétaire actif.

Le nouveau module sera :
`assets/gensrpg/core/stats-normalization-v1.js`.

Global d'API :
`GensStatsNormalizationV1`.

## Pourquoi le module reste inactif en S2

La charte interdit de créer une deuxième autorité active ou un fallback permanent.

La séquence sûre est donc :

1. caractériser les fonctions internes historiques ;
2. créer le module Core pur ;
3. démontrer la parité ;
4. valider toute la batterie ;
5. seulement dans un lot ultérieur, raccorder le propriétaire historique au Core
   et supprimer les duplications devenues inutiles.

S2 est une **extraction de code pur**, pas encore un transfert d'autorité runtime.

## API S2

### `slug(value)`

Même transformation historique :
- string ;
- trim ;
- lowercase ;
- suppression des diacritiques NFD ;
- suppression des caractères hors `[a-z0-9_ -]` ;
- espaces/tirets -> underscore ;
- underscores de bord retirés.

### `canon(id)`

Même table d'alias historique :
- agility -> agilite ;
- spirit -> esprit ;
- strength -> force ;
- dexterity -> agilite ;
- wisdom -> esprit ;
- constitution -> endurance ;
- defence -> defense ;
- armour -> armor ;
- move -> movement.

Important :
`canon` ne slugifie pas implicitement. Les callsites historiques choisissent
explicitement quand appeler `slug` avant `canon`.

### `normalizeDefinition(definition)`

Parité avec `normDef` :
- null/undefined -> null ;
- ID = `canon(slug(id || name))` ;
- ID vide -> null ;
- min numérique, fallback 0 ;
- max numérique, fallback 999, jamais < min ;
- defaultValue numérique puis clamp [min,max] ;
- name/icon/description stringifiés ;
- visible true sauf false explicite.

### `isValidTarget(target)`

Accepte :
- toutes les cibles dérivées S1 ;
- toute chaîne commençant par `stat:`.

### `normalizeEffect(effect,index)`

Parité avec `normEffect` :
- null/undefined -> null ;
- source = `canon(effect.source)` sans slug implicite ;
- cible invalide ou source vide -> null ;
- ID explicite sinon `effect_<index+1>` ;
- mode seulement `threshold` ou fallback `step` ;
- step >= 1 ;
- gain numérique ;
- threshold fallback 10 ;
- comparator dans gt/gte/lt/lte/eq, sinon gt ;
- enabled true sauf false explicite.

### `compare(value,comparator,threshold)`

Même sémantique :
- gte -> >= ;
- lte -> <= ;
- lt -> < ;
- eq -> === ;
- tout autre -> >.

### `effectContribution(effect,sourceValue)`

Fonction pure préparatoire :
- effet disabled -> 0 ;
- threshold -> compare ? gain : 0 ;
- step -> `floor(sourceValue/max(1,step))*gain`.

Elle ne va jamais chercher la source elle-même.
Le futur moteur de valeur lui fournira explicitement `sourceValue`.

## Hors périmètre

Aucun des éléments suivants ne doit apparaître dans le module Core S2 :

- DOM/document ;
- localStorage ;
- profile courant ;
- `CHARS` ;
- `state` ;
- équipement ;
- talents ;
- challenges ;
- save/load ;
- wrappers ;
- MutationObserver ;
- timers/retries ;
- UI ;
- Tactical ;
- formule d'armure ;
- formule de toucher ;
- résistances ;
- snapshot ;
- `value(hero,id)`.

## TDD

Sentinelle :
`tests/gens_phase4_stats_s2_normalization_parity_v1.test.cjs`.

Le test instrumente **uniquement en mémoire** le fichier historique pour exposer :
- `slug` ;
- `canon` ;
- `normDef` ;
- `targetValid` ;
- `normEffect` ;
- `compare`.

Le fichier du dépôt n'est pas modifié pour cette instrumentation.

La sentinelle compare le nouveau Core à l'historique sur :
- aliases ;
- accents / caractères / espaces pour slug ;
- définitions nulles, custom, bornes invalides et conversions ;
- cibles valides/invalides ;
- effets step/threshold ;
- source alias ;
- fallback ID ;
- step <= 0 ;
- comparateur invalide ;
- enabled false ;
- comparaisons ;
- contribution pure step/threshold.

## RED attendu

Le test et son étape CI sont ajoutés **avant** le fichier Core.
Le premier run doit échouer parce que
`assets/gensrpg/core/stats-normalization-v1.js` n'existe pas encore.

Ce RED prouve que la future réussite dépend réellement de l'extraction.

## Critère de sortie

S2 est GREEN uniquement si :
- le RED attendu a été observé ;
- le module Core pur existe ;
- parité complète avec les fonctions historiques testées ;
- aucune dépendance runtime interdite dans le Core ;
- aucun propriétaire actif n'a été changé ;
- aucun changement de gameplay ;
- Architecture + navigateur complet, Firefox et Tactical Dock sont GREEN sur le
  HEAD documentaire final ;
- checkpoint GREEN S2 créé.

## Suite

Après S2 GREEN, le prochain lot doit décider le **raccord d'autorité** des fonctions
de normalisation vers le Core, ou préparer S3 moteur pur selon la frontière la plus
sûre établie par les sentinelles.

Aucun raccord implicite ou fallback permanent ne doit être ajouté.
