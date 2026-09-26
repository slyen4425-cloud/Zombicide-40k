# GenSrpG — Phase 7 / Dungeon exploration — plan d’avance générée — pré-audit — 2026-09-26

## Base sûre

- Phase 6 GREEN : `checkpoint/gensrpg-phase6-complete-green-2026-09-26`
- SHA Phase 6 : `4a39617cd1b25f5a52d587e9fa19dd25976a3d3e`
- checkpoint de départ Phase 7 : `checkpoint/gensrpg-start-phase7-dungeon-exploration-2026-09-26`
- branche : `work/gensrpg-phase7-dungeon-exploration-2026-09-26`
- HEAD de caractérisation avant ce micro-lot : `8878d5cbcbda50cb1f5123d187d0952d1b5aafcf`
- production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

La triple CI du HEAD de caractérisation est GREEN :
- Architecture : `36250266761` — SUCCESS ;
- Firefox : `36250266754` — SUCCESS ;
- Tactical Dock : `36250266730` — SUCCESS.

## Règle 26 — fichier exact vérifié

Le ZIP fourni par Sylvain contient le fichier runtime exact.

`index.html` vérifié :
- taille : `8 170 150` octets ;
- blob Git : `ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9` ;
- correspondance confirmée contre `index.html` au SHA `8878d5cb...`.

Aucune ancienne copie n’est utilisée.

## Autorité réelle observée

La première définition historique de `DungeonCore01.explore` mélange déjà garde d’action, progression de salle, génération de contenu, rencontre, piège/coffre/repos, narration, événement, UI et rendu.

Elle n’est toutefois plus l’autorité finale du chemin generated.

Le propriétaire tardif inline `dungeonCore200Rebuild` :
- définit son propre `explore()` ;
- le republie dans `window.DungeonCore01` ;
- affecte directement `#dc01Explore.onclick = explore` dans `mainAction()`.

Le chemin authored est différent et déjà caractérisé :
- `DungeonAuthoredRuntime167839.active() === true` ;
- `#dc01Explore.onclick === DungeonAuthoredRuntime167839.travel` ;
- `travel() -> enterNode()` ;
- le legacy `DungeonWorldRuntime167823` reste désactivé.

Conclusion : generated et authored ne doivent pas être artificiellement fusionnés dans un wrapper commun pendant ce micro-lot.

## Frontière unique retenue

Extraire uniquement le **plan de destination de l’avance generated**.

API cible :
`GensDungeonV1.exploration.planGeneratedAdvance(currentRoom, roomLimit, roomStates)`

Cette fonction pure doit seulement décider :
- `complete` : aucune nouvelle salle à rejoindre ;
- `existing` : la salle suivante possède déjà un snapshot `last` ;
- `create` : la salle suivante doit être créée.

Sortie :
- `status` ;
- `targetRoom` ou `null`.

Elle ne doit :
- ni lire/écrire le stockage ;
- ni toucher au DOM ;
- ni connaître Tactical ;
- ni déplacer un héros ;
- ni générer une salle ;
- ni choisir un type de salle ;
- ni créer ennemi, coffre, piège, événement ou branche ;
- ni rendre l’UI.

## Pourquoi cette frontière

Core 2.00 mélange encore trop de responsabilités pour déplacer `explore()` en bloc.

Le calcul actuellement inline :
- vérifie la fin du nombre de salles ;
- calcule `targetRoom` ;
- distingue ensuite snapshot existant et création.

Cette décision est :
- Dungeon-only ;
- déterministe ;
- sans effet de bord ;
- indépendante de Tactical ;
- indépendante du Builder authored ;
- suffisamment petite pour être déplacée sans changer les règles de contenu.

## Raccord minimal prévu après RED

Seulement après une sentinelle RED isolée :

1. activer `assets/gensrpg/dungeon/entry-v1.js` avec l’API pure `GensDungeonV1.exploration.planGeneratedAdvance` ;
2. mettre à jour le contrat Dungeon en `partial-runtime-loaded` ;
3. charger cette entrée une seule fois avant `dungeonCore200Rebuild` dans le `index.html` source ;
4. faire déléguer uniquement la décision `complete / existing / create` de Core 2.00 à l’API ;
5. conserver le snapshot réel, la persistance, le mouvement, la création de salle, les spawns, événements, coffres, pièges et combats dans leurs propriétaires actuels ;
6. ne modifier aucun fichier authored ;
7. ajouter l’entrée au cache PWA si le load graph l’exige.

## Hors périmètre strict

- `moveTo()` et `DungeonSpatial313` ;
- portée/mouvement restant ;
- `chooseKind()`, `createRoom()`, rencontre/spawn ;
- coffres, pièges, énigmes, branches ;
- événements ;
- combat et Tactical ;
- `DungeonAuthoredRuntime167839.travel/enterNode` ;
- World Builder / Room Creator ;
- Save & Quit détaillé ;
- progression, stats, inventaire, dés ;
- Capture, Survie, PvP ;
- assets/projectiles.

## TDD RED attendu

Avant runtime, la nouvelle sentinelle doit échouer parce que :
- l’entrée Dungeon est encore inerte ;
- `GensDungeonV1.exploration.planGeneratedAdvance` n’existe pas ;
- Core 2.00 calcule encore directement `targetRoom` et le statut du snapshot ;
- l’entrée Dungeon n’est pas chargée/cachée.

Tous les tests historiques hors de cette nouvelle exigence doivent rester inchangés.

## GREEN attendu

- fonction pure et déterministe ;
- parité exacte pour création, salle existante et fin ;
- aucune mutation de l’entrée `roomStates` ;
- entrée chargée une seule fois avant Core 2.00 ;
- Core 2.00 délègue uniquement cette décision ;
- authored reste direct vers `DungeonAuthoredRuntime167839.travel` ;
- aucune dépendance Tactical dans l’entrée Dungeon ;
- Architecture + Browser, Firefox, Tactical Dock GREEN ;
- preview réel + validation utilisateur si un comportement visible change.
