# GenSrpG — Phase 9 — Raccord autorité identité Capture — 2026-10-03

## Base

- GREEN : `checkpoint/gensrpg-phase9-capture-identity-ownership-preaudit-green-2026-10-03`
- SHA : `c7a693505191621b60a6987871568a1af58df8db`
- start : `checkpoint/gensrpg-start-phase9-capture-identity-authority-raccord-2026-10-03`
- branche : `work/gensrpg-phase9-capture-identity-authority-raccord-2026-10-03`
- main : gelée.

## Contrat

Créer une seule décision Capture/non-Capture : `GensCaptureV1.isProfile(profile)`.

Cette fonction est pure. Elle ne connaît ni Dungeon, ni DOM, ni storage, ni runtime mutable.

Parité historique retenue :
- vrai si `profile.rpgUniverse.gameplay.profile === "creature"` ;
- vrai si `modules.capture && modules.controllableCreatures` ;
- faux sinon.

Le premier seam ne change pas `isDungeonMode()` afin de ne pas modifier en masse ses consommateurs RPG historiques.

## RED attendu

La base GREEN doit échouer car `GensCaptureV1` n'expose pas encore `isProfile(profile)` et les frontières inline utilisent encore directement `gameStyle="dungeon"`.

## Invariants

- un seul owner identité Capture ;
- Shell routing-only ;
- vrai Dungeon inchangé ;
- participants inchangés ;
- Capture139 inchangé ;
- aucun lab ;
- aucun fallback parallèle.
