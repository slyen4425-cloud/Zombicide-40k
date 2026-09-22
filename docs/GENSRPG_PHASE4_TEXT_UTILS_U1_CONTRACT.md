# GenSrpG — Phase 4 — U1 Text Utility contract

Date : 2026-09-22

## Source de décision

Pré-audit Agent 1 :
- SHA `5d713123585917d55a057373cba7d5003de02e7c` ;
- verdict : aucun Event Bus générique ne doit être créé ;
- premier micro-lot sûr : utilitaire texte pur `escapeHtml(value)`.

Le présent lot repart du checkpoint Progression GREEN actuel et ne fusionne pas
l'ancienne branche Agent 1.

## Contrat cible

Fichier :
`assets/gensrpg/core/text-utils-v1.js`.

API publique :
`GensTextUtilsV1.escapeHtml(value)`.

Le nom `GensTextUtilsV1` suit les autres services Core versionnés et évite tout global générique.

## Sémantique

- nullish -> `""` ;
- `String(value)` ;
- échappement des cinq caractères HTML critiques ;
- double échappement historique conservé ;
- pas de décodage ;
- pas de sanitization DOM ;
- pas de politique UI supplémentaire.

## Inertie

Le fichier ne doit être chargé par aucun runtime dans ce lot.
Aucun consommateur historique n'est modifié.

## TDD

RED attendu : fichier/API absents.

GREEN : ajout du fichier pur uniquement.

Le test doit aussi prouver :
- aucune dépendance DOM/storage/timer/event/navigation/gameplay ;
- absence du fichier dans le graphe runtime actif ;
- parité avec au moins deux implémentations historiques représentatives.

## Hors périmètre

- Event Bus ;
- raccord World Builder ;
- raccord Room Creator ;
- Stats ;
- Tactical ;
- refactor de `num`, `clamp`, clone JSON ;
- tout changement `index.html`.
