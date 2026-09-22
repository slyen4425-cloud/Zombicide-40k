# GenSrpG — Phase 4 — U1 Core Text Utility v1

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-common-text-utils-contract-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-common-text-utils-contract-2026-09-22`
- Base : `dab3813f5b9af2ea358fe18f707d02e9cf66bbef`
- GREEN de départ : `checkpoint/gensrpg-phase4-progression-earned-skill-points-raccord-green-2026-09-22`
- main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Pré-audit source

Le pré-audit Agent 1 GREEN sur `5d713123585917d55a057373cba7d5003de02e7c`
a démontré qu'aucun Event Bus générique n'est justifié actuellement.

Les mécanismes observés restent la propriété de leurs domaines :
- notification locale Dungeon ;
- lifecycle public Tactical ;
- transport réseau Supabase ;
- DOM/PWA/callbacks locaux.

U1 ne crée donc aucun bus.

## Contrat sélectionné

Fichier :
`assets/gensrpg/core/text-utils-v1.js`

API :
`GensTextUtilsV1.escapeHtml(value)`

Le service doit être :
- déterministe ;
- sans DOM ;
- sans storage ;
- sans état mutable ;
- sans listener/event ;
- sans timer/retry ;
- sans RNG ;
- sans navigation ;
- sans gameplay.

## Sémantique

- nullish -> `""`
- conversion String
- caractères échappés : `& < > " '`
- entités : `&amp; &lt; &gt; &quot; &#39;`
- une chaîne déjà échappée est échappée de nouveau, comme les helpers historiques.

## Inertie obligatoire

Dans ce lot, le service reste hors :
- `index.html` ;
- `preview.html` si présent ;
- workflow Pages ;
- Service Worker ;
- runtime bootstrap.

Aucun consommateur historique n'est modifié.

## TDD

RED : le contrat exige le service absent.

GREEN : créer uniquement le fichier pur.

Lot suivant séparé seulement après GREEN :
pré-auditer puis raccorder un unique consommateur UI à faible risque.
