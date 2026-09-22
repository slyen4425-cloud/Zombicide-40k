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
