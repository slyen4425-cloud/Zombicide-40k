# GenSrpG — Phase 7 / Dungeon movement — allowance à l'entrée authored — pré-audit — 2026-09-28

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-branch-descriptor-green-2026-09-28`

SHA exact de base :
`cdc939b810edf918f6eeee537da9b5d5488a5ac8`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-entry-movement-allowance-2026-09-28`

Branche :
`work/gensrpg-phase7-dungeon-entry-movement-allowance-2026-09-28`

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

La roadmap Phase 7 demande d'isoler successivement :
- exploration ;
- salles / branches ;
- déplacement ;
- événements / spawn ;
- portes / coffres / pièges / énigmes ;
- déclenchement de combat ;
- persistance Dungeon.

Les micro-lots 1 à 6 ont fermé la tranche generated exploration / salles / branches.

Le présent micro-lot ouvre la tranche **movement** par une règle pure et étroite, sans déplacer le mouvement effectif.

## Propriétaires observés

### DungeonAuthoredRuntime167839

Le runtime authored possède actuellement :
- `heroMoveAllowance(id)` : lecture de l'allowance via le runtime/statistiques existants ;
- `movementForEntry(x, hero)` :
  - si `x.remaining[hero]` est numérique/fini, conserver cette valeur en la clampant à zéro minimum ;
  - sinon reprendre `heroMoveAllowance(hero)` ;
- `enterNode(...)` consomme cette valeur pour initialiser `x.remaining[hero]` dans une nouvelle salle ou une salle restaurée.

### DungeonSpatial313

Reste propriétaire de :
- `ensure` ;
- `persist` ;
- `setRoom` ;
- `activate` ;
- snapshots spatiaux / positions / room state.

### Décorateurs authored adjacents

Restent hors lot :
- `DungeonAuthoredReturnPersist167862` ;
- `DungeonAuthoredActionFix167857` ;
- `DungeonAuthoredEventCells167877`.

## Cible stricte du micro-lot 7

Isoler uniquement la règle pure de résolution de l'allowance d'entrée.

API cible proposée après caractérisation GREEN :
`GensDungeonV1.movement.resolveEntryAllowance(remainingValue, fallbackAllowance)`

Sémantique historique à préserver :
- valeur restante finie -> `Math.max(0, Number(remainingValue))` ;
- valeur restante absente / non finie -> fallback déjà calculé par le runtime authored ;
- le helper pur ne lit ni héros, ni stats, ni config, ni stockage.

Le runtime authored restera propriétaire de :
- `heroMoveAllowance(hero)` ;
- la lecture de `x.remaining[hero]` ;
- l'appel du helper pur ;
- l'affectation finale `x.remaining[hero]=movement`.

## Hors périmètre absolu

Ne pas déplacer/modifier :
- déplacement de case à case ;
- validation de destination / pathfinding ;
- `DungeonSpatial313` ;
- positions ;
- room snapshots ;
- `heroMoveAllowance` ;
- stats de mouvement ;
- fin de tour / consommation du mouvement ;
- événements / spawn ;
- coffres / pièges / énigmes ;
- sorties / navigation World Builder ;
- Tactical / combat trigger ;
- Survie / Capture / PvP ;
- DOM / listeners / timers / observers ;
- persistance / storage.

## Invariants

- remaining `2` -> `2` ;
- remaining `0` -> `0` ;
- remaining `-3` -> `0` ;
- remaining `"2"` -> `2` ;
- remaining `undefined` -> fallback ;
- remaining `null` conserve la sémantique historique de `Number(null)` fini, donc `0` ;
- remaining `"bad"` -> fallback ;
- le fallback n'est pas recalculé dans le helper ;
- aucun accès DOM/storage/global/Tactical ;
- le helper retourne un nombre et ne mute aucun input ;
- `enterNode` garde exactement ses deux affectations authored existantes ;
- `DungeonSpatial313.persist/activate` restent inchangés.

## TDD obligatoire

1. ajouter une caractérisation GREEN de `movementForEntry` historique ;
2. raccorder cette caractérisation à Architecture ;
3. valider Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. ajouter UNE garde RED exigeant `GensDungeonV1.movement.resolveEntryAllowance(...)` et son consommateur authored ;
5. prouver le RED isolé ;
6. appliquer le micro-diff minimal dans `assets/gensrpg/dungeon/entry-v1.js` et `assets/dungeon/dungeon-authored-runtime-167839.js` ;
7. mettre à jour le contrat Dungeon ;
8. triple CI ;
9. aucun test utilisateur si comportement strictement neutre ;
10. fermeture documentaire + checkpoint GREEN final.

## Rule 26

Le micro-lot cible deux fichiers JS modulaires et ne nécessite pas de modifier `index.html`.

Tant que `index.html` reste byte-identical :
- aucune nouvelle source Rule 26 n'est nécessaire.

Si une modification d'`index.html` devient nécessaire, le chantier s'arrête avant ce changement et Rule 26 s'applique.
