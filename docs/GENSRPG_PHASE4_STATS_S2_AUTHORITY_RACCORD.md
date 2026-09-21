# GenSrpG — Phase 4 Core Stats — Raccord d'autorité de normalisation

Date : 2026-09-21

Base GREEN : `d9929477332b9436a3da12fddc2b13777d2b4e0d`.

## Objet

Raccorder `GensStatsNormalizationV1` au propriétaire actif
`GensCleanRpgStats167874` sans modifier les valeurs, dérivées, règles de combat,
UI, persistance ou progression.

## Composition cible

Ordre obligatoire dans GitHub Pages et preview :

1. `gens-world-summary-167820.js`
2. `core/stats-normalization-v1.js`
3. `gens-rpg-stats-clean-167874.js`
4. `gens-dungeon-hero-art-repair-167874.js`
5. `gens-mobile-combat-performance-16781022.js`

Aucun loader dynamique supplémentaire.

## Autorité cible

Le module Core possède :
- ALIAS ;
- slug ;
- canon ;
- normalizeDefinition ;
- isValidTarget ;
- normalizeEffect ;
- compare ;
- effectContribution.

Le propriétaire historique conserve tous les callsites métier mais délègue les
primitives précédentes au Core.

Aucun fallback local n'est autorisé.

## Hors périmètre

- value/baseValue ;
- equipment/talents/challenges ;
- dérivées gameplay ;
- armor/hit/resistances ;
- Tactical snapshot ;
- UI/editor ;
- stockage/migrations ;
- cache performance.

## TDD

La garde
`tests/gens_phase4_stats_s2_authority_raccord_v1.test.cjs`
doit être RED avant raccord puis GREEN après raccord.

Elle vérifie :
- ordre Pages/preview ;
- service Core production-reachable ;
- absence de duplication ALIAS et des normalizers historiques ;
- dépendance Core explicite ;
- parité comportementale chargée Core -> Stats ;
- aucune modification du contrat public Stats.

## Critère de sortie

Architecture+navigateur, Firefox et Tactical Dock GREEN sur le HEAD final,
puis checkpoint dédié. `main` reste inchangé.
