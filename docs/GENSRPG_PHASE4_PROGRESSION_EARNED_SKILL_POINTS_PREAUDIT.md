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


## Résultat de caractérisation

Source utilisateur vérifiée contre le checkpoint GREEN :
- taille : `8 174 346` octets ;
- blob Git : `8da7afa3c986f29e740eee1748dcc0ec0f8f75bc`.

Propriétaire actif confirmé :
`dungeonCore044HeroProgression -> dungeonRpgEarnedSkillPoints`.

Consommateur direct :
`dungeonSyncProgressionForState`.

Dépendance calculatoire :
`dungeonRpgLevelFromXp`, déjà raccordé au Core Progression pour les profils configurés.

La fonction de points gagnés ne possède pas la courbe XP :
- aucun `xpPerLevel`, `xpThresholds` ou `maxLevel` local ;
- aucun stockage, DOM, timer, save ou render ;
- le niveau canonique est demandé exactement une fois par appel.

Deux politiques historiques existent :
- profil Progression configuré : `startingSkillPoints + talentPointsPerLevel` ;
- absence de profil Dungeon : `startingSkillPoints + skillPointsPerLevel` provenant des Dungeon rules.

Un objet progression vide `{}` est un profil configuré valide et ne doit pas être
confondu avec l'absence de profil.

Les lectures actuelles sont volontairement caractérisées, pas optimisées dans ce lot :
- profil configuré : deux lectures du profil actif (seam points + seam niveau), zéro lecture Dungeon rules ;
- profil absent/non-Dungeon : deux lectures du profil actif et deux lectures Dungeon rules,
  dont une de chaque paire arrive via le seam niveau.

La matrice de caractérisation couvre 100 cas et verrouille également les coercions
historiques de fallback, y compris la propagation `NaN` sur certaines anciennes
valeurs invalides. Toute normalisation différente devra être un lot fonctionnel séparé.

### Primitive Core candidate

Forme recommandée pour le lot suivant :

`earnedSkillPointsFromLevel(level, explicitProgressionConfig, fallbackStartingSkillPoints, fallbackSkillPointsPerLevel)`

Cette primitive doit recevoir le **niveau canonique** au lieu de l'XP afin de ne jamais
réimplémenter la courbe, les seuils custom ou `maxLevel`.

Restent hors périmètre :
- `dungeonSpentSkillPointsFor` ;
- mutation `dungeonSyncProgressionForState` ;
- `bonusSkillPoints` et soustraction des points dépensés ;
- stat points ;
- XP manuel/combat/objectifs ;
- level-up UI/persistance.

Sentinelle :
`tests/gens_phase4_progression_earned_skill_points_preaudit_v1.test.cjs`.

Aucun runtime ni Core n'est modifié par ce pré-audit.


## Validation technique du pré-audit

SHA caractérisation :
`2ba5ebeb94b5575ba24e804acf5359b7d2405781`.

Résultats :
- Architecture + navigateur complet : `35733752295` — SUCCESS ;
- Firefox : `35733752442` — SUCCESS ;
- Tactical Dock : `35733752339` — SUCCESS.

La sentinelle de 100 cas est GREEN dans le pipeline Architecture.

Le lot reste strictement documentaire/test :
- aucun changement de `index.html` ;
- aucun changement de `assets/gensrpg/core/progression-v1.js` ;
- aucun nouveau propriétaire runtime.

La clôture documentaire doit maintenant être validée par la triple CI sur son
propre SHA exact. Après succès, créer :
`checkpoint/gensrpg-phase4-progression-earned-skill-points-preaudit-green-2026-09-22`.

Le lot suivant autorisé est un contrat Core pur et séparé pour :
`earnedSkillPointsFromLevel(level, explicitProgressionConfig, fallbackStartingSkillPoints, fallbackSkillPointsPerLevel)`.

Aucun raccord runtime dans le lot suivant tant que ce contrat n'est pas lui-même GREEN.
