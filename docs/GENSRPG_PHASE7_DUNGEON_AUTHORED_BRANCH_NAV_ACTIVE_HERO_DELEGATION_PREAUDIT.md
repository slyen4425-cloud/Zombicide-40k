# GenSrpG — Phase 7 / Dungeon authored — délégation héros actif Branch Nav Cleanup — pré-audit — 2026-09-29

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-authored-return-persist-active-hero-delegation-green-2026-09-29`

SHA exact de base :
`acf72786a1ffe82dd814d6a97f0196e08b1245d6`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-authored-branch-nav-active-hero-delegation-2026-09-29`

Branche :
`work/gensrpg-phase7-dungeon-authored-branch-nav-active-hero-delegation-2026-09-29`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36626538149` — SUCCESS ;
- Firefox `36626538206` — SUCCESS ;
- Tactical Dock `36626537960` — SUCCESS.

Runtime `index.html` inchangé :
- `8169990` octets ;
- blob Git `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Constat sur la base canonique

Le propriétaire pur existe :
`GensDungeonV1.movement.resolveAuthoredActiveHero(participants, activeIndex)`.

Après les lots 17, 18 et 19 :
- Authored Runtime délègue déjà au propriétaire canonique ;
- Final Exit délègue déjà au propriétaire canonique ;
- Return Persist délègue déjà au propriétaire canonique ;
- `DungeonAuthoredBranchNavCleanup167863.activeHero(x)` reste la dernière copie locale historique.

Dans Branch Nav Cleanup, `activeHero` est exposé dans l'API publique :
`DungeonAuthoredBranchNavCleanup167863.activeHero`.

Il est consommé par `branchReturnActive()`, qui combine ensuite :
- lecture runtime ;
- validation authored ;
- pile `authored167847ReturnStacks` ;
- résolution du nœud courant ;
- comparaison du `targetNodeId`.

Le présent lot doit donc conserver la surface publique `activeHero(x)` et uniquement déléguer sa décision pure.

## Cible stricte du micro-lot 20

Faire déléguer uniquement :
`DungeonAuthoredBranchNavCleanup167863.activeHero(x)`

vers :
`GensDungeonV1.movement.resolveAuthoredActiveHero(x?.participants, x?.index)`.

Aucune nouvelle API n'est créée et l'export public `activeHero` reste présent.

## Parité obligatoire

Conserver exactement la sémantique canonique déjà verrouillée :
- non-tableau / tableau vide -> `""` ;
- index absent / NaN / falsy -> 0 ;
- négatif -> premier héros ;
- dépassement -> dernier héros ;
- chaîne numérique -> coercition `Number(...)` ;
- fractionnaire au-delà de la borne -> clamp au dernier ;
- fractionnaire dans les bornes -> aucun arrondi, lookup fractionnaire historique ;
- participant falsy -> `""` ;
- participant truthy -> `String(...)`.

La caractérisation doit également passer par le vrai chemin `branchReturnActive()` pour prouver que la décision de branche reste identique.

## Propriétaires préservés

Branch Nav Cleanup conserve intégralement :
- `readRt()` et la lecture `localStorage` ;
- `currentNode(x, hero)` ;
- `authoredActive()` ;
- `branchReturnActive()` hors sélection pure du héros ;
- `norm`, `candidates`, `isLegacyBranchNav` ;
- `hide`, `restore`, `sync`, `block` ;
- wrappers `DungeonCore01.render/show` ;
- listener click ;
- timers d'installation historiques.

Aucun de ces propriétaires n'est migré ou nettoyé dans ce lot.

## Hors périmètre absolu

Ne pas toucher :
- Authored Runtime ;
- Final Exit ;
- Return Persist runtime ;
- `DungeonSpatial313` ;
- logique de branche / piles de retour ;
- `currentNode` ;
- DOM / masquage / restauration ;
- listeners / wrappers / timers ;
- mouvement réel / pathfinding / travel ;
- événements / spawn / coffres / pièges / énigmes ;
- Tactical / Survival / Capture / PvP ;
- assets ;
- `index.html`.

## TDD obligatoire

1. caractérisation GREEN de l'API publique `activeHero` et du vrai chemin `branchReturnActive()` depuis la base exacte ;
2. prouver que Branch Nav Cleanup possède encore la copie locale et n'appelle pas le helper ;
3. triple CI GREEN ;
4. poser UNE garde RED exigeant la délégation Branch Nav Cleanup uniquement ;
5. vérifier RED isolé, Firefox et Tactical GREEN ;
6. micro-diff minimal dans Branch Nav Cleanup + contrat strictement nécessaire ;
7. conserver l'export public `activeHero` ;
8. triple CI GREEN ;
9. fermeture documentaire ;
10. triple CI documentaire ;
11. checkpoint GREEN final exact.

## Rule 26

Aucune lecture ni modification du contenu exact de `index.html` n'est requise.

Toute dérive vers son contenu exact arrête le lot et déclenche Rule 26.


## Fermeture technique du micro-lot 20

### Caractérisation GREEN préalable

SHA :
`21b5d2d621f9b9dcdf3f2b5ce6d4b3b1632a6079`.

CI :
- Architecture + Browser `36629944427` — SUCCESS ;
- Firefox `36629944354` — SUCCESS ;
- Tactical Dock `36629944355` — SUCCESS.

La caractérisation valide :
- l'API publique `DungeonAuthoredBranchNavCleanup167863.activeHero(x)` ;
- la parité exacte avec `GensDungeonV1.movement.resolveAuthoredActiveHero(...)` ;
- le vrai chemin `branchReturnActive()` ;
- les cas fractionnaires historiques ;
- le rejet hors runtime authored ;
- l'absence de consommation du helper avant délégation.

### RED isolé

SHA :
`b942b4e9a38b2ff2b732778a07e6b96dbdf0de2b`.

Résultat :
- Architecture `36631314119` — FAILURE attendue uniquement sur #219 `Exiger la délégation héros actif Branch Nav Cleanup authored Phase 7` ;
- caractérisation #218 — SUCCESS ;
- Browser — SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36631314160` — SUCCESS ;
- Tactical Dock `36631314117` — SUCCESS.

Aucune autre sentinelle n'a échoué.

### Micro-diff GREEN appliqué

Commits fonctionnels :
- `75b5c3fa42fb00ad608932c0857d3fcb54cac5b9` — l'API publique `activeHero(x)` de Branch Nav Cleanup délègue au propriétaire canonique ;
- `49ed3573fa64d261e0f96c1bd1c4f3bc21b4e630` — frontière contractuelle documentée ;
- `abba751a5591252258a260e9a0d5193b7be43b75` — caractérisation post-raccord ;
- `c5e04355ec266f9b780a74fc913a694a2e86f7a9` — fixture historique Branch Nav charge le propriétaire Dungeon avant le consommateur ;
- `15449fbf94751a1455bcfaca42a3e3bd5efb22aa`, `509a97c4c69883162138ca64fb0ac841670a2d23`, `37abb64ab4b722068a2915a1b5f5313a7eeb1dae`, `cd24dd09ac43480a113a99b7ac63f19164f00561`, `c124cf954e16af34827e587fc59ee4380a250880` — sentinelles cumulatives lots 17–19 alignées sur la délégation ultérieure sans retrait d'assertions métier.

Frontière finale :
- `GensDungeonV1.movement.resolveAuthoredActiveHero` est désormais le propriétaire unique de la décision pure de sélection du héros actif sur les quatre consommateurs authored audités ;
- Branch Nav Cleanup conserve son API publique `activeHero` ;
- `branchReturnActive` conserve lecture runtime, pile de retour, `currentNode` et politique de branche ;
- DOM, `sync`, `block`, wrappers `render/show`, listener click et timers d'installation restent inchangés ;
- Authored Runtime, Final Exit, Return Persist et `DungeonSpatial313` restent inchangés dans ce lot ;
- aucun changement de `index.html`.

### Triple CI technique GREEN

SHA technique :
`c124cf954e16af34827e587fc59ee4380a250880`.

CI :
- Architecture + Browser `36631824981` — SUCCESS ;
- Firefox `36631824957` — SUCCESS ;
- Tactical Dock `36631824949` — SUCCESS.

### Conformité

- aucune nouvelle API ;
- aucune suppression de l'API publique Branch Nav ;
- aucune rustine globale ;
- aucun nouveau wrapper, observer, listener, timer, retry ou heartbeat ;
- aucune modification de `main` ;
- aucun changement utilisateur visible ;
- aucun test utilisateur nécessaire ;
- Rule 26 non déclenchée.

Checkpoint final prévu après triple CI du SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-authored-branch-nav-active-hero-delegation-green-2026-09-29`.
