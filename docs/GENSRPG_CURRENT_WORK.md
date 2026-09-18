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

**Correctif dédié — bootstrap à froid des profils avant seed Monster Capture 162**

Branche :
`work/gensrpg-capture-cold-boot-profile-bootstrap-fix-2026-09-18`

Checkpoint de départ :
`checkpoint/gensrpg-start-capture-cold-boot-fix-2026-09-18`

Base exacte :
`c4eca0275c83e6b5ffc6a61a10100858d5277228`

## Défaut caractérisé à corriger

La composition Pages complète gèle au premier boot dans :

`builtinMonsterCapture162 -> ensureBuiltinMonsterCapture162() -> refreshCustomEquipmentIntoItems()`.

Chaîne récursive prouvée :

```text
refreshCustomEquipmentIntoItems
→ gensCurrentContentFamily
→ getActiveGameProfile
→ loadGameProfiles
→ ensureBaseGameProfile
→ captureCurrentGameProfile(game_profile_zombicide_base)
→ currentAllHeroIds
→ applyCustomHeroesMulti
→ gensContentCompatible(hero)
→ gensCurrentContentFamily
→ ...
```

Le profil Capture et son dresseur sont seedés avant que le bootstrap canonique Base/Dungeon soit garanti. Le refresh équipement provoque alors une réentrée de `ensureBaseGameProfile()` avant sa persistance.

Preuve :
- commit caractérisation `8c25a0940374ff36ff6754a8bd4aa4d59cf51afb` ;
- 80 appels récursifs tracés ;
- watchdog avant retour de `refreshCustomEquipmentIntoItems()`.

## Périmètre du lot

Autorisé :
- corriger uniquement l'ordre/bootstrap des profils lié à `builtinMonsterCapture162` ;
- réutiliser le propriétaire canonique existant des profils ;
- conserver strictement les données et règles Capture actuelles ;
- adapter le test de caractérisation en sentinelle de non-récursion si nécessaire.

Interdit :
- aucun changement de gameplay Capture ;
- aucun nouveau système de profils ;
- aucun wrapper global ;
- aucun observer ;
- aucun timer/retry supplémentaire ;
- aucune correction de la dette de détection ennemie ;
- aucun changement sur `main`.

## Source index.html

Copie locale exacte déjà fournie et vérifiée :
- SHA de référence runtime : `95db8780eeecdd33a662fbe99c260ecec2cb24a0` ;
- blob `index.html` : `a515c3d34a1f5c4973159457090e4437a33c2630` ;
- taille : 8 175 610 octets.

Depuis ce SHA, les commits de cartographie ont modifié uniquement tests/docs. Le runtime `index.html` du checkpoint de départ est donc identique à cette copie vérifiée.

## Correctif minimal visé

Hypothèse à valider par test après modification :
- dans le seed profil de `ensureBuiltinMonsterCapture162()`, utiliser le chargeur canonique `loadGameProfiles()` au lieu du chargeur brut `loadGameProfilesRaw()` ;
- ainsi Base/Dungeon sont initialisés avant l'enregistrement du dresseur Capture et avant le refresh qui consulte la famille active.

Aucune autre modification runtime n'est autorisée tant que ce correctif minimal n'a pas été testé.

## Tests obligatoires

- composition Pages complète Capture ;
- Capture courant ;
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox ;
- Tactical Dock.

## Critère de sortie

- plus aucune récursion au boot Capture à froid ;
- le scénario Pages complet atteint ses assertions gameplay ;
- toutes les sentinelles obligatoires restent GREEN ;
- checkpoint GREEN créé seulement après validation ;
- aucune fusion sur `main`.

## Résultat du correctif Capture

Correctif runtime appliqué :
- commit `e7701e47ff6e44c61f53d62c9d7464b540da49c6` ;
- diff runtime : **1 ligne** dans `builtinMonsterCapture162` ;
- `loadGameProfilesRaw()` -> `loadGameProfiles()`.

Effet confirmé :
- la récursion initiale du bloc 030 a disparu ;
- le boot traverse désormais les 119 blocs inline et atteint les modules Pages externes ;
- les gardes Architecture restent GREEN ;
- Firefox et Tactical Dock restent GREEN sur les commits de caractérisation.

## Nouveau défaut indépendant découvert

Le boot complet bloque ensuite dans le callback `DOMContentLoaded` du propriétaire Core Stats :
`assets/gensrpg/gens-rpg-stats-clean-167874.js`.

Trace prouvée :
1. stockage avant Stats : `Base, Dungeon, Capture` ;
2. `currentRpgProfile()` choisit le profil Dungeon alors que le profil actif reste Base ;
3. `saveProfile(p)` construit une liste d'identifiants contenant à la fois `p.id` (Dungeon) et `activeGameProfileId()` (Base) ;
4. `findIndex()` trouve donc Base en premier ;
5. le profil Dungeon remplace Base ;
6. stockage après sauvegarde : `Dungeon, Dungeon, Capture` ;
7. `loadGameProfiles()` tente alors de recréer Base via `ensureBaseGameProfile()` et retombe dans une récursion.

Preuve de caractérisation :
- commit test `ff7dcf501087bde42315eac18a529ae993c23c0e` ;
- trace stockage : `game_profile_zombicide_base,game_profile_dungeon_demo,gp_mt7ker7t_m2iw9` puis `game_profile_dungeon_demo,game_profile_dungeon_demo,gp_mt7ker7t_m2iw9`.

## Décision de périmètre

Ce défaut appartient au propriétaire **Core Stats / persistance de profil**, pas à `builtinMonsterCapture162`.

Conformément à la charte :
- ne pas élargir ce lot Capture ;
- conserver le correctif Capture d'une ligne ;
- ouvrir un chantier dédié pour `saveProfile(p)` du Core Stats ;
- aucun wrapper/observer/timer de réparation.

## Prochain chantier

**Correctif dédié — Core Stats saveProfile doit remplacer uniquement le profil demandé.**

Correctif attendu :
- `p.id` doit être l'autorité primaire pour le remplacement ;
- l'identifiant actif ne peut servir de fallback que si `p.id` est absent/non exploitable ;
- ne jamais écraser Base lorsqu'on sauvegarde Dungeon, ni l'inverse.

Tests obligatoires :
- reproduction directe Base actif + sauvegarde Dungeon ;
- composition Pages complète Capture ;
- Capture courant ;
- UI native ;
- Survie ;
- Save & Quit / reprise ;
- PvP ;
- non-interférence quatre modules ;
- gardes Phase 2 ;
- Firefox ;
- Tactical Dock.

## Prochaine action

1. créer le checkpoint de départ sur le SHA documentaire courant ;
2. créer une branche Core Stats dédiée ;
3. corriger `saveProfile(p)` au propriétaire ;
4. transformer la caractérisation en test de régression ciblé ;
5. relancer toute la CI avant tout checkpoint GREEN.

## Dette séparée

La détection ennemie hors embuscade reste un chantier de caractérisation fonctionnelle distinct ; elle n'est pas corrigée dans cette cartographie.
