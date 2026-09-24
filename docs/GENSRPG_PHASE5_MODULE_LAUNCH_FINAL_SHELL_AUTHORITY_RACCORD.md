# GenSrpG — Phase 5 / module-launch — raccord Autorité Shell finale

Date : 2026-09-24

## Base

- Pré-audit GREEN :
  `checkpoint/gensrpg-phase5-module-launch-final-shell-authority-preaudit-green-2026-09-24`.
- SHA :
  `6f0d062aa40cc4dce61e7db0d09dc491cca14d42`.
- Runtime :
  `8172529` octets,
  blob `696014056409dda9b6ef25ace58dfd9d5f9e2718`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-module-launch-final-shell-authority-raccord-2026-09-24`.
- Branche :
  `work/gensrpg-phase5-module-launch-final-shell-authority-raccord-2026-09-24`.
- Production `main` gelée :
  `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Mission

Installer l'autorité Shell finale de lancement.

Le lot n'enlève aucun propriétaire historique. Il change uniquement la porte d'entrée
globale finale, après tous les scripts existants.

## Fichier cible

`assets/gensrpg/shell/module-launch-final-authority-v1.js`.

Responsabilité unique :
- obtenir le module actif depuis l'API Shell publique ;
- appeler `startModuleSession` ;
- retourner le résultat public `handled:boolean`.

Interdit dans ce fichier :
- Capture privé ;
- Dungeon privé ;
- Survival privé ;
- DOM ;
- stockage ;
- listeners ;
- observers ;
- timers ;
- retry/polling ;
- capture de l'ancien `startConfiguredGame` ;
- fallback legacy.

## Load graph

Ajouter exactement un tag :

`<script src="assets/gensrpg/shell/module-launch-final-authority-v1.js"></script>`

après le script actuellement final :

`assets/gensrpg/gens-mobile-combat-performance-16781022.js`

et immédiatement avant `</body>`.

## Production callsite

Le bouton reste :

`onclick="startConfiguredGame()"`.

Ainsi le callsite utilisateur ne change pas ; seule l'autorité finale du global change.

## PvP

Aucun provider PvP n'est ajouté.

Si le dispatcher est appelé alors que le module actif vaut `pvp`,
le registre public retourne `false`.
Le vrai produit continue d'afficher `PVP — À VENIR`.

## Propriétaires historiques protégés

Conserver tous les cinq :
- `captureFix135` ;
- `captureFix138` ;
- `captureFix139` ;
- `gensDungeonCore01Js` ;
- `dungeonCore200Rebuild`.

Leur retrait sera un chantier ultérieur, un par un, après validation utilisateur de
la présente bascule.

## RED attendu

La sentinelle dédiée doit échouer uniquement parce que :
- le fichier final Shell n'existe pas encore ;
- son tag n'est pas encore dans le load graph.

Toutes les autres preuves S1/S2/S3/S4 et rollback restent GREEN.

## GREEN requis

- sentinelle statique autorité Shell finale ;
- lancement Survival historique par le vrai bouton ;
- provider Survival ;
- Dungeon map -> Tactical ;
- Save & Quit/reprise ;
- provider Dungeon ;
- Dungeon après Survival ;
- Builder ;
- Capture historique ;
- Capture provider ;
- Capture victoire/reprise ;
- PvP placeholder ;
- non-interférence quatre modules ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock ;
- preview téléphone et validation utilisateur.

Aucun merge sur `main`.
