# GenSrpG — Phase 4 / U1 Core Text Utility — contrat pur escapeHtml

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-text-utils-u1-contract-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-text-utils-u1-contract-2026-09-22`
- Base : `dab3813f5b9af2ea358fe18f707d02e9cf66bbef`
- GREEN de départ : `checkpoint/gensrpg-phase4-progression-earned-skill-points-raccord-green-2026-09-22`
- `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Origine

Le pré-audit Event Bus / utilitaires d'Agent 1 a conclu qu'un Event Bus générique serait
une nouvelle autorité transverse spéculative et qu'il ne devait pas être créé.

Le premier candidat commun réellement sûr est l'échappement HTML pur, déjà dupliqué
dans plusieurs propriétaires actifs.

Référence du pré-audit :
`5d713123585917d55a057373cba7d5003de02e7c`.

## Contrat U1

Fichier cible :
`assets/gensrpg/core/text-utils-v1.js`.

API :
`GensTextUtilsV1.escapeHtml(value)`.

Le service est déterministe, sans DOM, sans stockage, sans état mutable, sans RNG,
sans listener, sans event dispatch, sans timer/retry, sans navigation et sans gameplay.

Sémantique :
- nullish -> chaîne vide ;
- conversion String ;
- échappement des cinq caractères `& < > " '` ;
- autres caractères inchangés ;
- double échappement préservé.

## Inertie obligatoire

Ce contrat ne doit être chargé par aucun runtime dans ce lot.
Aucun consommateur existant n'est modifié.

Un futur raccord devra être un lot séparé, avec un seul consommateur UI à faible risque.

## Hors périmètre

Event Bus, World Builder, Room Creator, Stats UI, Tactical UI, index, preview, Pages,
Service Worker et tous les services Core déjà GREEN.


## Résultat technique

TDD RED :
- SHA `228a01f214107ffb3768da1ab3e1417d0b12bc75` ;
- Architecture `35759386423` — FAILURE attendue ;
- Firefox `35759386339` — SUCCESS ;
- Tactical Dock `35759386354` — SUCCESS.

Implémentation :
- commit `76790f0cdb850817e502e9152590ccb8889c1805` ;
- fichier `assets/gensrpg/core/text-utils-v1.js` ;
- blob `d8dd5091963e180a18dfa5274aa4030cbaadaa90`.

Réalignement cartographie :
- commit `c6d3bb8d8ea4ed38c0209cdf6eed9d6a5251f72c` ;
- inventaire physique : 16 services Phase 4 ;
- U1 classé inert ;
- graphe production inchangé.

Validation technique :
- Architecture + navigateur complet `35759686674` — SUCCESS ;
- Firefox `35759686682` — SUCCESS ;
- Tactical Dock `35759686698` — SUCCESS.

Aucun raccord consommateur n'a été réalisé dans ce lot.
Aucun Event Bus n'a été créé.

La clôture documentaire doit maintenant repasser la triple CI sur son SHA exact.
Après succès, créer :
`checkpoint/gensrpg-phase4-text-utils-u1-contract-green-2026-09-22`.
