# GenSrpG — Phase 4 Core Progression — pré-audit raccord points de compétence gagnés

Date : 2026-09-22

## Gouvernance

- Branche : `work/gensrpg-phase4-progression-earned-skill-points-raccord-preaudit-2026-09-22`
- Checkpoint de départ : `checkpoint/gensrpg-start-phase4-progression-earned-skill-points-raccord-preaudit-2026-09-22`
- Base : `f892e6edad42acce4a43351e6f69c7837c76e637`
- Dernier GREEN : `checkpoint/gensrpg-phase4-progression-earned-skill-points-contract-green-2026-09-22`
- `main` reste gelée sur `e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Propriétaire et seam

Propriétaire actif :
`dungeonCore044HeroProgression`.

Seam :
`window.dungeonRpgEarnedSkillPoints`.

Consommateur principal :
`dungeonSyncProgressionForState`, hors périmètre de ce lot.

Dépendance de niveau :
`dungeonRpgLevelFromXp(xp)`, déjà raccordée au Core Progression.

## Candidat de raccord minimal

Le futur raccord doit conserver les lectures existantes et déléguer seulement le calcul final :

`window.dungeonRpgEarnedSkillPoints=function(xp){const p=activeProg();if(!p){const r=loadDungeonRpgRules(),level=dungeonRpgLevelFromXp(xp);return GensProgressionV1.earnedSkillPointsFromLevel(level,null,r.startingSkillPoints,r.skillPointsPerLevel)}const level=dungeonRpgLevelFromXp(xp);return GensProgressionV1.earnedSkillPointsFromLevel(level,p)}`

Ce candidat :
- ne recrée pas la courbe XP ;
- conserve le niveau canonique ;
- conserve la différence profil configuré / fallback Dungeon ;
- n'ajoute qu'un appel Core ;
- ne change pas l'ordre des lectures propriétaires.

## Normalisation réelle

Le pré-audit a d'abord identifié une divergence théorique sur un niveau `NaN`.
Elle provenait d'un harness qui injectait directement des règles non normalisées.

Le vrai chemin appelle :
`loadDungeonRpgRules() -> normalizeDungeonRpgRules()`.

Cette normalisation garantit une valeur utilisable pour `xpPerLevel`,
`startingSkillPoints` et `skillPointsPerLevel`. Le cas théorique n'est donc pas
une divergence du vrai runtime et ne justifie aucune modification du Core.

## Matrice

La sentinelle :
`tests/gens_phase4_progression_earned_skill_points_raccord_preaudit_v1.test.cjs`

vérifie 65 cas :
- absence de profil ;
- règles Dungeon par défaut et personnalisées ;
- règles brutes invalides et négatives traversant le normaliseur réel ;
- profil linéaire ;
- profil custom ;
- progression vide configurée ;
- progression absente ;
- profil non-Dungeon ;
- entrées XP numériques, chaînes, invalides et Infinity ;
- ordre des lectures ;
- un seul appel à `earnedSkillPointsFromLevel` dans le candidat.

Sources protégées :
- `index.html` : blob `8da7afa3c986f29e740eee1748dcc0ec0f8f75bc`, 8 174 346 octets ;
- Core Progression : blob `3cca29084ce436a8dcae95e5d6d745edd4afa3cf`.

## Interdictions

Aucun runtime ni Core n'est modifié dans ce pré-audit.
Aucun changement de `dungeonSyncProgressionForState`, points dépensés, bonus,
stat points, distribution XP, level-up, UI, persistance ou Event Bus.


## Validation technique du pré-audit

SHA :
`495011a8a0c7b42e2f7748f20ac3fcf20902f963`.

Résultats :
- Architecture + navigateur complet : `35740076726` — SUCCESS ;
- Firefox : `35740076816` — SUCCESS ;
- Tactical Dock : `35740076884` — SUCCESS.

La sentinelle de 65 cas traverse la normalisation réelle des règles Dungeon et
valide le candidat sans modifier ni runtime ni Core.

Le lot suivant autorisé est un raccord runtime séparé et minimal de
`dungeonRpgEarnedSkillPoints` vers
`GensProgressionV1.earnedSkillPointsFromLevel`.

La clôture documentaire doit elle-même repasser la triple CI avant création de :
`checkpoint/gensrpg-phase4-progression-earned-skill-points-raccord-preaudit-green-2026-09-22`.
