# GenSrpG — Phase 7 / Dungeon generated — audit normalisation dc200Branch — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-materialization-audit-green-2026-09-30`

SHA exact de base :
`b546f96a928ade114553790a37b1f07ba8e56b87`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-room-enemy-branch-normalization-audit-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-generated-room-enemy-branch-normalization-audit-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI GREEN documentaire de la base :
- Architecture + Browser `36752651640` — SUCCESS ;
- Firefox `36752651555` — SUCCESS ;
- Tactical Dock `36752651655` — SUCCESS.

Runtime courant :
- `index.html` : `8169442` octets ;
- blob Git : `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

## Position Phase 7

Le micro-lot 31 a extrait uniquement :
`GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind, trapType)`.

Core 2.00 conserve encore dans `createRoom(room,kind)` :
- encounter / Boss ;
- choix du piège ;
- normalisation `dc200Branch` ;
- sauvegarde de la liste d'ennemis ;
- génération de carte ;
- composition finale `{result,map}`.

Le présent lot ne refait ni le lot 31 ni la matérialisation complète.

## Cible stricte du micro-lot 32

Caractériser uniquement la règle historique :

- charger `loadActiveEnemies() || []` ;
- pour chaque ennemi :
  - comparer `Number(enemy.dungeonRoom || 0)` à `Number(room)` ;
  - si la salle correspond ET `enemy.dc200Branch === undefined`, poser `false` ;
- conserver tout marqueur déjà défini, y compris `true`, `false`, `null` ou autre valeur ;
- ne pas toucher aux ennemis d'une autre salle ;
- appeler ensuite `saveActiveEnemies(all)`.

Aucune API cible n'est figée avant caractérisation.

## Risque architectural

La règle de décision `doit recevoir false ou non` est potentiellement pure.

En revanche :
- `loadActiveEnemies()` ;
- la mutation réelle des objets ennemis ;
- `saveActiveEnemies(...)`

sont des effets de stockage/runtime et doivent rester à leur propriétaire tant qu'un lot séparé ne prouve pas leur déplacement.

Il est donc interdit d'extraire le bloc complet stockage + mutation en une nouvelle autorité concurrente.

## Cas limites à verrouiller

La caractérisation doit distinguer :
- `room` number et chaîne numérique ;
- `enemy.dungeonRoom` number et chaîne numérique ;
- salle différente ;
- `dungeonRoom` falsy / absent via le fallback historique `|| 0` ;
- `dc200Branch === undefined` -> devient `false` ;
- `dc200Branch === false` -> reste `false` ;
- `dc200Branch === true` -> reste `true` ;
- `dc200Branch === null` -> reste `null` ;
- liste vide ;
- identité du tableau et des objets conservée si le chemin historique mute in-place ;
- sauvegarde appelée exactement une fois après la normalisation.

## Hors périmètre absolu

Ne pas modifier dans l'audit initial :
- `dungeonEncounter(...)` ;
- `dungeonBossRoom(...)` ;
- choix du piège ;
- résultats non-combat déjà extraits ;
- génération de carte / RNG ;
- spawn / réserve ennemie ;
- système global de stockage ;
- Spatial ;
- Room Runtime ;
- branches generated ;
- politique Boss ;
- authored World Builder ;
- mouvement ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets.

## TDD

1. ajouter une caractérisation dédiée de la normalisation `dc200Branch` ;
2. raccorder la caractérisation à Architecture ;
3. obtenir triple CI GREEN ;
4. à partir de cette preuve, sélectionner UNE responsabilité pure minimale si elle existe ;
5. seulement ensuite poser une sentinelle RED ;
6. aucun changement runtime avant RED isolé.

## Rule 26

L'audit initial n'exige aucune modification de `index.html`.

La caractérisation repose sur la frontière déjà verrouillée par le lot 31.

Toute future modification de `index.html` exige une source Rule 26 correspondant exactement au runtime courant :
- taille `8169442` ;
- blob `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

Aucun nouveau mécanisme global, wrapper, timer, observer ou retry n'est autorisé.
