# GenSrpG — Phase 4 / U1 Text Utils — pré-audit raccord Room Creator

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-text-utils-u1-room-creator-raccord-preaudit-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-text-utils-u1-room-creator-raccord-preaudit-2026-09-22`
- Base : `f3c2d6235bb9db655ec55a4b785c1edb70ea450a`
- GREEN de départ : `checkpoint/gensrpg-phase4-text-utils-u1-contract-green-2026-09-22`
- main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Consommateur sélectionné

`assets/dungeon/dungeon-room-creator-100.js`.

Pourquoi lui :
- UI/Builder, pas gameplay runtime ;
- fichier court et propriétaire clair ;
- helper `esc` pur et local ;
- couverture navigateur Dungeon Builder déjà existante ;
- rollback trivial ;
- pas besoin de toucher au gros `index.html`.

## Sources

Room Creator :
- blob `19c0fff57bfe27648819a12ed657cebe4f41f6df`.

U1 :
- `assets/gensrpg/core/text-utils-v1.js` ;
- blob `d8dd5091963e180a18dfa5274aa4030cbaadaa90`.

## Caractérisation

Le Room Creator contient exactement :
- un helper local `function esc(v)` ;
- 11 occurrences `esc(` définition comprise.

La sémantique locale est identique à U1 :
- nullish -> vide ;
- String ;
- cinq caractères HTML ;
- double échappement conservé.

## Composition

État avant raccord :
- Pages charge Room Creator ;
- preview charge Room Creator ;
- U1 reste absent des deux compositions ;
- U1 reste classé Phase 4 inert.

Le raccord futur devra charger U1 **avant** Room Creator dans les deux compositions.

## Candidat futur

`const TextUtils=ROOT.GensTextUtilsV1;if(!TextUtils)throw new Error("GensTextUtilsV1 must load before DungeonRoomCreator100");const esc=TextUtils.escapeHtml;`

Pas de fallback local autorisé : sinon deux autorités subsisteraient.

## Interdictions

Ce pré-audit ne modifie aucun runtime, consommateur, composition, storage ou gameplay.
