# GenSrpG — Phase 4 Core Progression / XP — pré-audit points de compétence gagnés

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-progression-earned-skill-points-preaudit-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-progression-earned-skill-points-preaudit-2026-09-22`
- Base exacte : `4f0cdbcc436a71616191d2733883d5934950f60a`
- Checkpoint GREEN de départ : `checkpoint/gensrpg-phase4-progression-xp-into-level-raccord-green-2026-09-22`
- Production : `main` gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11

## Mission

Pré-audit uniquement de `dungeonRpgEarnedSkillPoints`.

Aucun runtime ne doit être modifié dans ce lot.

## Questions à caractériser

1. propriétaire runtime exact ;
2. normalisation/coercion des entrées ;
3. comportement sans profil Progression ;
4. comportement linéaire ;
5. comportement custom ;
6. caps/minimums/fallbacks ;
7. dépendances éventuelles à XP/niveau/points dépensés ;
8. effets de bord éventuels ;
9. possibilité d'une primitive Core pure et inerte ;
10. frontière exacte d'un futur raccord minimal.

## Interdictions

Ne pas toucher :
- `dungeonRpgEarnedSkillPoints` dans le runtime ;
- `dungeonSyncProgressionForState` ;
- XP manuel/combat/objectifs ;
- level-up ;
- points dépensés ;
- UI/persistance ;
- Stats/Inventory/Storage/Dice/Tactical ;
- Event Bus/utilitaires communs.

Aucun wrapper, observer, timer/retry, monkey-patch ou nouvelle autorité globale.

## Source

Runtime GREEN de départ :
- `index.html` : 8 174 346 octets ;
- blob `8da7afa3c986f29e740eee1748dcc0ec0f8f75bc`.

Règle 26 : toute inspection exacte du gros HTML doit utiliser une copie vérifiée
correspondant au SHA de base. GitHub reste l'autorité pour SHA, branches, diff et CI.

## Validation prévue

- sentinelle de caractérisation owner-level ;
- matrice de cas suffisamment large pour verrouiller les sémantiques historiques ;
- aucune modification runtime ;
- Architecture + navigateur complet ;
- Firefox ;
- Tactical Dock.

Le futur contrat Core éventuel sera un lot distinct après GREEN.
