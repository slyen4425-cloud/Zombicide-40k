# GenSrpG — Phase 4 Core Stats — S1 Contrats et sentinelles

Date : 2026-09-20

- Branche : `work/gensrpg-phase4-stats-s1-contracts-2026-09-20`.
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-stats-s1-contracts-2026-09-20`.
- Base exacte / dernier GREEN : `44e79de9afcb7c7cf47f2c3ad11d847e425274ae`.
- Checkpoint précédent : `checkpoint/gensrpg-phase4-storage-exit-audit-13-green-2026-09-20`.
- Production gelée : `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Position dans la roadmap

Phase 4 — services communs :

1. Assets — engagé et raccordé ;
2. Storage — **sous-chantier commun clôturé** par Audit 13 ;
3. Stats — **chantier courant** ;
4. Inventory/Equipment/Sets ;
5. Dice ;
6. Progression/XP ;
7. Event bus/utilitaires.

S1 est un lot de contrats/sentinelles uniquement.
Aucune formule, aucun runtime, aucun gameplay n'est modifié.

## Pré-audit repris et revalidé

Le document Agent 1 est repris comme documentation :
`docs/GENSRPG_PHASE4_STATS_PREAUDIT_AGENT1.md`.

Sa base historique était :
`5259210bea918719603066057d3c64c4d68624eb`.

Revalidation contre le nouveau GREEN Storage :
`44e79de9afcb7c7cf47f2c3ad11d847e425274ae`.

Constat :
- aucun fichier moteur Stats/Tactical/Equipment pertinent n'a changé depuis la
  base du pré-audit ;
- les changements runtime ultérieurs dans `index.html` sont des raccords Storage
  déjà bornés et contrôlés ;
- le pré-audit reste donc valide comme cartographie, mais **ne sert pas de base Git**.

## Propriétaire canonique actuel

`assets/gensrpg/gens-rpg-stats-clean-167874.js`

API actuelle :
`GensCleanRpgStats167874`.

Ce module possède aujourd'hui à la fois :
- normalisation des définitions ;
- normalisation des effets ;
- valeurs de base ;
- composition des modificateurs externes ;
- effets stat -> stat ;
- effets vers dérivées ;
- valeur canonique `value(hero,id)` ;
- migration legacy ;
- persistance ;
- rendu éditeur ;
- rendu/décoration fiche ;
- wrappers Dungeon ;
- MutationObserver ;
- timers UI.

Il **ne doit pas** être déplacé tel quel dans Core.

## Contrat S1 — Definition

Forme normalisée cible :

```text
StatDefinition {
  id: string canonique
  name: string
  icon: string
  defaultValue: number clampé dans [min,max]
  min: number
  max: number >= min
  visible: boolean
  description: string
}
```

Invariants observés et verrouillés :
- l'ID est slugifié puis passé dans la table d'alias ;
- aliases notamment :
  - strength -> force ;
  - agility -> agilite ;
  - spirit -> esprit ;
  - defence -> defense ;
  - armour -> armor ;
  - move -> movement ;
- définition sans ID exploitable -> ignorée ;
- min non numérique -> 0 ;
- max ne peut pas être inférieur à min ;
- defaultValue est clampé ;
- `visible` vaut true sauf `false` explicite.

## Contrat S1 — Effect

Forme normalisée cible :

```text
StatEffect {
  id: string
  source: stat id canonique
  target: cible dérivée ou stat:<id>
  mode: "step" | "threshold"
  step: number >= 1
  gain: number
  threshold: number
  comparator: "gt" | "gte" | "lt" | "lte" | "eq"
  enabled: boolean
}
```

Cibles dérivées actuellement reconnues :
- damage:physical ;
- damage:melee ;
- damage:ranged ;
- damage:magic ;
- hit:melee ;
- hit:ranged ;
- hit:magic ;
- max_hp ;
- max_mana ;
- crit ;
- dodge ;
- magic_resistance ;
- defense ;
- armor ;
- movement ;
- initiative ;
- enemy_vision ;
- toute cible `stat:<id>`.

Une source vide ou une cible invalide est rejetée.

## Contrat S1 — valeur canonique

Sémantique actuelle à préserver avant toute extraction :

```text
baseValue(hero,id)
+ somme des effets target stat:<id>
+ pour les natives spéciales, effets directs de même cible
-> clamp [min,max]
```

Le moteur actuel distingue :
- base héros ;
- valeur runtime `state.rpgAttributes` ;
- bonus équipement ;
- bonus talents ;
- malus challenge ;
- effets configurés.

La future API Core devra recevoir les données/modificateurs explicitement.
Elle ne devra pas lire directement :
- `CHARS` ;
- `state` ;
- inventaire ;
- talents ;
- challenges.

## Contrat S1 — effets

Mode `step` :

```text
floor(sourceValue / max(1, step)) * gain
```

Mode `threshold` :

```text
compare(sourceValue, comparator, threshold) ? gain : 0
```

Boucles stat -> stat :
le comportement actuel rompt la récursion en revenant à la valeur de base quand
l'ID est déjà présent dans le set `seen`.
Ce comportement doit être caractérisé et conservé jusqu'à décision explicite.

## Contrat S1 — dérivées

Core Stats peut à terme **produire des valeurs/modificateurs**, mais ne doit pas
résoudre le combat.

Dérivées candidates :
- max HP ;
- max mana ;
- crit ;
- dodge ;
- initiative ;
- magic resistance ;
- bonus damage:* ;
- bonus hit:*.

Frontières explicitement exclues du premier moteur pur :
- application finale de l'armure ;
- formule finale de toucher ;
- défense/esquive appliquées au D100 ;
- couvert ;
- résistances appliquées aux dégâts ;
- critique résolu ;
- HP/mana courants.

## Contrats à ne pas fusionner en S1/S2

### Armure

Dungeon et Tactical n'interprètent pas encore le score de la même façon.
Aucune consolidation de formule.

### Toucher / Défense / Esquive

Dungeon et Tactical ont des chaînes différentes.
Core Stats fournira seulement les valeurs/modificateurs.

### Résistances

La forme tableau de l'éditeur et la forme objet consommée par certaines couches
Tactical restent incompatibles.
Aucune normalisation runtime dans S1.

## Détail explicable

Le futur Core Stats devra pouvoir expliquer un résultat sans DOM.
S1 verrouille déjà l'existence sémantique de :
- définition ;
- source ;
- cible ;
- mode ;
- step/seuil ;
- gain ;
- valeur source ;
- contribution ;
- total.

Le format final de l'objet `detail` sera introduit dans S2/S3, pas dans S1.

## Propriétés du futur service Core

Le futur service devra être :
- pur ;
- déterministe ;
- sans DOM ;
- sans localStorage ;
- sans timer ;
- sans MutationObserver ;
- sans navigation ;
- sans Tactical ;
- sans ownership Inventory/Talents/Challenges.

Les providers de données restent propriétaires de leurs données et transmettent
des entrées normalisées au moteur.

## TDD S1

Sentinelle :
`tests/gens_phase4_stats_s1_contracts_v1.test.cjs`.

Elle caractérise sur le moteur actuel :
- aliases ;
- normalisation de définitions via `root()` ;
- normalisation d'effets ;
- rejet de cibles invalides ;
- valeur runtime prioritaire ;
- contributions équipement/talent/challenge ;
- effet stat -> stat ;
- step ;
- threshold ;
- clamp ;
- cycle stat -> stat ;
- `extraTotal` ;
- `sourceEffectTotal` ;
- texte explicatif courant.

Elle ne crée aucune nouvelle autorité runtime.

## Critère de sortie S1

GREEN uniquement si :
- aucun runtime n'est modifié ;
- le contrat est documenté ;
- la sentinelle caractérise le moteur actuel ;
- les tests historiques Stats/Tactical restent GREEN ;
- Architecture + navigateur complet, Firefox et Tactical Dock passent ;
- un checkpoint S1 GREEN est créé.

## Suite autorisée

Après S1 GREEN :

**S2 — normalisation pure**.

S2 pourra créer un premier fichier dans
`assets/gensrpg/core/`
contenant uniquement des fonctions pures de normalisation/canonisation,
avec parité contre le moteur historique.

Aucun `value()` complet, aucune dérivée combat, aucune UI et aucune persistance
ne devront entrer dans S2.


## Validation S1

HEAD fonctionnel validé avant clôture documentaire :
`20ffce10f6282486dacb380d377fb4917260f89c`.

Runs :
- Architecture + navigateur complet : `35537827950` — SUCCESS ;
- Firefox : `35537827965` — SUCCESS ;
- Tactical Dock : `35537827948` — SUCCESS.

La sentinelle S1 corrigée est GREEN et les batteries historiques Stats/Tactical
restent GREEN.

Diff S1 :
- documentation du contrat ;
- reprise documentaire du pré-audit Agent 1 ;
- sentinelle de caractérisation ;
- workflow CI ;
- CURRENT_WORK.

Aucun runtime ou gameplay n'a été modifié.

La clôture documentaire doit repasser les trois workflows sur son SHA exact avant
création du checkpoint
`checkpoint/gensrpg-phase4-stats-s1-contracts-green-2026-09-20`.
