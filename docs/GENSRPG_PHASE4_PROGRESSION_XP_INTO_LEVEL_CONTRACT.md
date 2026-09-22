# GenSrpG — Phase 4 Core Progression / XP — contrat pur XP dans le niveau

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-into-level-contract-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-into-level-contract-2026-09-22`.
- Base exacte :
  `b6d91ffeaa9317c9dbc329f73ce83220544eb5e2`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-next-seam-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission unique

Ajouter au service Core Progression existant un contrat pur :

`GensProgressionV1.xpIntoLevel(xp, progressionConfig, fallbackXpPerLevel)`.

Ce lot ne raccorde **aucun** consommateur runtime.

Le propriétaire historique
`dungeonCore044HeroProgression -> dungeonRpgXpIntoLevel`
doit rester inchangé pendant ce lot.

## Source du contrat

Pré-audit GREEN :

`checkpoint/gensrpg-phase4-progression-xp-next-seam-preaudit-green-2026-09-22`

SHA :

`b6d91ffeaa9317c9dbc329f73ce83220544eb5e2`.

Document :

`docs/GENSRPG_PHASE4_PROGRESSION_XP_NEXT_SEAM_PREAUDIT.md`.

## Sémantiques à préserver

### XP

Normalisation :
`Math.max(0, Number(xp) || 0)`.

### Sans profil

Le Core reçoit explicitement `fallbackXpPerLevel`.

Il ne doit pas connaître ni appeler `loadDungeonRpgRules()`.

Le modulo historique est conservé.

### Profil linéaire

Priorité :
1. `progressionConfig.xpPerLevel` si sa conversion numérique est truthy ;
2. sinon `fallbackXpPerLevel` ;
3. sinon `10`.

Le résultat `per` est ensuite clampé à au moins 1.

Conséquence historique à conserver :
- `xpPerLevel=0` -> fallback ;
- `xpPerLevel="bad"` -> fallback ;
- `xpPerLevel=-5` -> truthy puis clamp à 1.

### Profil custom

Le niveau courant doit être déterminé par le contrat Core existant :

`levelFromXp(value, progressionConfig)`.

Puis `xpIntoLevel` soustrait uniquement :

`progressionConfig.xpThresholds[level]`

si ce seuil explicite produit une valeur numérique truthy, sinon 0.

La sémantique historique de seuils clairsemés doit donc être conservée même si
elle est contre-intuitive.

## Interdictions

- aucun accès DOM ;
- aucun Storage ;
- aucun IndexedDB ;
- aucun listener ;
- aucun événement ;
- aucun timer/retry ;
- aucun RNG ;
- aucune navigation ;
- aucune mutation de state ;
- aucun rendu ;
- aucun appel à `loadDungeonRpgRules()` ;
- aucun raccord de `dungeonRpgXpIntoLevel` ;
- aucun changement `dungeonRpgEarnedSkillPoints` ;
- aucun XP manuel/combat/objectifs ;
- aucun level-up ;
- aucun changement sur `main`.

## TDD

Sentinelle :

`tests/gens_phase4_progression_xp_into_level_contract_v1.test.cjs`.

RED attendu avant modification du Core :

`GensProgressionV1.xpIntoLevel` absent.

La sentinelle couvre :
- no-profile ;
- fallback Dungeon explicite ;
- fallback 10 ;
- valeurs négatives ;
- profil linéaire ;
- profil custom complet ;
- profil custom clairsemé/invalide ;
- overflow au niveau max ;
- déterminisme ;
- immutabilité de config ;
- maintien de `levelFromXp` ;
- API publique gelée ;
- absence de raccord runtime.

## Critère GREEN

Le lot peut devenir GREEN seulement si :
1. RED observé avant modification Core ;
2. implémentation pure minimale ;
3. aucun raccord runtime ;
4. `index.html` byte-identique ;
5. Architecture + navigateur complet SUCCESS ;
6. Firefox SUCCESS ;
7. Tactical Dock SUCCESS ;
8. documentation finale validée sur le même SHA.

## Suite après GREEN

Ouvrir un lot séparé de pré-audit/raccord de
`dungeonRpgXpIntoLevel` vers le nouveau contrat Core.

Ne pas mélanger ce raccord avec :
- points de compétence ;
- synchronisation progression ;
- level-up ;
- distribution XP ;
- UI/persistance.
