# GenSrpG — Phase 4 / U1 — raccord Room Content UI vers Text Utils

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-text-utils-room-content-ui-raccord-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-text-utils-room-content-ui-raccord-2026-09-22`
- Base : `e2334324130f4b6fe2a1f795c236f12681ff96b1`
- GREEN de départ : `checkpoint/gensrpg-phase4-text-utils-room-content-ui-preaudit-green-2026-09-22`
- main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Source du choix

Le pré-audit a prouvé :
- parité `esc()` / `GensTextUtilsV1.escapeHtml` sur 17 cas ;
- quatre callsites Room Content UI ;
- U1 encore inert ;
- loader actuel sans dépendance Text Utils.

## Raccord minimal

Le loader Room Creator doit charger Text Utils avant Room Content UI.

Room Content UI doit ensuite utiliser exclusivement le Core pour l'échappement HTML,
sans conserver une deuxième implémentation locale.

Le Service Worker doit précacher `./assets/gensrpg/core/text-utils-v1.js`
car Room Content UI était déjà précaché et doit rester utilisable hors ligne après installation.

La source dynamique doit utiliser le même chemin sans query afin que le fallback cache
corresponde exactement au précache existant.

## Interdictions

- aucun index ;
- aucun autre consommateur ;
- aucun fallback de formule locale ;
- aucun timer/retry supplémentaire ;
- aucun Event Bus ;
- aucun changement de l'API U1.
