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


## Résultat de caractérisation

Consommateur sélectionné :
`assets/dungeon/dungeon-room-creator-100.js`.

Fingerprint protégé :
`19c0fff57bfe27648819a12ed657cebe4f41f6df`.

Text Utils U1 :
- fichier : `assets/gensrpg/core/text-utils-v1.js` ;
- blob : `f0befe5feaf3bb2536b9b15267399988c949aab8`.

Inventaire Room Creator :
- 1 définition locale `esc(v)` ;
- 10 callsites ;
- `renderLibrary` : 7 ;
- `renderGrid` : 1 ;
- `renderStatus` : 2 ;
- aucun callsite hors de ces trois fonctions de rendu.

La matrice de parité compare le helper local réel à
`GensTextUtilsV1.escapeHtml` sur null, undefined, chaînes, nombres, booléens,
les cinq caractères HTML, double échappement, Unicode et objet avec `toString`.
Parité attendue : exacte.

### Composition

État actuel :
- GitHub Pages charge Room Creator mais pas Text Utils ;
- `preview.html` charge Room Creator mais pas Text Utils ;
- U1 reste donc inert.

Un futur raccord minimal devra, dans un lot séparé :
1. charger `text-utils-v1.js` avant `dungeon-room-creator-100.js` dans Pages ;
2. reproduire le même ordre dans `preview.html` ;
3. remplacer uniquement le corps du helper local par
   `return GensTextUtilsV1.escapeHtml(v)` ;
4. ne modifier aucune donnée, sauvegarde, grille ou règle Builder.

Ce pré-audit ne modifie aucun runtime.
