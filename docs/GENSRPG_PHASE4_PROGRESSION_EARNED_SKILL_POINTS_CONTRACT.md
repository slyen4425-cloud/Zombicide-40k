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


## Résultat technique

TDD RED :
- SHA : `04518beefee472526c48e20c5716930b2fdc0d3d` ;
- Architecture : `35734920486` — FAILURE attendue ;
- échec ciblé : absence de `earnedSkillPointsFromLevel`.

Implémentation minimale :
- commit : `755aee157a841da4e695816f87386d123b23f1b4` ;
- fichier modifié : `assets/gensrpg/core/progression-v1.js` uniquement pour la primitive ;
- blob Core résultant : `3cca29084ce436a8dcae95e5d6d745edd4afa3cf`.

Réalignement des sentinelles de fingerprint Progression :
- commit : `6367f37fc6a9805f0661b2677bb09009662850eb` ;
- aucun runtime modifié ;
- aucun comportement historique changé.

Validation technique sur `6367f37fc6a9805f0661b2677bb09009662850eb` :
- Architecture + navigateur complet : `35735255233` — SUCCESS ;
- Firefox : `35735255297` — SUCCESS ;
- Tactical Dock : `35735255205` — SUCCESS.

`index.html` reste exactement sur le blob
`8da7afa3c986f29e740eee1748dcc0ec0f8f75bc`.

La clôture documentaire doit encore passer la triple CI sur son propre SHA exact.
Après succès, créer :
`checkpoint/gensrpg-phase4-progression-earned-skill-points-contract-green-2026-09-22`.

Le chantier suivant devra être un **pré-audit de raccord** séparé, jamais un raccord
direct sans caractérisation.
