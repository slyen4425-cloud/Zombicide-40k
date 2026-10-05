# GenSrpG — Phase 9 — Prochain couplage résiduel Capture / Dungeon

Date : 2026-10-05

## Base

- Base GREEN : `4331c7b00e98d1ed629146e688fef6a1ca249386`
- Checkpoint GREEN : `checkpoint/gensrpg-phase9-capture-dungeon-pregame-button-owner-transfer-green-2026-10-05`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture-next-residual-dungeon-coupling-preaudit-2026-10-05`
- Branche : `work/gensrpg-phase9-capture-next-residual-dungeon-coupling-preaudit-2026-10-05`
- Runtime : `8166377` octets / blob `37056722bb0a27f96e26b3ef3b05e9543dc5a223`
- Production main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Inventaire GREEN

La sentinelle `gens_phase9_capture_dungeon_identity_coupling_preaudit_v1.test.cjs` rapporte encore 126 appels historiques à `isDungeonMode()`, mais ceux-ci ne sont pas à nettoyer globalement.

Blocs d'identité résiduels observés :
- `dungeonMj72_2Script` ;
- `gensStability151` ;
- `dungeonCore100ResumeAndInteractionFix` ;
- `dungeonCore310PersistenceAndTokens`.

Blocs de services Dungeon vus statiquement depuis des zones Capture/Dungeon :
- `captureFix137` ;
- `captureFix139` ;
- `gensStability151` ;
- plusieurs vrais blocs Dungeon.

## Candidat prioritaire

`captureFix137` conserve un wrapper autour de `openSessionDungeonSetup()` :

- le wrapper bloque l'entrée quand `gensCapturePregameMode()` est vrai ;
- le bouton Dungeon lui-même n'appartient plus à Capture : `updatePregameWizard()` en est l'autorité GREEN ;
- le nettoyage visuel Capture137/Capture138 a déjà été retiré ;
- `gensStability151` possède également une garde autour de la même entrée.

Ce candidat semble être une autorité inter-module résiduelle, mais son retrait n'est PAS encore autorisé.

## Questions d'ownership à résoudre

1. Où se trouve la définition propriétaire de `openSessionDungeonSetup()` ?
2. Cette définition possède-t-elle déjà une garde vrai Dungeon / Capture ?
3. Quelle responsabilité exacte garde V151 ?
4. Le wrapper Capture137 est-il redondant, ou protège-t-il encore un chemin programmatique réel ?
5. Le propriétaire correct doit-il être Shell/pré-game ou Dungeon ?

## Périmètre protégé

Ne pas modifier avant preuve :
- `openSessionDungeonSetup()` ;
- Capture137 ;
- garde V151 ;
- `isDungeonMode()` ;
- vrai Dungeon runtime ;
- sauvegarde/reprise ;
- Survie / PvP / Tactical ;
- Combat Dynamique / Exploration / Builder / Map Actor.

Interdit :
- suppression du wrapper sans test ;
- nouveau wrapper/fallback/timer/observer/polling ;
- remplacement global de `isDungeonMode()`.

## Rule 26

L'inspection inline exacte est désormais nécessaire pour déterminer la chaîne de propriétaires.
Le fichier utilisateur doit correspondre exactement au HEAD courant avant sélection du seam.
