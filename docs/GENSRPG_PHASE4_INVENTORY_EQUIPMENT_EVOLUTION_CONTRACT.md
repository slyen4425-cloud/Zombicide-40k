# GenSrpG — Phase 4 Core Inventory / Equipment — contrat pur évolution

Date : 2026-09-21

## Gouvernance

- Branche :
  `work/gensrpg-phase4-inventory-equipment-evolution-contract-2026-09-21`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-inventory-equipment-evolution-contract-2026-09-21`.
- Base exacte :
  `549a529278e1f03fd9b7e93ef6c1b559e41683ee`.
- Dernier checkpoint GREEN :
  `checkpoint/gensrpg-phase4-inventory-equipment-bonus-raccord-green-2026-09-21`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Objet du micro-lot

Extraire uniquement le contrat pur du bonus d'évolution Equipment.

Propriétaire historique caractérisé :

`assets/gensrpg/gens-equipment-stat-cleanup-1678102.js`

Fonction de référence :

`evolutionBonusForItem(item,key,xp)`.

Le cache `cachedEvolutionBonus` reste explicitement hors du lot.

## Sémantique historique verrouillée

- évolution absente ou `enabled !== true` -> 0 ;
- `levels` absent/non tableau -> 0 ;
- seuil XP négatif ou non numérique -> 0 ;
- un niveau contribue si `xp >= max(0, seuil)` ;
- tous les niveaux débloqués sont cumulés ;
- bonus non numérique -> 0 ;
- clé absente -> 0 ;
- l'agrégation multi-objets additionne le résultat de chaque item.

Le contrat conserve la sémantique de la fonction pure historique :
le XP courant est une entrée explicite et n'est pas normalisé par le service.
La normalisation runtime du XP reste la responsabilité de la couche appelante.

## Service Core créé

Fichier :

`assets/gensrpg/core/equipment-evolution-v1.js`.

Export :

`GensEquipmentEvolutionV1`.

Version :

`1.0.0`.

API :

- `itemBonus(item,key,xp)` ;
- `totalBonus(items,key,xp)`.

## Pureté / inertie

Le service ne dépend d'aucun :

- DOM ;
- stockage ;
- timer ;
- MutationObserver ;
- cache Equipment ;
- `cachedEvolutionBonus` ;
- `dungeonEquipmentBonus` ;
- Stats ;
- Tactical.

Le service est classé Phase 4 **inert**.

Conséquences :

- aucun chargement Pages ;
- aucun chargement preview ;
- aucun précache PWA ;
- graphe production inchangé à 75 fichiers atteignables ;
- inventaire physique JS : 92 -> 93 ;
- services Phase 4 connus : 12 -> 13.

## TDD

La première version de la nouvelle fixture contenait une erreur de syntaxe
locale dans son extracteur de fonction :

`SyntaxError: Unexpected end of input`.

Cette erreur a été corrigée uniquement dans la fixture.

Aucune modification runtime n'a été faite pour traiter ce RED.

La sentinelle valide ensuite la parité du propriétaire historique pour :

- évolution désactivée ;
- seuils 0 / 10 / 20 / 30 ;
- seuil négatif ;
- seuil non numérique ;
- cumul multi-niveaux ;
- bonus non numérique ;
- clé absente ;
- plusieurs objets.

## Validation technique

HEAD technique :

`31c84fc474f9d9c1fffc9cb766cf4477c21225d9`.

Runs :

- Architecture : `35627144923` — SUCCESS ;
- Firefox : `35627144880` — SUCCESS ;
- Tactical Dock : `35627144846` — SUCCESS.

### Note navigateur

La première tentative du job navigateur sur le même SHA a échoué sur
`Dungeon après Survie` par timeout Playwright :

un overlay Tactical interceptait ponctuellement le clic vers Survie.

Le service d'évolution étant inert et non chargé, aucun runtime de ce
scénario n'avait changé.

Le job navigateur échoué a donc été relancé **sur exactement le même SHA,
sans changement de code**. Le rerun a passé l'intégralité des scénarios,
y compris le point précédemment en timeout.

Aucune rustine ni modification de la sentinelle n'a été ajoutée.

## Périmètre non modifié

Aucun changement de :

- `index.html` ;
- `dungeonEquipmentBonus` ;
- `cachedEvolutionBonus` ;
- TTL du cache ;
- invalidation cache ;
- Pages / preview / Service Worker ;
- stockage ;
- UI / Builders ;
- combat / capacités objets ;
- Stats / Tactical.

Aucun wrapper, observer, timer/retry ou monkey-patch ajouté.

## Décision de sortie

Le contrat pur évolution est techniquement GREEN et reste inert.

La présente documentation change le SHA. Avant checkpoint GREEN :

1. relancer Architecture + navigateur, Firefox et Tactical Dock sur le SHA
   documentaire exact ;
2. checkpoint GREEN uniquement après trois SUCCESS ;
3. ouvrir ensuite un lot distinct de raccord évolution ;
4. le cache/invalidation restera dans le lot suivant ;
5. ne jamais fusionner directement sur `main`.
