# GenSrpG — Phase 9 — Pré-audit couplages Capture / identité Dungeon

Date : 2026-10-03

## Base

- Base GREEN : `checkpoint/gensrpg-phase9-capture-participant-identity-raccord-green-2026-10-03`
- SHA de base : `0912042b13c9c0f3b2a3b151e43137463b644b28`
- Branche : `work/gensrpg-phase9-capture-dungeon-identity-coupling-preaudit-2026-10-03`
- Runtime Rule 26 : `index.html` taille `8168810`, blob `a5d337ae25435d801a72333ee27e6dbc390a5175`
- Production `main` reste gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission

Inventorier les chemins où Capture reste encore mêlé à l'identité ou aux services historiques Dungeon, sans mutation runtime, puis sélectionner un seul seam minimal pour le prochain TDD.

## Faits confirmés

### Déjà découplé

- Autorité d'identité Capture : `GensCaptureV1.isProfile(profile)`.
- Frontières Shell/pré-game/fiche/ContentFamily/modules déjà raccordées à cette autorité.
- Participants Capture : `normalizeGameParticipants()` utilise l'identité Capture explicite.
- `availableParticipantHeroIds()` n'hydrate plus Dungeon pour Capture.
- `allowedHeroIdsForActiveProfile()` conserve `profile.heroPool` comme source canonique Capture.

### Dette d'identité restante

Le runtime contient encore 126 appels `isDungeonMode()`.

Le seed Monster Capture garde encore :
- `gameStyle:"dungeon"` ;
- mais possède aussi ses marqueurs Capture explicites : `profile:"creature"`, `capture:true`, `controllableCreatures:true`.

Le retrait global de `gameStyle:"dungeon"` n'est donc **pas** autorisé dans le prochain lot : trop de consommateurs historiques restent à classer.

### Six blocs repérés par le scan identité

1. `dungeonMj72_2Script`
2. `captureFix139`
3. `gensStability151`
4. `builtinMonsterCapture162`
5. `dungeonCore100ResumeAndInteractionFix`
6. `dungeonCore310PersistenceAndTokens`

Classification :

- `gensStability151` : correct — teste d'abord `GensCaptureV1.isProfile`, puis Dungeon.
- `dungeonCore310PersistenceAndTokens` : correct — calcule `dungeon=isDungeonMode()&&!capture`.
- `dungeonCore100ResumeAndInteractionFix` : vrai Dungeon — combine `gameStyle="dungeon"` avec la famille RPG.
- `captureFix139` : le test du vrai Dungeon combine `gameStyle`, l'ID canonique `GAME_PROFILE_DUNGEON_ID` et l'exclusion de la famille creature ; ce test ne classe pas Capture comme Dungeon.
- `dungeonMj72_2Script` : mélange économie/MJ et flag Capture ; dette séparée, à ne pas toucher dans le prochain micro-lot.
- `builtinMonsterCapture162` : dette d'identité brute restante (`gameStyle:"dungeon"`), mais migration différée tant que les consommateurs historiques ne sont pas tous neutralisés.

## Conflit d'ownership UI pré-game identifié

Trois couches possèdent encore la même responsabilité : afficher/masquer le bouton/page Aventure Dungeon lorsque Capture est actif.

### Capture137

- wrapper de `openSessionDungeonSetup` pour bloquer Capture ;
- `cleanDungeonPregame137()` masque `sessionDungeonSetupBtn` / `sessionDungeonSetup` ;
- wrapper de `updateGameStyleUi` ;
- timer de nettoyage.

### Capture138

- `captureCleanDungeonUi138()` masque les mêmes éléments ;
- wrapper de `renderParticipantSelector` ;
- wrapper de `updateGameStyleUi` ;
- `DOMContentLoaded` + timers de nettoyage.

### Capture139

- `gensEnsureDungeonAdventureButton139()` sait déjà créer le bouton Aventure **uniquement pour le vrai profil Dungeon** et le retirer sinon ;
- réagit également à `renderParticipantSelector` / `updateGameStyleUi`.

Cela constitue une multi-autorité UI historique contraire à la charte.

## Prochain seam sélectionné

**Consolider l'ownership du bouton/page Aventure Dungeon dans le pré-game :**

1. conserver `captureFix139.gensEnsureDungeonAdventureButton139()` comme propriétaire temporaire unique de cette UI ;
2. retirer uniquement les nettoyages UI redondants de Capture137 :
   - `cleanDungeonPregame137` ;
   - son wrapper `updateGameStyleUi` ;
   - son timer associé ;
3. retirer uniquement les nettoyages UI redondants de Capture138 :
   - `captureCleanDungeonUi138` ;
   - ses wrappers `renderParticipantSelector` / `updateGameStyleUi` liés à cette fonction ;
   - ses listeners/timers liés à ce nettoyage ;
4. conserver les autres responsabilités de 137/138 inchangées ;
5. conserver le garde `openSessionDungeonSetup` de 137 dans ce premier seam tant qu'un test dédié n'autorise pas son retrait ;
6. ne pas modifier `isDungeonMode()`, le seed `gameStyle`, Capture139 session init, l'économie/MJ, Combat Dynamique ou Exploration.

## TDD suivant

RED dédié à écrire avant runtime :

- en Capture, aucun ancien cleanup 137/138 ne possède le bouton/page Dungeon ;
- aucun wrapper/timer 137/138 n'est nécessaire pour maintenir cette visibilité ;
- en vrai Dungeon, le bouton Aventure reste créé et utilisable ;
- Capture garde le pré-game propre ;
- `captureFix139` reste l'unique propriétaire temporaire de cette frontière UI ;
- E2E Capture, Dungeon, Save/Resume et quatre modules restent GREEN.

## Critère Phase 9 inchangé

**Capture peut démarrer sans runtime Dungeon/Survie actif.**
