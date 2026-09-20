# GenSrpG — Phase 4 Core Stats — S2 Normalisation pure

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-stats-s2-normalization-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s2-normalization-2026-09-20`.
- Base exacte / dernier GREEN : `56c9889dbebf84281f11ed995bb442889ffc6812`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-stats-s1-contracts-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## But

Extraire un premier noyau Core Stats réellement utilisé, limité aux fonctions
pures de normalisation déjà caractérisées en S1.

Le lot ne change aucune formule de gameplay.

## Nouveau service cible

Fichier :
`assets/gensrpg/core/stats-v1.js`.

API globale :
`GensStatsV1`.

Version initiale :
`1.0.0`.

Responsabilités autorisées :

- `slug(value)` ;
- `canon(id)` ;
- `number(value,fallback)` ;
- `clamp(value,min,max)` ;
- `normalizeDefinition(definition)` ;
- `targetValid(target)` ;
- `normalizeEffect(effect,index)` ;
- `compare(value,comparator,threshold)` ;
- `effectContribution(effect,sourceValue)`.

Constantes pures exportées :
- `ALIASES` ;
- `TARGETS`.

## Parité obligatoire

Les résultats doivent rester identiques à l'implémentation S1 actuelle.

### Canonisation

Aliases existants :
- agility -> agilite ;
- spirit -> esprit ;
- strength -> force ;
- dexterity -> agilite ;
- wisdom -> esprit ;
- constitution -> endurance ;
- defence -> defense ;
- armour -> armor ;
- move -> movement.

La fonction `canon()` ne doit pas ajouter silencieusement une lower-case
supplémentaire par rapport au comportement actuel.

### Définition

`normalizeDefinition()` conserve :
- ID = `canon(slug(id || name))` ;
- rejet si ID vide ;
- min fallback 0 ;
- max = au moins min ;
- default clampé ;
- visible true sauf false explicite ;
- chaînes name/icon/description normalisées comme aujourd'hui.

### Effet

`normalizeEffect()` conserve :
- source via `canon(source)` ;
- cible seulement si TARGETS ou préfixe `stat:` ;
- mode threshold uniquement si valeur exactement `threshold`, sinon step ;
- step >= 1 ;
- gain numérique ;
- threshold fallback 10 ;
- comparator parmi gt/gte/lt/lte/eq, sinon gt ;
- enabled true sauf false explicite.

### Contribution

Pour une valeur source fournie :
- disabled -> 0 ;
- threshold -> gain si comparaison vraie, sinon 0 ;
- step -> `floor(sourceValue / max(1,step)) * gain`.

Le service Core ne résout aucune récursion ni aucun provider.

## Raccord historique

Le module :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`

reste propriétaire de :
- profil ;
- migration ;
- providers ;
- baseValue/value ;
- cycles via seen ;
- dérivées ;
- UI ;
- persistance ;
- wrappers.

Mais il doit appeler `GensStatsV1` pour les responsabilités S2.

Après GREEN :
- aucune implémentation locale autonome de `slug/canon/normDef/normEffect/compare`
  ne doit rester ;
- `effectAmount` conserve l'appel à `value(...)`, puis délègue seulement le
  calcul élémentaire à `GensStatsV1.effectContribution`.

## Composition

Dans `preview.html`, charger explicitement :

`assets/gensrpg/core/stats-v1.js`

juste avant :

`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

Le module historique doit échouer clairement si Core Stats manque dans la
composition cible plutôt que recréer silencieusement une copie.

Les tests unitaires qui exécutent directement le module historique en VM doivent
charger le nouveau Core avant lui.

## TDD

### Inventory

`tests/gens_phase4_stats_s2_loader_inventory_v1.test.cjs`

Inventorie tous les tests qui chargent directement
`gens-rpg-stats-clean-167874.js`.

### Parité

`tests/gens_phase4_stats_s2_normalization_parity_v1.test.cjs`

Doit comparer l'ancien contrat S1 et le nouveau service Core sur une matrice
large avant le raccord du propriétaire historique.

### Autorité

`tests/gens_phase4_stats_s2_owner_v1.test.cjs`

Doit être RED tant que :
- le service Core n'existe pas ou n'est pas chargé ;
- le propriétaire historique garde ses implémentations locales ;
- la preview ne charge pas Core avant lui.

Puis GREEN après raccord.

## Hors périmètre

- aucune évolution de `value()` ;
- aucun snapshot ;
- aucune dérivée nouvelle ;
- aucun Armor/Hit/Resistance ;
- aucun cache ;
- aucune progression ;
- aucune modification Equipment/Talents/Challenges ;
- aucun DOM déplacé ;
- aucune migration persistante ;
- aucun nouveau observer/timer/retry/wrapper.

## Critère de sortie

1. TDD parité GREEN.
2. Owner guard RED pré-raccord puis GREEN.
3. Nouveau service Core pur raccordé.
4. Tests historiques Stats/Tactical inchangés en résultat.
5. Architecture+navigateur complet GREEN.
6. Firefox GREEN.
7. Tactical Dock GREEN.
8. Checkpoint dédié S2.
