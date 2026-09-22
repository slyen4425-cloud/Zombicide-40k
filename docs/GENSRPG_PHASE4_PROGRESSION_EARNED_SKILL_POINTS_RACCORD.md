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


## Raccord runtime appliqué

TDD RED :
- SHA `a368c7bfd4b8e50f505bcb20c99c63b5e7a54fea` ;
- Architecture `35742520031` — FAILURE attendue sur la seule nouvelle étape ;
- Firefox `35742519956` — SUCCESS ;
- Tactical Dock `35742520126` — SUCCESS.

Patch one-shot :
- workflow `99ba3ac9223ba344854b7f3fd4e3fff2659c3f70` ;
- runtime `ca7311a96496c85ba58e243ed24ddccb8a07a9b8` ;
- workflow supprimé dans le même commit.

`index.html` :
- avant : 8 174 346 octets, `8da7afa3c986f29e740eee1748dcc0ec0f8f75bc` ;
- après : 8 174 314 octets, `8ef7c65fca1f72f0393f0f6ccb6fea8426b41f91`.

Le diff runtime est strictement limité au seam pré-audité.
Le Core Progression reste inchangé.

Prochaine étape : CI complète et réalignement éventuel des seuls fingerprints dépendants.
