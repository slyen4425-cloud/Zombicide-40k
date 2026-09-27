# GenSrpG — Phase 7 / Dungeon exploration — gate de présence des branches generated — pré-audit — 2026-09-27

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27`

SHA exact de base :
`49289784ee92a47fd51089815ca25954cdba4493`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-branch-chance-gate-2026-09-27`

Branche :
`work/gensrpg-phase7-dungeon-generated-branch-chance-gate-2026-09-27`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN de la base :
- Architecture + Browser : `36324103034` — SUCCESS ;
- Browser sentinel du même run — SUCCESS ;
- Firefox : `36324103113` — SUCCESS ;
- Tactical Dock : `36324103013` — SUCCESS.

Runtime de base :
- `index.html` : `8170062` octets ;
- blob Git : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

## Position dans la Phase 7

Les slices generated déjà propriétaires Dungeon dans `GensDungeonV1.exploration` sont :

1. `planGeneratedAdvance(currentRoom, roomLimit, roomStates)` ;
2. `pickWeightedGeneratedRoomKind(roomWeights, roll)` ;
3. `buildGeneratedRoomTransition(heroId, fromRoom, toRoom, created, at)` ;
4. `pickWeightedGeneratedBranchType(branchWeights, roll)`.

Le micro-lot précédent a prouvé et conservé l'ordre exact de `maybeSpecialBranch(x)` :
1. map valide ;
2. lecture config ;
3. premier RNG de présence ;
4. comparaison à `specialBranchChance` ;
5. `nearestFree(x)` ;
6. second RNG de type ;
7. sélection pondérée via `pickWeightedGeneratedBranchType` ;
8. `addDungeonSceneElement(...)` ;
9. mutation `m.cells[i]='trapdoor'`.

## Cible stricte du micro-lot 5

Isoler uniquement la décision pure :
**un roll de présence autorise-t-il la tentative de branche generated selon `specialBranchChance` ?**

API cible proposée après caractérisation GREEN :
`GensDungeonV1.exploration.shouldCreateGeneratedBranch(specialBranchChance, roll)`

Responsabilité unique :
- normaliser la chance exactement comme aujourd'hui ;
- comparer `Number(roll)*100` au seuil ;
- retourner un booléen.

L'API ne génère aucun RNG elle-même.

## Hors périmètre absolu

Ne pas déplacer/modifier :
- `nearestFree(x)` ;
- le second `Math.random()` de type ;
- `pickWeightedGeneratedBranchType(...)` ;
- `addDungeonSceneElement(...)` ;
- les libellés treasure/boss/secret ;
- `m.cells[i]='trapdoor'` ;
- assignation ennemis / événements / spawn ;
- mouvement / Spatial / RoomRuntime ;
- authored World Builder et branches authored ;
- coffres / pièges / énigmes ;
- Tactical / combat ;
- Survie / Capture / PvP ;
- assets.

## Invariants

- une map absente ne consomme aucun RNG ;
- le premier RNG reste au callsite historique ;
- un rejet de chance consomme exactement un RNG et s'arrête avant `nearestFree` ;
- un succès de chance poursuit vers `nearestFree` sans consommer encore le RNG de type ;
- seuil exact : un roll tel que `roll*100 >= chance` est rejeté ;
- chance négative/invalides reste normalisée par `Math.max(0, Number(value)||0)` ;
- authored reste séparé ;
- aucun DOM / stockage / timer / observer / listener / Tactical dans l'API pure ;
- aucun wrapper, retry, polling ou nouvelle globale.

## TDD

1. ajouter une caractérisation dédiée GREEN du gate de présence ;
2. raccorder cette caractérisation à Architecture ;
3. vérifier Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. ajouter ensuite UNE sentinelle RED exigeant l'API pure et son consommateur unique ;
5. prouver que seule cette garde devient RED ;
6. seulement ensuite modifier le runtime exact ;
7. réaligner les fingerprints historiques un par un ;
8. triple CI ;
9. aucun test utilisateur si le comportement reste strictement neutre ;
10. checkpoint GREEN final.

## Rule 26

Le runtime exact ne doit pas être relu/modifié via le connecteur GitHub.

Dès le passage du RED au micro-diff runtime, utiliser exactement le fichier :
- SHA : `49289784ee92a47fd51089815ca25954cdba4493`
- permalink : `https://github.com/slyen4425-cloud/Zombicide-40k/blob/49289784ee92a47fd51089815ca25954cdba4493/index.html`
- taille attendue : `8170062`
- blob attendu : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

Aucune ancienne copie Rule 26 ne doit être utilisée sans vérification.


## Caractérisation GREEN

SHA :
`37e1799ff8202331ec556ada295420d76eb20970`.

CI :
- Architecture + Browser : `36330176254` — SUCCESS ;
- Firefox : `36330176237` — SUCCESS ;
- Tactical Dock : `36330176229` — SUCCESS.

La caractérisation confirme :
- le gate historique est `roll*100 < Math.max(0, Number(specialBranchChance)||0)` ;
- une map absente consomme zéro RNG ;
- le premier RNG reste avant `nearestFree` ;
- le second RNG reste après `nearestFree` ;
- la matérialisation reste dans Core 2.00.

## RED isolé — prouvé

SHA RED :
`b6455906c6583eaeb01f093633d6d5bf6bac28d7`.

CI :
- Architecture : `36330996836` — FAILURE attendue ;
- Firefox : `36330996759` — SUCCESS ;
- Tactical Dock : `36330996997` — SUCCESS.

Les gardes Phase 7 #181 à #189 restent SUCCESS.
La seule nouvelle dette est #190 :
`Exiger le gate Dungeon de présence des branches generated Phase 7`.

Erreur attendue :
`Phase 7 micro-lot 5 requires Dungeon-owned generated branch chance gate`.

## Candidat runtime appliqué

Rule 26 vérifiée sur `work37.zip / index37.txt` :
- taille source : `8170062` octets ;
- blob source : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

One-shot final :
- run `36331320227` — SUCCESS ;
- workflow temporaire auto-retiré dans le commit runtime.

SHA runtime :
`951d659f83c373f4628ad73e128dadfd15b38829`.

Runtime cible vérifié par le one-shot :
- `index.html` : `8170090` octets ;
- blob Git : `85bf8dcb0ad22d596e648f4992210d870520d6f9`.

Micro-diff :
- ajout de `GensDungeonV1.exploration.shouldCreateGeneratedBranch(specialBranchChance, roll)` ;
- aucun `Math.random()` dans l'API ;
- premier RNG toujours au callsite Core 2.00 ;
- `nearestFree(x)` reste après acceptation du gate ;
- second RNG de type reste après `nearestFree(x)` ;
- pondération du type reste dans `pickWeightedGeneratedBranchType(...)` ;
- `addDungeonSceneElement(...)` et `m.cells[i]='trapdoor'` restent dans Core 2.00 ;
- authored, Spatial, RoomRuntime, spawn, ennemis et Tactical restent inchangés.

Les tests fingerprintés historiques doivent maintenant être réalignés un garde à la fois vers le nouveau blob, sans assouplir leurs assertions métier.

## Fermeture candidate GREEN

SHA technique GREEN final :
`9dbded033d9103e7af3bfd9e10f8a79d14e3eb5c`.

CI complète :
- Architecture + Browser : `36345202167` — SUCCESS ;
- Firefox : `36345202158` — SUCCESS ;
- Tactical Dock : `36345202183` — SUCCESS.

Runtime final :
- `index.html` : `8170090` octets ;
- blob Git : `85bf8dcb0ad22d596e648f4992210d870520d6f9`.

Résultat :
- `GensDungeonV1.exploration.shouldCreateGeneratedBranch(specialBranchChance, roll)` possède uniquement la décision pure de présence ;
- le premier RNG reste explicite au callsite Core 2.00 ;
- `nearestFree(x)` reste au propriétaire historique et n'est évalué qu'après acceptation ;
- le second RNG de type reste après `nearestFree(x)` ;
- `pickWeightedGeneratedBranchType(...)` reste le propriétaire du calcul pondéré du type ;
- la matérialisation `addDungeonSceneElement(...)` et `m.cells[i]='trapdoor'` restent dans Core 2.00 ;
- authored / Spatial / RoomRuntime / événements-spawn / ennemis / Tactical / Survie / Capture / PvP restent hors de ce micro-lot ;
- les fingerprints historiques invalidés par le nouveau blob ont été réalignés un garde à la fois ;
- aucune assertion fonctionnelle ou métier n'a été assouplie ;
- Architecture, Browser Chromium, Firefox et Tactical Dock sont GREEN sur le même SHA technique ;
- le Browser E2E `Dungeon après Survie` a été rendu déterministe côté fixture de test après preuve d'une flakiness RNG : une salle `ambush` pouvait ouvrir Tactical automatiquement et produire `battle-already-open`, tandis que le même runtime passait avec une salle `chest` ;
- la stabilisation fixe temporairement le RNG uniquement dans la fixture lors de la génération de la première salle ; aucun RNG production, gameplay ou runtime n'est modifié et aucune erreur n'est masquée ;
- aucun changement utilisateur visible : aucun test utilisateur supplémentaire requis.

Checkpoint final prévu après CI du présent SHA documentaire :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-chance-gate-green-2026-09-27`.

## Prochaine action obligatoire

1. valider cette fermeture documentaire par Architecture + Browser, Firefox et Tactical Dock ;
2. si tout est SUCCESS, créer le checkpoint final exact ci-dessus ;
3. ouvrir seulement ensuite le prochain micro-lot Phase 7 depuis ce checkpoint GREEN ;
4. rester dans `Dungeon exploration / salles / branches` et pré-auditer avant toute modification runtime ;
5. appliquer Rule 26 dès qu'une nouvelle inspection exacte de `index.html` est nécessaire.

