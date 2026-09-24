# GenSrpG — Phase 6 / micro-lot 2 — activation de l’entrée Survie par règles de vagues pures — pré-audit — 2026-09-25

## Base sûre

- checkpoint précédent GREEN :
  `checkpoint/gensrpg-phase6-survival-legacy-guard-retirement-green-2026-09-24`
- SHA de base exact :
  `c82d1605acbc791977f88b1e3ae89297a50ab929`
- checkpoint de départ :
  `checkpoint/gensrpg-start-phase6-survival-wave-rules-entry-2026-09-25`
- branche :
  `work/gensrpg-phase6-survival-wave-rules-entry-2026-09-25`
- production `main` reste gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Fichier runtime exact fourni par Sylvain

Le ZIP `work20.zip` contient un fichier de 8 171 854 octets.
Son blob Git calculé est :

`97f0e060d8bffcde2baaf5aa42c1e16b8544263f`

Ce blob correspond exactement au `index.html` du SHA de base.

## Pourquoi le propriétaire startConfiguredGame n’est PAS le micro-lot 2

Le propriétaire historique `async function startConfiguredGame()` mélange encore :
- préparation commune de session ;
- branches Dungeon ;
- logique Survie ;
- rafraîchissement Capture ;
- gestion de tours et UI partagées.

L’extraire en bloc déplacerait des responsabilités Shell/Core/Dungeon dans Survie ou dupliquerait le code commun.
C’est interdit par la charte et par le contrat Survie.

## Slice homogène retenu

Première extraction active réelle dans `assets/gensrpg/survival/` :

1. profil de vagues Survie par défaut ;
2. collecte pure des identifiants d’ennemis référencés par un profil de vagues.

Propriétaires actuels dans le gros script inline :
- `defaultWaveProfile()` : 1 définition + 6 consommateurs ;
- `collectEnemyIdsFromProfile()` : 1 définition + 2 consommateurs.

Ces deux responsabilités :
- sont spécifiques au système de vagues Survie ;
- n’accèdent ni au DOM ni au stockage ;
- n’utilisent aucun timer/listener/observer ;
- n’appellent aucune API Dungeon, Tactical, Capture ou PvP ;
- sont déterministes à partir de leurs arguments.

## Cible architecturale

Activer `assets/gensrpg/survival/entry-v1.js` comme premier vrai point d’entrée runtime Survie.

API cible unique :

`window.GensSurvivalV1.waveRules`

avec :
- `defaultProfile()`
- `collectEnemyIds(profile)`

Le fichier reste pur :
- aucun DOM ;
- aucun stockage ;
- aucun timer/retry ;
- aucun listener/observer ;
- aucune dépendance privée inter-module.

Le `index.html` doit charger l’entrée Survie avant le gros script legacy qui consomme ces règles.

Les deux définitions inline historiques doivent être supprimées.
Les huit consommateurs doivent appeler directement l’API Survie.
Aucun wrapper global de compatibilité `defaultWaveProfile` ou `collectEnemyIdsFromProfile` n’est autorisé.

## Périmètre autorisé

- `assets/gensrpg/survival/entry-v1.js`
- `assets/gensrpg/survival/module-contract-v1.json`
- `index.html` pour le raccord exact et le retrait des deux définitions inline
- `service-worker.js` uniquement si la preuve du load graph/cache l’exige
- tests, cartographies et documentation strictement nécessaires
- composition Pages/preview uniquement si le raccord source ne suffit pas

## Interdictions

- aucun changement de gameplay ou de valeurs de vagues ;
- aucune modification Dungeon/Tactical/Capture/PvP ;
- aucun déplacement du lancement de session ;
- aucun nouveau wrapper global ;
- aucun fallback ;
- aucun polling/retry/MutationObserver ;
- aucune modification opportuniste d’autres fonctions de vagues ;
- aucun merge sur `main`.

## TDD attendu

RED avant runtime :
- entrée Survie encore inerte ;
- API `GensSurvivalV1.waveRules` absente ;
- deux propriétaires inline encore présents.

GREEN après raccord :
- structure exacte du profil par défaut inchangée ;
- nouvel objet frais à chaque `defaultProfile()` ;
- collecte d’ennemis dédupliquée et ordre conservé ;
- entrée Survie chargée une seule fois avant le gros script legacy ;
- 0 définition inline historique ;
- 6 appels directs `waveRules.defaultProfile()` ;
- 2 appels directs `waveRules.collectEnemyIds()` ;
- aucune dépendance privée inter-module dans l’entrée.

## Validation avant GREEN final

1. sentinelle statique micro-lot ;
2. sentinelles Phase 2/cartographie réalignées sans affaiblissement ;
3. Architecture + Browser complet ;
4. Firefox ;
5. Tactical Dock ;
6. preview téléphone ;
7. validation utilisateur avant micro-lot 3.
