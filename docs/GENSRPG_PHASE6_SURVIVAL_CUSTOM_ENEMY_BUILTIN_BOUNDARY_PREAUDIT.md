# GenSrpG — Phase 6 / frontière built-ins du refresh partagé — pré-audit — 2026-09-26

## Base sûre

- checkpoint GREEN précédent :
  `checkpoint/gensrpg-phase6-survival-custom-enemy-dungeon-ensure-green-2026-09-25`
- SHA exact :
  `3853ac9a8e0704910698962ce265a75a03a46a37`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-custom-enemy-builtin-boundary-2026-09-26`
- branche :
  `work/gensrpg-phase6-survival-custom-enemy-builtin-boundary-2026-09-26`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Fermeture vérifiée du lot précédent

Le micro-lot `ensureDungeonEnemies()` est fermé GREEN sur :
`checkpoint/gensrpg-phase6-survival-custom-enemy-dungeon-ensure-green-2026-09-25`.

Checkpoint et branche de travail précédente sont identiques :
- ahead : 0 ;
- behind : 0 ;
- SHA : `3853ac9a8e0704910698962ce265a75a03a46a37`.

CI finale sur ce SHA :
- Architecture + Browser : `36191917580` — SUCCESS ;
- Firefox : `36191917546` — SUCCESS ;
- Tactical Dock : `36191917636` — SUCCESS.

Validation utilisateur mobile reçue :
`Ça a l air ok 👍`.

## Dette Phase 6 retenue

Le propriétaire natif partagé
`refreshCustomEnemiesIntoZombieTypes()`
ne dépend plus du wrapper Dungeon V165 ni de l'appel direct
`ensureDungeonEnemies()`.

La dernière dépendance Dungeon explicite déjà prouvée dans ce propriétaire est désormais :
`applyBuiltinEnemyOverrides()`.

La caractérisation Rule 26 du lot précédent a établi que
`applyBuiltinEnemyOverrides()` construit sa base depuis :
`[...BASE_ZOMBIE_TYPES, ...dungeonEnemies()]`.

La cartographie Phase 2 alignée sur le runtime courant
(sourceIndexBlob `2a7dae75115d83b4edc368c42453a7cb58d0bd73`)
confirme en outre :
- `applyBuiltinEnemyOverrides` : 2 assignations, dernier propriétaire `dungeonGithubArts164` ;
- `dungeonEnemies` : 2 assignations, dernier propriétaire `dungeonGithubArts164`.

Cette frontière est prioritaire car le chemin Survie de refresh des ennemis passe encore par une fonction dont l'autorité finale est un bloc Dungeon et qui consomme une fonction Dungeon.

## Objet unique du micro-lot

Caractériser précisément la frontière :
`refreshCustomEnemiesIntoZombieTypes() -> applyBuiltinEnemyOverrides() -> dungeonEnemies()`

puis choisir UNE seule architecture minimale conforme parmi les issues autorisées ci-dessous.

Ce pré-audit ne présume pas qu'un retrait direct est correct.

## Questions obligatoires à résoudre sur la source exacte

1. quelle est la définition native exacte de `applyBuiltinEnemyOverrides()` ;
2. quelle est la réassignation exacte opérée par `dungeonGithubArts164` ;
3. quelle est la définition native exacte de `dungeonEnemies()` ;
4. quelle est sa réassignation V164 ;
5. quels effets appartiennent réellement à la construction du catalogue commun ;
6. quels effets appartiennent uniquement à l'art / contenu Dungeon ;
7. quels consommateurs Survie appellent directement ou indirectement cette frontière ;
8. si la transformation des built-ins peut être séparée comme fonction pure alimentée explicitement ;
9. si Dungeon doit fournir ses built-ins via un adapter/contrat explicite ;
10. si une couche V164 est devenue redondante grâce aux protections d'art V165/V166 ;
11. si une suppression est impossible sans modifier le comportement, auquel cas le lot doit s'arrêter au diagnostic.

## Issues architecturales autorisées

Après caractérisation exacte seulement :

1. **Retrait soustractif**
   - uniquement si une réassignation/wrapper Dungeon est prouvé redondant ;
   - aucune donnée ni art ne change.

2. **Séparation pure + adapter**
   - extraction d'une transformation pure de catalogue ;
   - injection explicite des built-ins Dungeon par une frontière documentée ;
   - aucune lecture privée Dungeon depuis le chemin Survie.

3. **Adapter Dungeon explicite sans extraction large**
   - si la responsabilité commune est minime mais Dungeon doit encore enregistrer son contenu ;
   - aucun wrapper global.

4. **STOP**
   - si l'une des hypothèses change les données, IDs, stats, arts ou comportement ;
   - aucun runtime n'est alors modifié dans ce lot.

## Invariants à protéger

- catalogue Survie inchangé ;
- catalogue Dungeon inchangé ;
- IDs/noms/stats/quantités inchangés ;
- custom Survie et custom Dungeon conservés ;
- filtres `enemiesForMode(...)` inchangés ;
- arts Dungeon V164/V165/V166 inchangés ;
- réserves et vagues Survie inchangées ;
- `loadCustomEnemies()` et `customEnemyToZombieType()` inchangés ;
- `ensureDungeonEnemies()` reste hors du refresh partagé ;
- stockage/éditeur inchangés ;
- Tactical/Capture/PvP inchangés ;
- aucun changement gameplay.

## Hors périmètre

- `openZombieRule` et son propriétaire `dungeonDirectImageBinding166` ;
- wrappers V165 de `activeEnemyDefinition`, `enemyCardHtml`, `openZombieRule`, `renderActiveEnemies` ;
- `dungeonDirectImageBinding166` ;
- règles de vagues déjà extraites ;
- toute migration générale du catalogue ennemis ;
- déplacement complet de `refreshCustomEnemiesIntoZombieTypes()` vers Survie ;
- toute réécriture opportuniste.

## Interdictions

- aucun wrapper global de compatibilité ;
- aucun polling/retry/heartbeat ;
- aucun `MutationObserver` global ;
- aucun `location.reload` ;
- aucune duplication de catalogue ;
- aucune seconde source de vérité ;
- aucune règle gameplay codée en dur ;
- aucun raccord runtime avant TDD RED.

## TDD obligatoire

Après caractérisation exacte :

1. écrire d'abord une caractérisation navigateur de l'état cible proposé ;
2. vérifier Survie + Dungeon + arts + non-duplication ;
3. ajouter une sentinelle RED qui exige uniquement la frontière architecturale retenue ;
4. prouver que ce RED est isolé ;
5. conserver les sentinelles Phase 6 existantes GREEN ;
6. conserver Firefox et Tactical Dock GREEN ;
7. seulement ensuite modifier le runtime minimal nécessaire ;
8. réaligner uniquement les empreintes/cartographies mécaniquement affectées ;
9. triple CI ;
10. preview et validation utilisateur si comportement visible ;
11. checkpoint GREEN final.

## Rule 26

Le contenu exact du gros `index.html` est requis pour répondre aux questions ci-dessus.

Procédure obligatoire :
1. figer ce pré-audit et `GENSRPG_CURRENT_WORK.md` sur la branche du lot ;
2. résoudre le HEAD exact de cette branche ;
3. vérifier par métadonnées le blob et la taille de `index.html` ;
4. fournir à Sylvain le permalink SHA exact ;
5. demander le fichier exact téléchargé depuis ce permalink et compressé en ZIP ;
6. vérifier taille + blob du fichier reçu ;
7. seulement ensuite inspecter les définitions/réassignations et écrire le TDD.

Ne jamais réutiliser `work30.zip` : ce fichier correspond au HEAD du lot précédent, pas au HEAD documentaire du présent lot.


---

# Résultat du micro-lot — GREEN technique

## Rule 26 — source exacte

Source utilisateur vérifiée :
- archive : `work31.zip` ;
- fichier : `index31.txt` ;
- taille : 8 170 402 octets ;
- blob Git : `2a7dae75115d83b4edc368c42453a7cb58d0bd73`.

La source correspondait exactement au runtime du lot avant raccord.

## Caractérisation retenue

La frontière exacte était :
`refreshCustomEnemiesIntoZombieTypes() -> applyBuiltinEnemyOverrides() -> dungeonEnemies()`.

Architecture minimale validée :
- `applyBuiltinEnemyOverrides(bases=BASE_ZOMBIE_TYPES)` devient une transformation partagée alimentée explicitement ;
- le chemin Survie par défaut ne lit plus `dungeonEnemies()` ;
- `ensureDungeonEnemies()` reste propriétaire Dungeon, obtient `const bases=dungeonEnemies()`, publie les bases puis appelle `applyBuiltinEnemyOverrides(bases)` ;
- les deux callsites éditeur passent leur base déjà résolue ;
- le wrapper V164 autour de `applyBuiltinEnemyOverrides()` est retiré ;
- le wrapper V164 de `dungeonEnemies()` et V165/V166 restent intacts.

La caractérisation navigateur a d'abord été validée en fixture puis convertie en régression post-état :
`tests/gens_phase6_survival_builtin_boundary_browser_characterization_v1.test.cjs`.

## TDD RED

Sentinelle :
`tests/gens_phase6_survival_builtin_boundary_retirement_v1.test.cjs`.

HEAD RED :
`833bf91bc2a0e047c2d1b19f20b4c35fc3c98c36`.

Résultat :
- Architecture : FAILURE attendue, isolée à la frontière built-ins ;
- Firefox : SUCCESS ;
- Tactical Dock : SUCCESS.

## Raccord runtime

Commit runtime principal :
`2e3d3c37f135e4c16d8f9ac426e2510aa840b47c`
(`runtime: isolate Survival builtin enemy boundary`).

Runtime final du raccord :
- taille : 8 170 150 octets ;
- blob : `ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9`.

Le raccord ne change ni données, ni IDs, ni stats, ni quantités, ni règles de vagues, ni gameplay. Il retire uniquement la lecture Dungeon depuis la transformation partagée et restaure une frontière explicite.

## Réalignements mécaniques

Les empreintes taille/blob et les cartographies directement dépendantes du runtime courant ont été réalignées sans affaiblir les assertions métier.

Conséquence Phase 2 attendue et vérifiée :
- la table des derniers propriétaires passe de 434 à 433 entrées car `applyBuiltinEnemyOverrides` n'est plus multi-propriétaire ;
- `dungeonEnemies` reste à 2 assignations, dernier propriétaire `dungeonGithubArts164` ;
- les 15 hotspots stratifiés restent conformes à leur manifeste.

Le test navigateur a été converti en preuve post-état au commit :
`ece2605aaacc7970f68e1bf5c53d7c1ff016cdba`
(`test: convert builtin boundary browser proof to post-state regression`).

## CI technique GREEN

SHA technique :
`ece2605aaacc7970f68e1bf5c53d7c1ff016cdba`.

Runs :
- Architecture + Browser complet : `36223093181` — SUCCESS ;
- Firefox : `36223093159` — SUCCESS ;
- Tactical Dock : `36223093158` — SUCCESS.

Les étapes Phase 6 #170 à #178 sont toutes SUCCESS, dont :
`#178 — Isoler la frontière built-ins Survie Dungeon Phase 6`.

## État du lot

**Candidat GREEN technique.**

Avant checkpoint final :
1. mettre à jour `GENSRPG_CURRENT_WORK.md` ;
2. repasser la triple CI sur le SHA documentaire exact ;
3. préparer une preview exacte ;
4. obtenir la validation utilisateur Survie + Dungeon + arts + transition ;
5. enregistrer la validation ;
6. triple CI finale ;
7. créer le checkpoint GREEN final du lot ;
8. seulement ensuite ouvrir un audit de sortie Phase 6 dédié.
