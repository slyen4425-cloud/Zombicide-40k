# GenSrpG — Phase 4 Core Progression — raccord runtime points de compétence gagnés

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-progression-earned-skill-points-raccord-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-progression-earned-skill-points-raccord-2026-09-22`
- Base : `14d88f69b404650088cd19436819caae4138c564`
- GREEN de départ : `checkpoint/gensrpg-phase4-progression-earned-skill-points-raccord-preaudit-green-2026-09-22`
- main gelée : `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Périmètre

Un seul seam runtime :
`dungeonRpgEarnedSkillPoints`.

Le calcul final doit être délégué à :
`GensProgressionV1.earnedSkillPointsFromLevel`.

Aucune autre responsabilité Progression ne bouge dans ce lot.

## Invariants

- niveau canonique conservé via `dungeonRpgLevelFromXp(xp)` ;
- fallback Dungeon conservé uniquement sans profil ;
- profil configuré reste prioritaire ;
- aucun recalcul de courbe XP dans ce seam ;
- aucun changement du consommateur `dungeonSyncProgressionForState`.

## TDD

Le test de raccord doit échouer avant patch uniquement parce que le seam historique
ne délègue pas encore au Core.

Après patch :
- exactement un appel Core par calcul ;
- parité avec le propriétaire historique ;
- mêmes lectures profil/règles dans le même ordre ;
- aucune formule locale de points restante dans le seam.

## Interdictions

Pas de changement Core, stockage, UI, save, points dépensés, bonus, stat points,
distribution XP, level-up, Event Bus, observer, wrapper ou retry.
