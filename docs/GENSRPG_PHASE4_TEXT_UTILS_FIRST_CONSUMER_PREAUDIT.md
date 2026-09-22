# GenSrpG — Phase 4 / Text Utils — pré-audit premier consommateur

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-text-utils-first-consumer-preaudit-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-text-utils-first-consumer-preaudit-2026-09-22`
- Base : `fb5ad67f13adb97d04533d1cd692a5e6cc75b794`
- GREEN de départ : `checkpoint/gensrpg-phase4-text-utils-contract-green-2026-09-22`
- main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Service Core disponible

`assets/gensrpg/core/text-utils-v1.js`

API :
`GensTextUtilsV1.escapeHtml(value)`.

Le service reste inert et non raccordé au runtime.

## Consommateurs comparés

### World Builder
`assets/dungeon/dungeon-world-builder-167821.js`
- un helper local `esc` ;
- nombreux callsites dans cartes, options, nœuds, connexions et caches.

### Room Creator — sélectionné
`assets/dungeon/dungeon-room-creator-100.js`
- un helper local `esc` ;
- callsites concentrés dans `renderLibrary`, `renderGrid`, `renderStatus` ;
- aucune règle gameplay dans le helper ;
- transformation identique au contrat U1.

### Stats UI
`assets/gensrpg/gens-rpg-stats-clean-167874.js`
- helper pur équivalent ;
- surface Stats plus sensible, non sélectionnée pour le premier raccord.

## Hypothèse à prouver

Le helper Room Creator est un duplicat pur de `GensTextUtilsV1.escapeHtml`.
Le futur raccord minimal pourra remplacer uniquement l'autorité du helper local
sans modifier les données, le rendu fonctionnel ni le cycle du Room Creator.

## Hors périmètre

Aucune modification runtime dans ce pré-audit.
