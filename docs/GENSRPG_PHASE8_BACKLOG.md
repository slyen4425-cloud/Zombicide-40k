# GenSrpG — Phase 8 — Backlog non bloquant

Ce document reçoit uniquement les découvertes **B — non bloquantes pour le critère de sortie Phase 8**.

Aucun élément de cette liste ne justifie à lui seul un nouveau micro-lot Phase 8.

| Fichier / système | Dette observée | Pourquoi non bloquant Phase 8 | Suite probable |
| --- | --- | --- | --- |
| `gens-rpg-tactical-hotfix-1678114.js` | fichier historique V114.1 encore présent physiquement | la cartographie Phase 2 le classe non atteignable par le graphe de production actif | nettoyage dette après Phase 8 |
| `gens-rpg-tactical-session-guard-16781144.js` | ancien session guard encore présent | non atteignable par le graphe de production actif | suppression/archivage futur si utile |
| `gens-rpg-tactical-wall-dice-stats-16781145.js` | ancienne couche wall/dice/stats encore présente | non atteignable par le graphe de production actif | nettoyage futur |
| V108-V113 | fonctions/commentaires historiques encore inspectables au-delà des responsabilités actives | leur simple présence n'empêche pas un lifecycle propre ; seules leurs autorités actives sont des sujets Phase 8 | dette technique ultérieure |
| `assets/gensrpg/tactical/module-contract-v1.json` | une note historique mentionne encore la conservation des retries Bridge 250/1200/3000 alors qu'ils ont été audités puis retirés | dérive documentaire sans autorité runtime | réalignement documentaire lors d'une prochaine mise à jour de contrat |
| documentation Phase 2 historique | certains paragraphes décrivent la composition avant le handoff Phase 8 | document de cartographie historique ; CURRENT_WORK + docs Phase 8 portent l'état actuel | mise à jour documentaire future si nécessaire |
| constantes/styles/version labels historiques Tactical | noms V108-V114 et styles hérités encore présents | cosmétique/maintenabilité, pas lifecycle | phase de dette/maintenance |

## Exclusions de ce backlog

Les éléments suivants sont **A — bloquants** et ne doivent pas être rangés ici :
- activation eager de la pile Tactical avant combat ;
- auto-install/retries actifs sans ownership de session ;
- listeners/hooks/wrappers actifs qui survivent à la fermeture ;
- absence de `dispose()` / teardown ;
- V113 comme autorité active de détection Dungeon hors combat tant que cette responsabilité n'est pas correctement possédée ;
- side effects UI/menu/start globaux actifs hors session.

## Règle

Si un élément B devient ultérieurement la cause prouvée d'un échec du critère de sortie, il peut être reclassé A avec une preuve concrète et une justification écrite dans `GENSRPG_CURRENT_WORK.md`.
