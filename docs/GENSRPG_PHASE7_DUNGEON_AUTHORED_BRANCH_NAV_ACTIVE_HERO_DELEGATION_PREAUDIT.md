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
