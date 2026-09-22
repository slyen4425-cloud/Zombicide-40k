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


## Résultat technique

RED :
- SHA `e39fb7d8e342e8ad966714cf79b733cccc52b5b4` ;
- Architecture `35752132656` — FAILURE attendue uniquement car le service n'existait pas ;
- Firefox `35752132452` — SUCCESS ;
- Tactical Dock `35752132630` — SUCCESS.

GREEN technique :
- service créé par `5493854aad6282fdf4d21aa5031ac7e31056fc3d` ;
- cartographie inert réalignée par `a38d73e8c623a14284f1355755d66ed520718d19` ;
- blob service `c84cd370c5c2874a51d5314abbf695fc4a63a7ee`.

Validation sur `a38d73e8c623a14284f1355755d66ed520718d19` :
- Architecture + navigateur complet `35752419473` — SUCCESS ;
- Firefox `35752419299` — SUCCESS ;
- Tactical Dock `35752419364` — SUCCESS.

Le service reste hors graphe production. Le nombre de fichiers production-reachable
reste 78 malgré le passage de 95 à 96 fichiers JS physiques.

Aucun `index.html`, preview, Pages, Service Worker ou consommateur historique
n'a été raccordé.

La clôture documentaire doit encore passer la triple CI sur son propre SHA exact.
Après succès, créer :
`checkpoint/gensrpg-phase4-common-text-utils-contract-green-2026-09-22`.

Le lot suivant doit être un pré-audit séparé d'un unique consommateur UI à faible risque.
