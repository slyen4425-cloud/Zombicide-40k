# GenSrpG — Phase 7 / Dungeon movement — mouvement d’entrée authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-descriptor-green-2026-09-28`

SHA exact de base :
`cdc939b810edf918f6eeee537da9b5d5488a5ac8`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-entry-movement-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-authored-entry-movement-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

Runtime de base :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les micro-lots précédents ont isolé les slices generated de planification / salle / branche.

La roadmap Phase 7 demande ensuite d’isoler explicitement le déplacement Dungeon.

Le premier seam mouvement retenu est volontairement étroit :
`DungeonAuthoredRuntime167839.movementForEntry(x, hero)`.

Comportement historique actuel :
`const raw=x?.remaining?.[hero]; return Number.isFinite(Number(raw)) ? Math.max(0,Number(raw)) : heroMoveAllowance(hero)`.

Ce seam est exécuté avant la persistance / activation spatiale de `enterNode(...)`.

## Cible stricte du micro-lot 7

Isoler uniquement la décision pure :
- réutiliser une valeur de mouvement restante exploitable ;
- ou demander au propriétaire historique `heroMoveAllowance(hero)` de fournir le fallback.

API cible proposée après caractérisation GREEN :
`GensDungeonV1.movement.planAuthoredEntryMovement(remainingValue)`.

Contrat cible :
- valeur convertible en nombre fini -> `{status:"remaining", movement: Math.max(0, Number(value))}` ;
- valeur non finie / absente -> `{status:"fallback", movement:null}`.

Le fallback `heroMoveAllowance(hero)` reste évalué uniquement dans le chemin `fallback`.
Il ne doit pas être calculé de manière anticipée.

## Pourquoi ce seam

Il permet de commencer l’isolation de `movement` sans déplacer :
- la position du héros ;
- le déplacement de case en case ;
- le pathfinding ;
- la consommation de mouvement pendant un tour ;
- la persistance `DungeonSpatial313` ;
- les événements post-déplacement ;
- les interactions de case ;
- le combat.

## Propriétaires à préserver

### DungeonAuthoredRuntime167839
Reste propriétaire pendant ce micro-lot de :
- `heroMoveAllowance(hero)` ;
- `movementForEntry(x, hero)` comme consommateur/raccord ;
- `enterNode(...)` ;
- placement sur `arrival(...)` ;
- écriture `x.remaining[hero]=movement` ;
- authored travel / sortie finale.

### DungeonSpatial313
Reste propriétaire de :
- `ensure` ;
- `persist` ;
- `setRoom` ;
- `activate` ;
- snapshots spatiaux.

### Autres systèmes hors périmètre
Ne pas toucher :
- mouvement generated ;
- grille / clic de déplacement ;
- portée / movement allowance ;
- fin de tour ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- ennemis / LOS ;
- Tactical / combat trigger / combat resolution ;
- authored action fix ;
- authored return persist ;
- Survival / Capture / PvP ;
- assets.

## Invariants de parité

Le comportement historique de `movementForEntry` doit rester exact :

- `remaining=2` -> 2, sans appel fallback ;
- `remaining=0` -> 0, sans appel fallback ;
- `remaining=-2` -> 0, sans appel fallback ;
- `remaining="2"` -> 2, sans appel fallback ;
- `remaining=null` -> 0, sans appel fallback ;
- `remaining=""` -> 0, sans appel fallback ;
- `remaining=true` -> 1, sans appel fallback ;
- `remaining=undefined` -> fallback ;
- `remaining="abc"` -> fallback ;
- `remaining=Infinity` -> fallback.

Le fallback doit rester paresseux : aucune lecture de `dungeonHeroMoveValue083` / `CHARS` quand une valeur restante exploitable existe.

## TDD obligatoire

1. caractérisation GREEN du seam historique, y compris paresse du fallback ;
2. raccord de la caractérisation à Architecture ;
3. Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. UNE garde RED exigeant l’API pure Dungeon et son raccord unique ;
5. preuve que le RED est isolé ;
6. Rule 26 si `index.html` doit changer ;
7. micro-diff minimal ;
8. réalignement des fingerprints un garde à la fois si nécessaire ;
9. triple CI ;
10. aucun test utilisateur si le comportement reste strictement neutre ;
11. fermeture documentaire + checkpoint GREEN final.

## Rule 26

Aucune modification de `index.html` n’est autorisée dans les étapes de pré-audit / caractérisation / RED.

Si le raccord final exige une modification de l’inline authored ou d’un bloc exact dans `index.html`, demander le fichier exact avant modification et vérifier taille + blob localement.

## Caractérisation GREEN — prouvée

SHA de caractérisation :
`8461beb071b52d1397ec3f322cbdbb8bab609cbf`.

CI :
- Architecture + Browser Chromium : `36430074810` — SUCCESS ;
- Firefox : `36430074767` — SUCCESS ;
- Tactical Dock : `36430074878` — SUCCESS.

La caractérisation verrouille :
- parité exacte de `movementForEntry` pour valeurs numériques/coercibles ;
- clamp des valeurs négatives à zéro ;
- fallback pour valeur absente/non finie ;
- appel paresseux de `heroMoveAllowance(hero)` uniquement sur fallback ;
- décision avant `DungeonSpatial313.ensure/persist` ;
- écriture finale de `x.remaining[hero]=movement` toujours Authored Runtime.

## RED isolé — prouvé

SHA RED :
`cd3b3b5bc646e8fd4df1cd93177cee734761798a`.

CI :
- Architecture : `36431701247` — FAILURE attendue ;
- Browser : SKIPPED uniquement à cause du RED Architecture ;
- Firefox : `36431701142` — SUCCESS ;
- Tactical Dock : `36431701044` — SUCCESS.

Seule garde rouge :
`#194 — Exiger le planificateur Dungeon du mouvement d’entrée authored Phase 7`.

Erreur attendue :
`Phase 7 micro-lot 7 requires Dungeon-owned authored entry movement planner`.

## Micro-diff autorisé après RED

Le raccord ne nécessite aucune modification de `index.html`.

Fichiers autorisés :
- `assets/gensrpg/dungeon/entry-v1.js` : ajouter le planner pur sous `GensDungeonV1.movement` ;
- `assets/dungeon/dungeon-authored-runtime-167839.js` : faire consommer ce planner par `movementForEntry` en conservant le fallback paresseux ;
- `assets/gensrpg/dungeon/module-contract-v1.json` : déclarer la frontière de propriété.

Tout le reste reste hors périmètre.

## Fermeture candidate GREEN

SHA technique GREEN :
`4750b8b73bbe28684abc2fa997292173522d7b82`.

CI complète :
- Architecture + Browser Chromium : `36434074641` — SUCCESS ;
- Firefox : `36434074564` — SUCCESS ;
- Tactical Dock : `36434074498` — SUCCESS.

Runtime :
- `index.html` inchangé : `8169990` octets ;
- blob Git inchangé : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Résultat :
- `GensDungeonV1.movement.planAuthoredEntryMovement(remainingValue)` possède uniquement la décision pure remaining-versus-fallback ;
- valeurs numériques/coercibles finies : statut `remaining`, clamp à zéro ;
- valeur absente/non finie : statut `fallback`, sans lecture de stats dans le planner ;
- `DungeonAuthoredRuntime167839.movementForEntry(x, hero)` reste le consommateur unique ;
- `heroMoveAllowance(hero)` reste propriétaire du fallback et n'est appelé que paresseusement ;
- planification du mouvement reste avant `DungeonSpatial313.ensure/persist` ;
- placement `x.positions[hero]=arrival(...)` et écriture `x.remaining[hero]=movement` restent Authored Runtime ;
- `DungeonSpatial313`, déplacement de grille, pathfinding, consommation par case, événements/spawn, interactions et Tactical restent inchangés ;
- les anciens gardes generated ont été resserrés pour autoriser uniquement le nouveau consommateur mouvement, sans transférer les APIs `GensDungeonV1.exploration.*` vers Authored Runtime ;
- caractérisation post-raccord et garde propriétaire #194 sont GREEN ;
- aucun changement utilisateur visible : aucun test utilisateur supplémentaire requis.

Checkpoint final prévu après CI du présent SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-authored-entry-movement-green-2026-09-28`.

## Prochaine action obligatoire

1. valider cette fermeture documentaire par Architecture + Browser, Firefox et Tactical Dock ;
2. si tout est SUCCESS, créer le checkpoint final exact ci-dessus ;
3. ouvrir seulement ensuite le prochain micro-lot Phase 7 depuis ce checkpoint GREEN ;
4. continuer le domaine `movement` par pré-audit d'un seam étroit, sans migrer le déplacement complet d'un seul coup.

