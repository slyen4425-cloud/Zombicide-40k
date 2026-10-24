# GenSrpG — Phase 4 Core Equipment — contrat pur bonus directs + sets

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-bonus-sets-contract-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-bonus-sets-contract-2026-09-21`.
- Base exacte :
  `7408d1d0d24b13c6dd28c09968fbf301704705db`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipped-view-raccord-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet du micro-lot

Extraire un service Core **pur et inert** pour :

1. le bonus direct des objets équipés ;
2. l'état des sets ;
3. le bonus agrégé des sets ;
4. le total direct + set.

Aucun raccord à `dungeonEquipmentBonus` n'est effectué dans ce lot.

## Sources historiques caractérisées

### Bonus direct

Le propriétaire inline historique additionne :

`Number(item.rpgBonuses?.[key]) || 0`

sur la vue des objets équipés.

### Sets

Le propriétaire Core 3.16 :

`setState316(items, registry)`

est la référence de parité.

Sémantique verrouillée :

- groupement par `setId` ;
- set absent du registry ignoré ;
- pièce identifiée par `setPieceId || item.id` ;
- déduplication des pièces par cet identifiant ;
- seuils triés par nombre de pièces ;
- seuil minimum normalisé à 1 ;
- tous les seuils atteints sont actifs ;
- leurs bonus sont cumulés ;
- plusieurs sets peuvent être actifs simultanément ;
- valeurs non numériques contribuent 0.

## Service Core créé

Fichier :

`assets/gensrpg/core/equipment-bonus-sets-v1.js`.

Export :

`GensEquipmentBonusSetsV1`.

Version :

`1.0.0`.

API :

- `thresholds(set)` ;
- `directBonus(items, key)` ;
- `setState(items, registry)` ;
- `setBonus(items, key, registry)` ;
- `totalBonus(items, key, registry)`.

## Pureté

Le service ne dépend d'aucun :

- DOM ;
- stockage ;
- timer ;
- MutationObserver ;
- seam runtime Equipment ;
- Stats ;
- Tactical.

Il ne lit aucun état global de gameplay.

Toutes ses données arrivent par arguments explicites.

## TDD

Premier RED attendu :

- run Architecture `35621082541` ;
- la caractérisation historique passe ;
- échec exact :
  `Core Equipment bonus + sets contract module must exist`.

Après création du service, second RED attendu :

- run Architecture `35621229905` ;
- cause :
  nouveau fichier physique encore non classé dans la cartographie Phase 2.

Correction de cartographie uniquement :

- le service est classé **Phase 4 inert** ;
- inventaire JS physique : 91 -> 92 ;
- services Phase 4 connus : 11 -> 12 ;
- graphe production reste à 74 fichiers atteignables.

## Validation technique

HEAD technique :

`070d772fe125767ebc3531cbe04543e4a66662ac`.

Runs :

- Architecture + navigateur complet : `35621365751` — SUCCESS ;
- Firefox : `35621365581` — SUCCESS ;
- Tactical Dock : `35621365736` — SUCCESS.

## Périmètre non modifié

Aucun changement de :

- `index.html` ;
- Pages / preview / Service Worker ;
- `dungeonEquipmentBonus` ;
- Core 3.16 ;
- Equipped View connecté ;
- equip / unequip / refs de slots ;
- évolution ;
- cache / invalidation ;
- stockage ;
- UI / Builders ;
- combat / capacités objets ;
- Stats / Tactical.

Aucun wrapper, observer, timer/retry ou monkey-patch ajouté.

## Décision de sortie

Le contrat pur est techniquement GREEN et reste inert.

La présente documentation change le SHA. Avant checkpoint GREEN :

1. relancer Architecture + navigateur, Firefox et Tactical Dock sur le SHA
   documentaire exact ;
2. créer le checkpoint GREEN uniquement après trois SUCCESS ;
3. ouvrir ensuite un lot distinct de raccord de
   `dungeonEquipmentBonus` avec parité ;
4. ne pas inclure l'évolution ni le cache dans ce raccord ;
5. ne jamais fusionner directement sur `main`.
