# GenSrpG — Phase 7 / Dungeon generated — audit normalisation dc200Branch ennemis — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-generated-room-materialization-audit-green-2026-09-30`

SHA exact de base :
`b546f96a928ade114553790a37b1f07ba8e56b87`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-enemy-branch-normalization-audit-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-generated-enemy-branch-normalization-audit-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36752651640` — SUCCESS ;
- Firefox `36752651555` — SUCCESS ;
- Tactical Dock `36752651655` — SUCCESS.

Runtime courant :
- `index.html` : `8169442` octets ;
- blob Git : `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

## Position Phase 7

Le lot 31 a extrait uniquement :
`GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind, trapType)`.

Core 2.00 conserve encore dans `createRoom(room,kind)` :
- encounter / Boss actifs ;
- choix du piège ;
- lecture des ennemis actifs ;
- normalisation historique `dc200Branch` ;
- sauvegarde des ennemis ;
- décision map on/off ;
- génération de carte ;
- composition finale `{result,map}`.

Le présent lot ne réouvre pas les descripteurs non-combat.

## Cible stricte du micro-lot 32

Caractériser uniquement la décision actuellement inline :

`Number(e.dungeonRoom||0)===Number(room) && e.dc200Branch===undefined`

Cette décision détermine si Core 2.00 pose :
`e.dc200Branch=false`.

Aucune mutation et aucun stockage ne doivent entrer dans l'API pure candidate.

## Responsabilités à préserver

Core 2.00 doit rester propriétaire de :
- `loadActiveEnemies()` ;
- la boucle de mutation des objets ennemis ;
- l'assignation `e.dc200Branch=false` ;
- `saveActiveEnemies(all)` ;
- l'ordre relatif avec encounter/Boss et génération de carte.

Le helper Dungeon candidat ne pourra répondre qu'à la question :
« cet ennemi doit-il être initialisé comme non-branché pour cette salle ? »

## Cas historiques à caractériser

La caractérisation doit verrouiller au minimum :
- même salle numérique : true si marqueur absent ;
- même salle sous forme de chaîne numérique : true ;
- autre salle : false ;
- `dc200Branch=false` existant : false ;
- `dc200Branch=true` existant : false ;
- `dc200Branch=null` existant : false ;
- `dungeonRoom` absent / falsy utilise le fallback historique `||0` ;
- room sous forme chaîne reste comparée via `Number(room)` ;
- valeurs non numériques suivent exactement les coercitions historiques de `Number(...)`.

## API candidate — non figée avant GREEN

Nom envisagé après preuve :
`GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch(enemy, room)`.

Ce nom n'est pas encore une décision de migration.
Aucun RED ne doit être posé avant caractérisation GREEN.

## Hors périmètre absolu

Ne pas modifier dans l'audit initial :
- `loadActiveEnemies()` / `saveActiveEnemies()` ;
- objets ennemis ;
- encounter / Boss ;
- spawn / réserve ;
- génération de carte ;
- pièges/coffres/marchands/repos ;
- branches generated elles-mêmes ;
- Spatial / Room Runtime ;
- authored ;
- mouvement ;
- Tactical/combat ;
- Survival / Capture / PvP ;
- assets ;
- `index.html`.

## Plan TDD

1. ajouter une caractérisation permanente de la décision `dc200Branch` ;
2. raccorder la caractérisation à Architecture ;
3. obtenir Architecture + Browser, Firefox et Tactical Dock GREEN ;
4. seulement ensuite figer ou rejeter l'API pure candidate ;
5. si retenue, poser UNE garde RED dédiée ;
6. vérifier RED isolé ;
7. aucun micro-diff runtime sans Rule 26 sur l'empreinte courante.

## Rule 26

L'audit initial ne nécessite aucune modification de `index.html`.

Toute future modification du gros fichier exige une source exacte correspondant à :
- `8169442` octets ;
- blob `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

Aucune ancienne copie ne doit être utilisée directement comme fichier de sortie courant.


## Caractérisation GREEN de la décision dc200Branch

Test :
`tests/gens_phase7_dungeon_generated_enemy_branch_normalization_characterization_v1.test.cjs`.

SHA :
`090a2d697bec4b617b6a2150f86e0859788a07a0`.

CI :
- Architecture + Browser `36767206870` — SUCCESS ;
- Firefox `36767206854` — SUCCESS ;
- Tactical Dock `36767206806` — SUCCESS ;
- étape dédiée #197 `Caractériser la normalisation dc200Branch des ennemis generated Phase 7` — SUCCESS.

La caractérisation confirme exactement :

- même salle numérique + marqueur absent -> initialisation ;
- salle stockée comme chaîne numérique -> même comportement via `Number(...)` ;
- autre salle -> aucune initialisation ;
- marqueur déjà `false`, `true` ou `null` -> préservé ;
- `dungeonRoom` falsy -> fallback historique `||0` ;
- room chaîne numérique -> comparaison numérique historique ;
- valeurs non numériques -> `NaN===NaN` reste false.

La mutation et la persistance restent observées dans le vrai `createRoom(...)`.

## Slice pure retenue

API cible :
`GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch(enemy, room)`.

Responsabilité unique :
retourner uniquement le booléen historique :

`Number(enemy.dungeonRoom||0)===Number(room) && enemy.dc200Branch===undefined`.

Le helper doit :
- rester pur ;
- ne muter ni `enemy` ni aucune collection ;
- ne lire aucun stockage ;
- ne sauvegarder aucune donnée ;
- ne lire aucune config ;
- ne consommer aucun RNG ;
- ne dépendre d'aucun autre module.

Core 2.00 doit conserver :
- `loadActiveEnemies()` ;
- la boucle sur les ennemis ;
- l'assignation `e.dc200Branch=false` ;
- `saveActiveEnemies(all)` ;
- l'ordre de matérialisation de salle ;
- encounter/Boss ;
- génération de carte.

## Prochaine étape TDD

1. poser UNE garde RED exigeant le helper pur et son raccord exact dans la condition existante ;
2. vérifier RED isolé sur Architecture ;
3. Firefox et Tactical Dock doivent rester GREEN ;
4. aucun micro-diff runtime avant confirmation du RED isolé.


## RED isolé dc200Branch

SHA :
`8d15377dcf49b01a73af105f9d4d1ddd49d9b343`.

CI :
- Architecture `36768712087` — FAILURE attendue uniquement sur #198 `Exiger le propriétaire pur de la normalisation dc200Branch generated Phase 7` ;
- caractérisation #197 — SUCCESS ;
- Browser — SKIPPED uniquement par dépendance au RED Architecture ;
- Firefox `36768712077` — SUCCESS ;
- Tactical Dock `36768712056` — SUCCESS.

Le RED est isolé à l'absence de :
- `GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch(enemy,room)` ;
- son raccord exact dans la condition Core 2.00.

## Rule 26 — micro-diff préparé localement

La source exacte du lot 31 a été reconstruite localement et vérifiée :
- taille `8169442` ;
- blob `a37acaabcb3202a8527c2d545f9e2ff4466ea1db`.

Remplacement borné prévu, occurrence unique :

ancien :
`if(Number(e.dungeonRoom||0)===Number(room)&&e.dc200Branch===undefined)e.dc200Branch=false`

nouveau :
`if(GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch(e,room))e.dc200Branch=false`

Le fichier résultant attendu est vérifié localement :
- taille `8169446` ;
- blob `8a70856f20102270dc7f3553dcef74fe1dc45ad8`.

La mutation `e.dc200Branch=false` reste au callsite Core 2.00.

Prochaine action :
1. ajouter le helper pur à `entry-v1.js` ;
2. appliquer uniquement le remplacement borné ci-dessus dans `index.html` ;
3. mettre à jour uniquement les deux tests du lot pour le nouveau fingerprint ;
4. lancer les tests locaux du lot ;
5. laisser la CI révéler les fingerprints historiques réellement invalidés.
