# GenSrpG — Phase 9 — Pré-audit saveActiveEnemies([]) dans Capture139

Date : 2026-10-04

## Base

- Base GREEN : `checkpoint/gensrpg-phase9-capture139-base-profile-retirement-green-2026-10-04`
- SHA de base : `77d68ab0764c7715969a24d102a725d1a3d03a74`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase9-capture139-active-enemies-preaudit-2026-10-04`
- Branche : `work/gensrpg-phase9-capture139-active-enemies-preaudit-2026-10-04`
- Production `main` gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Mission

Caractériser la dépendance historique `saveActiveEnemies([])` encore appelée par Capture139, sans mutation runtime.

Le lot doit déterminer :
- le propriétaire réel de `saveActiveEnemies()` ;
- la responsabilité de `ACTIVE_ENEMIES_KEY` ;
- les effets UI de `renderActiveEnemyButtons()` et `updateDungeonExploreButtons()` ;
- l'effet de synchronisation éventuel de `z40kSchedulePush()` ;
- les consommateurs Dungeon et Capture ;
- la raison exacte du reset Capture139 ;
- le plus petit seam soustractif possible sous TDD.

## Faits déjà établis par le pré-audit session précédent

Le document `GENSRPG_PHASE9_CAPTURE139_SESSION_DEPENDENCY_PREAUDIT.md` a déjà établi que `saveActiveEnemies(a)` :
- écrit `ACTIVE_ENEMIES_KEY` dans `localStorage` ;
- appelle `renderActiveEnemyButtons()` ;
- appelle `updateDungeonExploreButtons()` ;
- appelle `z40kSchedulePush()` ;
- est consommée par de nombreux blocs Dungeon/combat/exploration.

Le pré-audit précédent a donc explicitement interdit tout contournement ou duplication et a conservé temporairement le reset Capture `saveActiveEnemies([])`.

Ces faits servent uniquement de point de départ. Ils doivent être revalidés sur le runtime exact du présent lot avant sélection du seam.

## Frontières déjà prouvées

### Capture public entry

`assets/gensrpg/capture/entry-v1.js` :
- expose `GensCaptureV1` ;
- possède l'entrée publique Capture ;
- délègue temporairement le démarrage de session au legacy Capture139 ;
- ne possède aucun stockage, DOM, timer, listener, observer, Dungeon ou Tactical.

Le contrat Capture interdit explicitement la dépendance au runtime privé Dungeon.

### Dungeon public contract

`assets/gensrpg/dungeon/module-contract-v1.json` déclare notamment :
- Dungeon propriétaire du world state ;
- exploration ;
- événements ;
- combat trigger ;
- persistance d'état Dungeon.

Cela rend suspecte toute API historique qui mélange persistance ennemis, rendu UI Dungeon et synchronisation globale avec un appel depuis Capture.

Ce constat ne suffit pas encore à déclarer `saveActiveEnemies()` « Dungeon » : la preuve doit venir de l'inspection exacte de tous ses consommateurs et effets.

## Rule 26 — runtime exact requis

HEAD documentaire d'ouverture :
`6ce3be7243b83037e10ce70830e9f6cd9c56630f`

`index.html` :
- taille : `8167048` octets ;
- blob Git : `3438e75b607d0b9bb68eb1d3edc2d97b3bd662ed`.

Permalink requis :
`https://github.com/slyen4425-cloud/Zombicide-40k/blob/6ce3be7243b83037e10ce70830e9f6cd9c56630f/index.html`

L'inspection inline exacte de la définition et des consommateurs de `saveActiveEnemies` / `ACTIVE_ENEMIES_KEY` doit utiliser le fichier téléchargé depuis ce permalink et vérifié contre le blob/taille ci-dessus.

## Hypothèses à tester — pas encore des conclusions

1. `ACTIVE_ENEMIES_KEY` pourrait être une donnée de session historiquement globale mais fonctionnellement Dungeon.
2. `saveActiveEnemies()` pourrait être un mélange de persistance générique et d'effets UI/sync Dungeon.
3. Le reset `saveActiveEnemies([])` de Capture139 pourrait seulement nettoyer un reliquat Dungeon avant entrée Capture.
4. Le bon seam pourrait être soustractif si Capture n'a aucun consommateur réel de cet état après démarrage.

Aucune de ces hypothèses ne doit être transformée en architecture avant preuve sur le runtime exact.

## Invariants protégés

Ne pas modifier pendant le pré-audit :
- `isDungeonMode()` ;
- seed Capture `gameStyle:"dungeon"` ;
- vrai Dungeon ;
- Capture victoire/reprise ;
- Shell -> `GensCaptureV1.startModuleSession()` -> Capture139 ;
- participants Capture ;
- starter creatures/kits ;
- monde Capture ;
- or pré-game ;
- Tactical ;
- Survival ;
- PvP ;
- laboratoires Combat Dynamique / Exploration / Builder / Map Actor ;
- `main`.

Interdits :
- `saveCaptureEnemies()` parallèle ;
- seconde source de vérité ennemis ;
- wrapper/fallback/timer/observer/polling.

## TDD attendu après caractérisation

Le RED ne sera écrit qu'après sélection d'un seul seam minimal.

La sentinelle devra protéger au minimum :
- vrai Dungeon ;
- Capture Shell/provider ;
- Capture victoire + reprise ;
- non-interférence quatre modules ;
- absence de nouvelle autorité concurrente.

## État

Pré-audit ouvert.
Aucune mutation runtime.
Ownership final et seam : **NON ENCORE ÉTABLIS**.
