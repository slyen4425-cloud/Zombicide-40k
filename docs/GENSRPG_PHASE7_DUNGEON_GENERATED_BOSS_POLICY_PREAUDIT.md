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

## Caractérisation GREEN

SHA :
`adb9a128b5e4c19ed7d325163687c3679b22f0e8`.

CI :
- Architecture + Browser Chromium : `36421618974` — SUCCESS ;
- Firefox : `36421618917` — SUCCESS ;
- Tactical Dock : `36421619005` — SUCCESS.

Test :
`tests/gens_phase7_dungeon_generated_boss_policy_characterization_v1.test.cjs`.

La caractérisation prouve :

1. priorité historique :
   - final-room si `boss !== 'none'` ;
   - `everyN` ;
   - `specific` ;
   - `random` ;
   - pondération non-Boss ;
2. final/everyN/specific réussis : zéro RNG ;
3. miss déterministe : un RNG de pondération ;
4. random avec `room <= 2` : aucun RNG Boss, un RNG de pondération ;
5. random réussi : un seul RNG total ;
6. random refusé : RNG Boss puis RNG de pondération ;
7. le final-room garde priorité même quand le mode vaut `random` ;
8. `boss:'none'` désactive le Boss final ;
9. `bossEvery:0` conserve le fallback historique à 5 ;
10. `bossEvery<0` conserve le clamp historique via `Math.max(1,...)` ;
11. `bossChance:0` conserve le fallback historique à 13 ;
12. `bossChance<0` est clampée à 0 ;
13. `pickWeightedGeneratedRoomKind(...)` reste l'unique propriétaire de la pondération non-Boss ;
14. authored reste séparé.

## Slice pure sélectionnée

API cible TDD :
`GensDungeonV1.exploration.planGeneratedBossPolicy(room, roomLimit, bossMode, bossEvery, bossRooms, bossChance)`.

Responsabilité UNIQUE :
produire un plan pur de politique Boss sans consommer de RNG.

Sortie cible :
- `{status:'boss', chance:null}` : une règle déterministe impose Boss ;
- `{status:'random', chance:<chance normalisée>}` : le callsite doit effectuer le tirage Boss ;
- `{status:'none', chance:null}` : passer directement à la pondération non-Boss.

Sémantique cible exacte :
- final-room prioritaire si `bossMode !== 'none'` ;
- `everyN` avec `Math.max(1, Number(bossEvery)||5)` ;
- `specific` avec parsing historique de `bossRooms` ;
- `random` seulement pour `room > 2` ;
- chance random `Math.max(0, Number(bossChance)||13)`.

Le callsite Core 2.00 doit conserver :
- l'appel `cfg()` ;
- le `Math.random()` Boss, exécuté uniquement si `status==='random'` ;
- la comparaison `roll*100 < plan.chance` ;
- le `Math.random()` de pondération non-Boss ;
- l'appel à `pickWeightedGeneratedRoomKind(...)`.

Ainsi :
- aucun RNG n'entre dans l'API pure ;
- le final-room en mode random ne consomme toujours aucun RNG ;
- un random refusé consomme toujours exactement deux tirages au total ;
- aucun autre contenu de salle n'entre dans ce lot.

## RED attendu

La future sentinelle doit être rouge uniquement parce que :
- `planGeneratedBossPolicy(...)` n'existe pas encore ;
- Core 2.00 possède encore directement la politique final/everyN/specific/random.

Tous les autres gardes doivent rester GREEN.

Aucun runtime ne sera modifié avant :
1. RED isolé ;
2. Rule 26 sur le HEAD RED exact ;
3. vérification locale du fichier fourni.

