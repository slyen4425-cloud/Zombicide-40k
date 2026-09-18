# GenSrpG — Phase 3 — Structure cible et contrats inertes

Date : 2026-09-18

Branche :
`work/gensrpg-phase3-target-structure-contracts-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase3-target-structure-contracts-2026-09-18`

Base :
`557cc86681053c389ac85c43be87d130586cf502`

## Objectif

Matérialiser l'arborescence cible GenSrpG sans déplacer le gameplay et sans modifier le graphe de production.

## Structure créée

Pour chacun des huit domaines :
- `core`
- `shell`
- `survival`
- `dungeon`
- `tactical`
- `capture`
- `pvp`
- `builders`

Deux fichiers ont été créés :
- `entry-v1.js` — placeholder volontairement inerte ;
- `module-contract-v1.json` — contrat déclaratif de propriété, dépendances autorisées et frontières interdites.

Total : **16 nouveaux fichiers**.

## Invariants

Chaque `entry-v1.js` :
- n'est chargé par aucun chemin production ;
- ne définit aucun global ;
- n'appelle aucun install ;
- ne touche pas au DOM ;
- n'accède à aucun stockage ;
- n'installe aucun observer, listener, timer ou retry ;
- ne contient aucun gameplay.

Chaque contrat :
- déclare le domaine propriétaire ;
- déclare les responsabilités futures ;
- déclare les dépendances publiques autorisées ;
- déclare les frontières interdites ;
- indique explicitement `contract-only-not-loaded`.

## Graphe de production

Avant Phase 3 :
- 72 fichiers JS physiques hérités Phase 2 ;
- 65 fichiers JS atteignables en production ;
- 7 fichiers hors graphe.

Après Phase 3 :
- 80 fichiers JS physiques ;
- 72 fichiers hérités Phase 2 inchangés ;
- 8 placeholders Phase 3 inertes ;
- **65 fichiers JS atteignables en production**, inchangé ;
- 7 anciens fichiers hors graphe, inchangés.

Aucun des 8 placeholders Phase 3 n'est référencé par :
- `index.html` ;
- `preview.html` ;
- `.github/workflows/main.yml` ;
- `assets/gensrpg/core/runtime-bootstrap-v1.js`.

## Sentinelle

Test :
`tests/gens_phase3_target_structure_contracts_v1.test.cjs`

Le test verrouille :
- existence des huit domaines ;
- existence des huit contrats ;
- inertie des huit entrypoints ;
- absence du graphe production ;
- conservation du manifeste Phase 2 des 65 propriétaires runtime.

Le garde Phase 2 du load graph a été adapté pour distinguer :
- baseline historique Phase 2 : 72 ;
- placeholders inertes Phase 3 : 8 ;
- total physique courant : 80 ;
- production atteignable : 65.

## Validation

HEAD fonctionnel validé :
`6efbf37786902bc96a5d0fffc56fbf78291a423b`

CI :
- Architecture `35354649449` — SUCCESS ;
- navigateur complet dans ce run — SUCCESS ;
- Firefox `35354649407` — SUCCESS ;
- Tactical Dock `35354649374` — SUCCESS.

Le navigateur complet confirme notamment :
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- Capture courant ;
- composition Pages complète Capture ;
- non-interférence quatre modules ;
- murs Chromium ;
- preview.

## Résultat

Critère de sortie Phase 3 : **atteint**.

La structure cible existe maintenant physiquement, mais reste volontairement hors production.

Aucun service n'a encore été extrait de `index.html`.

## Étape suivante — Phase 4

Ordre imposé par la roadmap :
1. resolver d'assets ;
2. stockage / migrations ;
3. moteur de stats ;
4. inventaire / équipement / sets ;
5. dés ;
6. progression / XP ;
7. bus d'événements / utilitaires communs.

Le premier chantier Phase 4 doit être **resolver d'assets uniquement**.

Il doit avoir :
- son propre checkpoint de départ ;
- sa propre branche ;
- un périmètre déclaré ;
- une caractérisation du propriétaire actif ;
- une extraction progressive ;
- suppression de l'ancienne autorité uniquement après vrai raccord et validation.


## Validation documentaire finale

HEAD :
`a613fde6d67f20c9b75564faa1f416d98611f12a`

CI :
- Architecture `35354985029` — SUCCESS ;
- navigateur complet dans le même run — SUCCESS ;
- Firefox `35354985012` — SUCCESS ;
- Tactical Dock `35354985051` — SUCCESS.

Ce HEAD ne modifie aucun runtime existant par rapport au HEAD fonctionnel déjà validé ; il ajoute uniquement la documentation de clôture Phase 3.
