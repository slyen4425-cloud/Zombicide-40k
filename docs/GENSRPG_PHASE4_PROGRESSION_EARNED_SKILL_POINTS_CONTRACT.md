# GenSrpG — Phase 4 Core Progression — contrat pur points de compétence gagnés

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-progression-earned-skill-points-contract-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-progression-earned-skill-points-contract-2026-09-22`
- Base : `57810c4087b29f17b83bfea14ee49b5afcc99845`
- Checkpoint GREEN de départ : `checkpoint/gensrpg-phase4-progression-earned-skill-points-preaudit-green-2026-09-22`
- `main` reste gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Contrat cible

`earnedSkillPointsFromLevel(level, explicitProgressionConfig, fallbackStartingSkillPoints, fallbackSkillPointsPerLevel)`

Le niveau est déjà canonique. Ce contrat ne possède donc aucune courbe XP.

Sémantique à préserver :
- profil configuré : `Math.max(0, Number(startingSkillPoints)||0) + gainedLevels * Math.max(0, Number(talentPointsPerLevel)||0)` ;
- sans profil : conserver les coercions historiques des deux fallbacks Dungeon ;
- `gainedLevels = Math.max(0, (Number(level)||0)-1)` ;
- aucune mutation des entrées.

Le cas sans profil conserve volontairement les coercions historiques, y compris
la propagation `NaN` pour des fallbacks truthy non numériques. Une normalisation
différente serait un changement fonctionnel séparé.

## TDD RED

Sentinelle :
`tests/gens_phase4_progression_earned_skill_points_contract_v1.test.cjs`.

Le RED attendu est exclusivement l'absence de
`GensProgressionV1.earnedSkillPointsFromLevel`.

## Interdictions

- aucun runtime ;
- aucun `index.html` ;
- aucun profil global / Dungeon rules lu dans le Core ;
- aucun stockage, DOM, timer/retry, event bus ;
- aucun point dépensé, bonus, stat point, XP award ou level-up.

Après GREEN technique, clôture documentaire et triple CI finale sur le SHA exact.
