# GenSrpG — Phase 7 / Dungeon exploration — politique Boss generated — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-descriptor-green-2026-09-28`

SHA exact de base :
`cdc939b810edf918f6eeee537da9b5d5488a5ac8`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-boss-policy-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-generated-boss-policy-2026-09-28`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI finale de la base :
- Architecture + Browser : `36407786745` — SUCCESS ;
- Firefox : `36407786820` — SUCCESS ;
- Tactical Dock : `36407786757` — SUCCESS.

Runtime de base :
- `index.html` : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

## Position dans la Phase 7

Les slices generated déjà propriétaires Dungeon dans `GensDungeonV1.exploration` sont :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)` ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)` ;
3. `buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)` ;
4. `pickWeightedGeneratedBranchType(branchWeights, roll)` ;
5. `shouldCreateGeneratedBranch(specialBranchChance, roll)` ;
6. `buildGeneratedBranchSceneElement(room, cellIndex, branchType)`.

La politique Boss generated a été explicitement différée dans les micro-lots précédents et reste encore propriétaire Core 2.00.

## Comportement historique déjà protégé

Les tests Phase 7 existants prouvent actuellement dans `dungeonCore200Rebuild.chooseKind(room)` :

- `boss !== 'none' && room === Number(c.rooms)` -> Boss final ;
- `boss === 'everyN' && room % max(1, bossEvery||5) === 0` -> Boss périodique ;
- `boss === 'specific' && explicit.includes(room)` -> Boss sur salles explicites ;
- `boss === 'random' && room > 2 && Math.random()*100 < max(0, bossChance||13)` -> Boss aléatoire ;
- si aucune règle Boss n'accepte, le choix non-Boss est délégué à
  `GensDungeonV1.exploration.pickWeightedGeneratedRoomKind(c.roomWeights, Math.random())`.

Consommation RNG historique déjà caractérisée :
- Boss final : 0 tirage ;
- Boss random réussi : 1 tirage ;
- Boss random refusé puis pondération : 2 tirages ;
- salle non-random pondérée : 1 tirage.

## Cible stricte du micro-lot 7

Caractériser puis isoler, si une frontière pure et comportement-neutre est prouvée, uniquement la décision de politique Boss generated.

Le lot doit déterminer :
- quelle partie des modes `final / everyN / specific / random` peut devenir une API pure Dungeon ;
- comment préserver strictement la paresse du RNG du mode `random` ;
- comment éviter tout tirage supplémentaire pour `final / everyN / specific / none` ;
- comment laisser la pondération non-Boss au propriétaire existant ;
- comment préserver exactement le fallback vers `pickWeightedGeneratedRoomKind(...)`.

Aucune API cible définitive n'est figée avant caractérisation dédiée GREEN.

## Hors périmètre absolu

Ne pas modifier dans ce lot :
- génération/matérialisation de salle ;
- Room Creator / `DungeonRoomRuntime167822` ;
- `DungeonSpatial313` ;
- branches generated ;
- branches authored / World Builder ;
- événements / spawn ;
- assignation ennemis ;
- coffres / pièges / énigmes ;
- marchands / repos ;
- déplacement case par case ;
- movement allowance / fin de tour ;
- persistance générale Dungeon ;
- déclenchement / résolution combat ;
- Tactical ;
- Survie ;
- Capture ;
- PvP ;
- assets.

## Invariants

1. mêmes salles Boss qu'historiquement ;
2. même priorité entre `final`, `everyN`, `specific`, `random` et pondération non-Boss ;
3. aucun RNG consommé pour les modes Boss déterministes ;
4. mode random : tirage uniquement si `room > 2` ;
5. random Boss réussi : un seul tirage total ;
6. random Boss refusé : un tirage Boss puis un tirage pondération ;
7. `none` ou modes déterministes non déclenchés : un seul tirage pondération ;
8. `pickWeightedGeneratedRoomKind` reste propriétaire de la pondération non-Boss ;
9. authored reste totalement séparé ;
10. aucune dépendance DOM / stockage / timer / observer / listener / Tactical dans une éventuelle API pure ;
11. aucune globale, wrapper, retry ou polling ajouté.

## TDD prévu

1. ajouter une caractérisation GREEN dédiée à la politique Boss actuelle ;
2. raccorder cette caractérisation à Architecture ;
3. obtenir Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. sélectionner UNE frontière pure minimale sur la base de la caractérisation ;
5. écrire UNE garde RED isolée ;
6. prouver que seule cette garde est rouge ;
7. appliquer Rule 26 avant toute modification de `index.html` ;
8. micro-diff minimal ;
9. réaligner les fingerprints historiques un garde à la fois ;
10. triple CI ;
11. aucun test utilisateur si le comportement reste strictement neutre ;
12. fermeture documentaire + checkpoint GREEN final.

## Rule 26

Le présent pré-audit avance uniquement à partir des tests et contrats déjà versionnés.

Dès qu'il faut :
- inspecter la définition exacte courante de `chooseKind(room)` ;
- modifier son propriétaire dans `index.html` ;

alors appliquer Rule 26 sur le HEAD courant :
- résoudre SHA ;
- vérifier taille + blob ;
- fournir le permalink exact ;
- obtenir le ZIP/TXT correspondant ;
- vérifier localement la correspondance ;
- seulement ensuite inspecter/modifier le runtime exact.

La source `work39.zip` est obsolète pour un futur micro-diff : elle correspond au blob précédent `85bf8dcb...`.
