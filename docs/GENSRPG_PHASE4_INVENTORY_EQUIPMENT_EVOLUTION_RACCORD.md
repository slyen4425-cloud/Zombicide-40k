# GenSrpG — Phase 4 Core Inventory / Equipment — raccord évolution

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-evolution-raccord-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-evolution-raccord-2026-09-21`.
- Base exacte :
  `deb165f8588d2ae4ecb4b6dbfcea536f5073f81b`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-evolution-contract-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet du lot

Raccorder le calcul pur d'évolution Equipment au service :

`assets/gensrpg/core/equipment-evolution-v1.js`

sans déplacer ni modifier le cache Equipment, son TTL ou ses invalidateurs.

## Autorité runtime

Le propriétaire runtime existant reste :

`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`.

La frontière raccordée est :

`cachedEvolutionBonus(key)`.

Cette fonction reste propriétaire de :

- `combatCacheContext()` ;
- la clé `context|stat` ;
- `equipmentBonusCache` ;
- `CACHE_TTL_MS = 120` ;
- `equippedItemsCached()` ;
- la normalisation du XP runtime ;
- la lecture et l'écriture du cache.

Sur un cache miss, le calcul est désormais délégué à :

`GensEquipmentEvolutionV1.totalBonus(items,key,xp)`.

Le calcul local historique :

`evolutionBonusForItem(item,key,xp)`

peut rester exposé temporairement pour compatibilité et caractérisation,
mais il n'est plus appelé par le chemin runtime actif du cache évolution.

## Chaîne conservée

La chaîne Equipment reste :

1. `GensEquipmentBonusSetsV1` : bonus directs + sets ;
2. `cachedEvolutionBonus` : frontière cache évolution ;
3. `GensEquipmentEvolutionV1` : calcul pur sur cache miss ;
4. cache performance global ;
5. Core Stats S5 consomme `dungeonEquipmentBonus`.

Aucun nouveau wrapper `dungeonEquipmentBonus` n'a été ajouté.

## Composition

Le service Core évolution est désormais connecté :

- GitHub Pages : chargé ;
- preview : même ordre de chargement ;
- PWA : précaché ;
- Phase 2 : classé **connected** ;
- manifeste runtime : owner `GenSrpG Core Equipment Evolution`.

Ordre verrouillé :

`equipment-bonus-sets-v1.js`
→ `equipment-evolution-v1.js`
→ chargeur du cleanup Equipment.

Métriques descriptives après raccord :

- Pages injectés : 29 ;
- JS directs production uniques : 32 ;
- graphe production : 76 fichiers atteignables ;
- inventaire physique : 93 JS ;
- services Phase 4 connus : 13.

## TDD

RED de raccord :

- run Architecture : `35630671656` ;
- le contrat pur évolution passe ;
- échec exact du nouveau raccord :
  `Pages must publish the Core Equipment evolution service`.

La fixture VM Stats a d'abord été réalignée pour déclarer explicitement
`stats-normalization-v1.js`, conformément au garde de dépendance existant.

## Validation d'exécution

La sentinelle de raccord exécute `cachedEvolutionBonus` en VM.

Elle verrouille :

- premier miss : appel Core exactement une fois ;
- hit avant 120 ms : aucun nouvel appel Core ;
- expiration du TTL : nouvel appel Core ;
- résultat évolution fourni par Core ;
- appels au calcul historique local : 0.

Elle vérifie aussi que :

- le cache reste dans le propriétaire historique ;
- `equippedItemsCached()` reste la source de vue équipée ;
- le XP runtime reste normalisé comme avant ;
- le wrapper Equipment continue d'appeler `cachedEvolutionBonus(key)` ;
- le cache performance global reste en aval ;
- Core Stats reste consommateur du seam final.

## Validation technique

HEAD technique :

`eb3fa9be1077fb065d24fe4c47e81103628c4891`.

Runs :

- Architecture + navigateur complet : `35631087083` — SUCCESS ;
- Firefox : `35631087122` — SUCCESS ;
- Tactical Dock : `35631087134` — SUCCESS.

## Périmètre respecté

Aucun changement de :

- `index.html` ;
- TTL du cache évolution ;
- invalidation du cache ;
- noms des invalidateurs ;
- stockage ;
- UI / Builders ;
- combat / capacités objets ;
- Core Stats ;
- Tactical ;
- logique du cache performance global.

Aucun nouvel observer, timer/retry ou monkey-patch n'a été ajouté.

## Dette conservée volontairement

Le pré-audit a identifié que les invalidateurs Equipment ne couvrent pas
exactement tous les vrais propriétaires `equip/unequip`.

Cette dette n'est **pas** corrigée dans ce lot.

Le prochain micro-lot peut auditer puis traiter séparément la frontière
cache/invalidation, avec ses propres tests et sa propre branche.

## Sortie du lot

Le raccord est techniquement GREEN.

Conformément à la charte :

1. revalider les trois batteries sur le SHA documentaire exact ;
2. créer le checkpoint GREEN uniquement après trois SUCCESS ;
3. ouvrir un lot distinct pour cache/invalidation ;
4. ne jamais fusionner automatiquement sur `main`.
