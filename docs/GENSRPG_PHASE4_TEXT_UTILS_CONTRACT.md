# GenSrpG — Phase 4 / U1 — contrat pur Text Utils

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-text-utils-contract-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-text-utils-contract-2026-09-22`
- Base : `dab3813f5b9af2ea358fe18f707d02e9cf66bbef`
- GREEN de départ : `checkpoint/gensrpg-phase4-progression-earned-skill-points-raccord-green-2026-09-22`
- Production : `main` gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Diagnostic réutilisé

Pré-audit Event Bus / utilitaires Agent 1 :
`checkpoint/gensrpg-phase4-event-bus-utilities-preaudit-agent1-green-2026-09-22`
SHA `5d713123585917d55a057373cba7d5003de02e7c`.

Conclusion : aucun Event Bus générique ne doit être créé actuellement.
Le premier candidat commun sûr est l'échappement HTML pur déjà dupliqué dans plusieurs propriétaires actifs.

## Contrat cible

Fichier :
`assets/gensrpg/core/text-utils-v1.js`

Export :
`GensTextUtilsV1.escapeHtml(value)`

Le service doit être déterministe, sans état, sans DOM et sans dépendance de module.

Matrice minimale :
- null ;
- undefined ;
- chaîne vide ;
- nombres ;
- booléens ;
- texte normal ;
- &, <, >, guillemet double, apostrophe ;
- mélange des cinq caractères ;
- chaîne déjà échappée.

## Lot inert

Ce contrat ne doit être chargé ni raccordé par aucun consommateur dans ce lot.
Aucun `index.html`, preview, Pages, bootstrap ou service worker ne doit être modifié.

## Hors périmètre

- Event Bus ;
- `num`, `clamp`, clone JSON, `arr`, `str` ;
- World Builder ;
- Room Creator ;
- Stats UI ;
- Tactical Stats ;
- tout gameplay ;
- tout stockage/navigation/réseau.

## Critère GREEN

La sentinelle de contrat passe, les trois CI sont GREEN et le diff n'ajoute aucune autorité runtime.


## Résultat technique U1

### RED

SHA `cccbaa37e62b26a0c211e36fdb3d5e24f359e5c5` :
- Architecture `35756339143` — FAILURE attendue, service absent ;
- Firefox `35756339120` — SUCCESS ;
- Tactical Dock `35756339114` — SUCCESS.

### GREEN technique

Service :
`assets/gensrpg/core/text-utils-v1.js`.

Commit :
`b2c4f4b1f8c07e7fc6f5d45766005567638fb465`.

Blob :
`f0befe5feaf3bb2536b9b15267399988c949aab8`.

Le service exporte uniquement :
- `VERSION` ;
- `escapeHtml`.

La cartographie Phase 2 a été mise à jour sur
`9dbe995cfdc5c94062a0d8a218631ddb0f397e49` :
le nouveau fichier est explicitement inert et le graphe production reste à 78 fichiers atteignables.

Validation :
- Architecture + navigateur complet `35756574291` — SUCCESS ;
- Firefox `35756574260` — SUCCESS ;
- Tactical Dock `35756574406` — SUCCESS.

Aucun runtime consommateur n'est raccordé dans U1.
La clôture documentaire doit encore passer la triple CI sur son propre SHA exact.
