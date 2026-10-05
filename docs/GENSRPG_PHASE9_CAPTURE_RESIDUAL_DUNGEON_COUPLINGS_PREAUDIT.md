# GenSrpG — Phase 9 — Pré-audit couplages résiduels Capture ↔ Dungeon

Date : 2026-10-05

## Base

- Base GREEN : `a09029a74ac2738a9b867fb67a63ac40a8e8ac6e`
- Checkpoint GREEN : `checkpoint/gensrpg-phase9-capture-seed-dungeon-style-retirement-green-2026-10-05`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-residual-dungeon-couplings-preaudit-2026-10-05`
- Branche : `work/gensrpg-phase9-capture-residual-dungeon-couplings-preaudit-2026-10-05`
- Runtime GREEN : `8167094` octets / blob `4eee0fd1cc1b932cb7cb8b33ca357cf2d55bafeb`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Inventaire actuel

La sentinelle `gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs` sur le runtime final rapporte encore :
- 126 appels historiques à `isDungeonMode()` ;
- plusieurs blocs avec des services Dungeon ;
- mais le seed Capture n'emprunte plus l'identité Dungeon.

Les principaux résidus observés sont :
- `captureFix139` ;
- `gensStability151` ;
- `dungeonCore100ResumeAndInteractionFix` ;
- `dungeonCore310PersistenceAndTokens` ;
- plusieurs blocs Dungeon légitimes qui ne doivent pas être nettoyés globalement.

## Premier couplage concret sélectionné

La sentinelle `gens_phase9_capture_pregame_ownership_raccord_v1.test.cjs` désigne explicitement :

`captureFix139.gensEnsureDungeonAdventureButton139`

comme **propriétaire temporaire unique** du bouton Adventure Dungeon en pré-game.

Ce bloc Capture :
- crée `#sessionDungeonSetupBtn` pour le vrai Dungeon ;
- masque la page `#sessionDungeonSetup` hors vrai Dungeon ;
- wrappe `renderParticipantSelector` ;
- wrappe `updateGameStyleUi` ;
- installe un `setTimeout(...,50)` ;
- est encore appelé depuis `gensStability151`.

La recherche sur le runtime exact confirme :
- `#sessionDungeonSetupBtn` n'est créé nulle part ailleurs ;
- `updatePregameWizard()` possède déjà l'habillage et la visibilité des contrôles du pré-game ;
- cette fonction connaît déjà `captureFamily` et contrôle actuellement la visibilité du bouton s'il existe.

## Décision d'ownership

Responsabilité cible :
**Shell / pré-game**, via `updatePregameWizard()`.

Le bouton Adventure Dungeon est une navigation de pré-game Dungeon. Il ne doit pas être fabriqué par un bloc Capture.

### Seam minimal sélectionné

Transférer uniquement la responsabilité `sessionDungeonSetupBtn` / `sessionDungeonSetup` vers `updatePregameWizard()` :

1. déterminer `realDungeon` avec la sémantique actuelle :
   - profil `gameStyle==="dungeon"` ;
   - id `GAME_PROFILE_DUNGEON_ID` ;
   - non Capture ;
2. si vrai Dungeon et bouton absent : créer le bouton au même emplacement ;
3. sinon : retirer le bouton et masquer la page Dungeon ;
4. retirer de `captureFix139` :
   - `gensEnsureDungeonAdventureButton139` ;
   - wrapper `renderParticipantSelector` associé ;
   - wrapper `updateGameStyleUi` associé ;
   - `setTimeout(gensEnsureDungeonAdventureButton139,50)`.
5. retirer l'appel résiduel à ce helper depuis `gensStability151` si celui-ci ne sert plus qu'à cette autorité transférée.

## Périmètre strictement protégé

Ne pas modifier dans ce seam :
- `openSessionDungeonSetup` ;
- le garde Capture137 autour de cette fonction ;
- le garde inverse de `gensStability151` ;
- lancement Capture139 ;
- `isDungeonMode()` ;
- vrai Dungeon runtime ;
- sauvegardes / reprise ;
- Survie / PvP / Tactical ;
- Combat Dynamique / Exploration / Builder / Map Actor.

Interdit :
- nouveau wrapper ;
- nouveau timer ;
- observer/polling ;
- nouvelle fonction globale de maintenance ;
- remplacement global de `isDungeonMode()`.

## RED TDD attendu

Le test doit exiger simultanément :
- Shell `updatePregameWizard()` propriétaire de la création/retrait du bouton ;
- préservation de la sémantique vrai Dungeon ;
- Capture139 sans helper/wrappers/timer de bouton Dungeon ;
- `gensStability151` sans appel au helper retiré ;
- lancement Capture139 conservé ;
- vrai Dungeon et Capture sentinelles toujours présentes.

Aucune mutation runtime avant constat du RED.


## GREEN — bouton Adventure Dungeon transféré au Shell

Le seam sélectionné a été appliqué sans toucher au runtime Dungeon ni à `isDungeonMode()`.

### Propriétaire final

`updatePregameWizard()` :
- détermine le vrai Dungeon avec la sémantique existante ;
- crée `sessionDungeonSetupBtn` uniquement pour le vrai Dungeon ;
- retire le bouton hors vrai Dungeon ;
- masque `sessionDungeonSetup` hors vrai Dungeon.

### Autorité retirée

`captureFix139` ne contient plus :
- `gensEnsureDungeonAdventureButton139` ;
- `sessionDungeonSetupBtn` ;
- wrapper participant lié au helper ;
- wrapper `updateGameStyleUi` lié au helper ;
- timer de maintenance à 50 ms.

`gensStability151` ne rappelle plus ce helper retiré.

### Runtime

Avant :
- `8167094` octets ;
- blob `4eee0fd1cc1b932cb7cb8b33ca357cf2d55bafeb`.

Après :
- `8166377` octets ;
- blob `37056722bb0a27f96e26b3ef3b05e9543dc5a223`.

### Preuves

Tests permanents :
- `tests/gens_phase9_capture_dungeon_button_owner_transfer_v1.test.cjs` ;
- `tests/gens_phase9_capture_pregame_ownership_raccord_v1.test.cjs`.

Triple CI GREEN sur `6b38b3f5acbd0af6b7a24f2c2a157c8e8bbbdbcf` :
- Architecture `37325483116` — SUCCESS ;
- Firefox `37325483066` — SUCCESS ;
- Tactical `37325483227` — SUCCESS.

Les inventaires Phase 2 ont été réalignés uniquement sur les propriétaires/timers réellement retirés.

### Résultat

Le bloc Capture139 ne fabrique plus ni ne maintient une navigation Dungeon de pré-game.

Aucun wrapper, fallback, observer, polling ou nouvelle identité ajouté.

Prochaine étape : nouveau pré-audit séparé des couplages résiduels réellement exécutés par Capture.
