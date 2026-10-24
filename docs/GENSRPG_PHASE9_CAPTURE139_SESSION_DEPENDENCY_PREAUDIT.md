# GenSrpG — Phase 9 — Pré-audit dépendances session Capture139

Date : 2026-10-04

## Base

- Base GREEN : `checkpoint/gensrpg-phase9-capture-pregame-ownership-raccord-green-2026-10-04`
- SHA de base : `8388edf041cb880cc4d85c6e0921ae4058562c48`
- Branche : `work/gensrpg-phase9-capture139-session-dependency-preaudit-2026-10-04`
- Runtime Rule 26 : taille `8167091`, blob `8a42d15ed218895690a3b8490bbe636d9d2d27c6`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission

Caractériser les deux dépendances historiques encore utilisées pendant le démarrage Capture139 :

- `ensureBaseGameProfile()` ;
- `saveActiveEnemies([])`.

Aucune mutation runtime dans ce pré-audit.

## Résultats

### 1. ensureBaseGameProfile()

Le corps exact confirme que cette fonction est un initialiseur / réparateur **Survie + Dungeon** :

- crée/répare `GAME_PROFILE_BASE_ID` ;
- crée/répare `GAME_PROFILE_DUNGEON_ID` ;
- appelle `ensureDungeonContent()` ;
- reconstruit les pools héros, objets, ennemis et decks du profil 40K ;
- reconstruit les pools héros, objets, ennemis, deck et config du profil Dungeon ;
- sauvegarde les profils si nécessaire.

Elle ne contient aucune identité ou logique Capture canonique :

- pas de `GensCaptureV1` ;
- pas de `MC162_ID` ;
- pas de `captureWorldState` ;
- pas de `creatureTeam`.

Capture139 appelle pourtant cette fonction pendant son lancement de session.

Conclusion d'ownership :
**cet appel est une dépendance inter-module historique inutilement large pour Capture.**

### 2. saveActiveEnemies([])

Le propriétaire exact est plus large et plus risqué :

`saveActiveEnemies(a)` :
- écrit `ACTIVE_ENEMIES_KEY` dans `localStorage` ;
- appelle `renderActiveEnemyButtons()` ;
- appelle `updateDungeonExploreButtons()` ;
- appelle `z40kSchedulePush()`.

La fonction est utilisée par de nombreux blocs Dungeon/combat/exploration, dont Core200 et plusieurs stabilisations.

Conclusion d'ownership :
**ne pas contourner ou dupliquer cette responsabilité dans le prochain seam.**
Le reset Capture `saveActiveEnemies([])` reste temporairement inchangé et demandera un pré-audit séparé de l'état ennemi actif / stockage / UI.

## Seam minimal sélectionné

Prochain TDD :

1. retirer uniquement l'appel `ensureBaseGameProfile()` du lancement Capture139 ;
2. conserver `saveActiveEnemies([])` inchangé ;
3. conserver `applyCustomHeroesMulti()`, participants, or pré-game et initialisation du monde Capture inchangés ;
4. conserver la définition `ensureBaseGameProfile()` et tous ses consommateurs légitimes Survie/Dungeon ;
5. ne pas modifier `isDungeonMode()`, `gameStyle:"dungeon"`, Capture138, l'identité Capture, les participants ou le provider public ;
6. aucun nouveau service, wrapper, timer, listener ou fallback.

## RED attendu

La sentinelle du prochain lot devra exiger :

- Capture139 ne référence plus `ensureBaseGameProfile()` ;
- `ensureBaseGameProfile()` reste présent pour Base/Dungeon ;
- son contrat Base/Dungeon n'est pas modifié ;
- Capture139 conserve `saveActiveEnemies([])` ;
- Shell -> `GensCaptureV1.startModuleSession()` -> Capture139 reste inchangé ;
- E2E Capture, vrai Dungeon, Save/Resume et non-interférence restent protégés.

## Validation technique du pré-audit

HEAD technique :
`014b9014ff85b5c4f29d1f5d2421eedf5d145735`

Triple CI :
- Architecture + Browser `37179215011` — SUCCESS ;
- Firefox `37179214856` — SUCCESS ;
- Tactical Dock `37179214893` — SUCCESS.

## Critère Phase 9

**Capture peut démarrer sans runtime Dungeon/Survie actif.**
