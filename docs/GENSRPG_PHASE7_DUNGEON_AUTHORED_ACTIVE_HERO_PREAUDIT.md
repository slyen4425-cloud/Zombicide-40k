# GenSrpG — Phase 7 / Dungeon authored — sélection canonique du héros actif — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-final-exit-terminal-delegation-green-2026-09-29`

SHA exact :
`930d4a33b31f465646f3941aa21cf3a4f7793d61`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-active-hero-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-active-hero-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale documentaire de la base :
- Architecture + Browser : `36580054199` — SUCCESS ;
- Firefox : `36580053906` — SUCCESS ;
- Tactical Dock : `36580053914` — SUCCESS.

Runtime `index.html` :
- `8169990` octets ;
- blob `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat

La même sélection du héros actif existe actuellement dans plusieurs runtimes authored, avec la même expression historique :

`const a=Array.isArray(x?.participants)?x.participants:[], i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0)); return String(a[i]||"")`.

Copies observées notamment dans :
- `DungeonAuthoredRuntime167839` ;
- `DungeonAuthoredFinalExit167875` ;
- `DungeonAuthoredReturnPersist167862` ;
- `DungeonAuthoredBranchNavCleanup167863`.

Ce micro-lot ne doit pas modifier ces quatre consommateurs à la fois.

## Cible stricte du micro-lot 16

Extraire uniquement la décision pure dans Dungeon :

`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Puis raccorder uniquement :
`DungeonAuthoredRuntime167839.activeHero(x)`.

Les trois autres copies restent explicitement hors périmètre et feront l'objet de micro-lots séparés si leur consommation canonique est ensuite validée.

## Parité historique à préserver

- `participants` non-array : héros vide ;
- tableau vide : héros vide ;
- index absent / `0` / non numérique : premier participant ;
- index négatif : premier participant ;
- index supérieur à la taille : dernier participant ;
- chaîne numérique : coercition numérique historique ;
- index fractionnaire : aucune normalisation supplémentaire ; accès fractionnaire inchangé, donc héros vide sauf propriété correspondante éventuelle ;
- participant falsy : chaîne vide ;
- participant truthy non-string : conversion via `String(...)`.

Aucun arrondi, aucune validation supplémentaire et aucun fallback vers un autre état ne doivent être ajoutés.

## Propriétaires

### GensDungeonV1.movement
Devient propriétaire uniquement de la sélection pure à partir de :
- `participants` ;
- `activeIndex`.

### DungeonAuthoredRuntime167839
Conserve :
- lecture de `x.participants` et `x.index` ;
- `activeHero(x)` comme raccord local ;
- `plan()`, `atTerminalExit()`, `enterNode()`, travel, persistence et UI.

## Hors périmètre

Ne pas toucher :
- Final Exit ;
- Return Persist ;
- Branch Nav Cleanup ;
- resolver `exitIdx` Final Exit ;
- movement allowance ;
- sortie / verrouillage ;
- Spatial ;
- travel ;
- events/spawn ;
- Tactical ;
- generated exploration ;
- index.html.

## TDD obligatoire

1. caractérisation GREEN de la sélection historique via le vrai consommateur `plan(x,g).hero` ;
2. prouver que l'API pure n'existe pas encore ;
3. triple CI GREEN ;
4. UNE garde RED exigeant l'API et un raccord unique dans Authored Runtime ;
5. RED isolé ;
6. micro-diff minimal dans `entry-v1.js`, Authored Runtime, contrat/tests uniquement ;
7. caractérisation post-raccord sans changement des cas ;
8. triple CI ;
9. fermeture documentaire + checkpoint GREEN.

## Rule 26

Aucun changement `index.html` n'est prévu.
Toute dérive vers le gros runtime déclenche Rule 26.


## Correction de frontière avant implémentation

La première tentative de raccord a fait échouer l'ancienne sentinelle generated #182, qui interdit à Authored Runtime de consommer le namespace `GensDungeonV1.exploration`.

Cette garde n'est pas affaiblie : elle exprime une frontière valide, le namespace `exploration` restant propriétaire du chemin generated.

Le candidat canonique est donc corrigé vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Le runtime et le contrat ont été restaurés à l'état pré-extraction avant de refaire le RED sur cette frontière corrigée.
