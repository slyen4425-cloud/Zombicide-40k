# GenSrpG — Travail courant

## Référence obligatoire

Lire avant tout changement :
1. `docs/GENSRPG_CHARTE.md`
2. `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`
3. ce fichier
4. `docs/GENSRPG_COORDINATION.md`
5. `docs/GENSRPG_PHASE1_SENTINEL_AUDIT.md`

## Production sûre

- `main` gelé : V16.78.114.11
- SHA attendu : `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- ne jamais travailler directement sur `main`

## Dernier checkpoint vert

Phase 2 — cartographie runtime initiale :
`checkpoint/gensrpg-phase2-runtime-cartography-initial-green-2026-09-18`

SHA :
`d247b277ebadc0457b9ff463993d5fd3bafae7b8`

CI :
- Architecture `35326145505` — SUCCESS
- Firefox `35326145516` — SUCCESS
- Tactical Dock `35326145484` — SUCCESS

Livrables déjà verts :
- `docs/GENSRPG_PHASE2_RUNTIME_CARTOGRAPHY.md`
- `tests/gens_phase2_runtime_load_graph_v11411.test.cjs`

## Chantier courant

**Phase 2 — 2A : cartographie des autorités globales actives**

Branche :
`work/gensrpg-phase2-runtime-map-2a-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase2-global-authority-cartography-2026-09-18`

Base exacte :
`d247b277ebadc0457b9ff463993d5fd3bafae7b8`

## Périmètre déclaré

Lot documentaire/diagnostic uniquement.

Objectifs :
- dresser la table `fonction globale/protégée -> wrappers successifs -> propriétaire final actif` ;
- distinguer les wrappers réellement installés du code dormant ;
- cartographier les accès directs à `localStorage` et IndexedDB par domaine ;
- identifier les responsabilités encore réellement dupliquées ;
- vérifier si les fichiers hors graphe principal sont legacy, tooling/tests ou points d'entrée alternatifs ;
- préparer l'ordre des futurs nettoyages sans en appliquer aucun dans ce lot.

## Fonctions/domaines prioritaires à cartographier

- navigation Shell : `openGensFamily`, `openGensBuiltInGame`, `resumeGame`, `isDungeonMode` ;
- dés : `animateDice`, `animateRpgDice` ;
- combat Dungeon/Tactical : `dc200StartCombat`, adapter `createBattle`, fonctions d'entrée Bridge ;
- déplacement/détection : `dungeonMoveHero098` et hooks V113 ;
- dégâts/équipement : `applyDungeonAttackDamage`, `dungeonEquipmentBonus` ;
- sauvegarde/persistance : fonctions `save*`, runtime Dungeon, profils, sessions ;
- rendu fiche/navigation globale uniquement si des wrappers actifs sont prouvés.

## Interdictions du lot

- aucun correctif runtime ;
- aucune suppression de fichier ;
- aucun déplacement physique ;
- aucune extraction Core/Shell/module ;
- aucun changement gameplay ;
- aucun nouvel observer/timer/retry/wrapper ;
- aucun changement de `main`.

Si une dette fonctionnelle ou architecturale est découverte, elle est seulement documentée et réservée à un lot dédié ultérieur.

## Source index.html

Utiliser la copie locale actuelle vérifiée, blob :
`a515c3d34a1f5c4973159457090e4437a33c2630`.

Ne pas repasser par l'API Contents GitHub pour ce gros fichier.

GitHub reste l'autorité pour les branches, SHA, diff et CI.

## Tests prévus

- sentinelle statique de cartographie des propriétaires finaux si les chaînes peuvent être vérifiées sans recopier le gameplay ;
- maintien de `gens_phase2_runtime_load_graph_v11411.test.cjs` ;
- toutes les sentinelles Phase 1 restent obligatoirement GREEN.

## Risques

- un wrapper portant un numéro historique peut encore être actif ;
- un symbole global peut être remplacé plusieurs fois après le boot ;
- un fichier non chargé par le graphe principal peut être utilisé par tests/builders/preview ;
- compter les occurrences de stockage ne suffit pas : il faut attribuer chaque clé et chaque écriture à son propriétaire.

## Critère de sortie du sous-lot 2A

Pour les fonctions prioritaires et le stockage critique :
- chaîne de wrappers connue ;
- propriétaire final actif connu ;
- code dormant distingué du code installé ;
- duplication réelle signalée ;
- aucune ambiguïté critique non documentée.

## Critère de sortie Phase 2

Aucun fichier runtime actif sans propriétaire connu.

## Dette séparée

La détection ennemie hors embuscade reste un chantier fonctionnel distinct. Ce sous-lot peut cartographier ses hooks V113 mais ne corrige pas son comportement.
