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

Le fallback explicite doit reproduire la place exacte de
`loadDungeonRpgRules().xpPerLevel` dans l'expression legacy : il n'est pas
pré-normalisé par `Number(...)` dans le Core. Un fallback truthy mais non
numérique peut donc conduire à `NaN`, comme l'expression historique.

Conséquences historiques à conserver :
- `xpPerLevel=0` -> fallback ;
- `xpPerLevel="bad"` -> fallback ;
- `xpPerLevel=-5` -> truthy puis clamp à 1 ;
- fallback lui-même `"bad"` -> résultat `NaN`.

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


## RED TDD observé

SHA :

`69b6791a90cc85accaefd2595174ea8153550b4f`.

Runs :
- Architecture :
  `35719759926` — FAILURE attendu ;
- Firefox :
  `35719759695` — SUCCESS ;
- Tactical Dock :
  `35719759730` — SUCCESS.

Toutes les étapes Progression antérieures passent avant le nouveau RED :
- pré-audit Progression ;
- contrat pur `levelFromXp` ;
- pré-audit premier raccord ;
- premier raccord réel ;
- pré-audit `xpIntoLevel`.

L'unique nouvelle étape en échec est :

`Verrouiller le contrat pur XP dans le niveau Core Progression`.

Cause exacte :

`GensProgressionV1.xpIntoLevel` est `undefined` alors que la sentinelle exige
une fonction.

Aucun runtime/Core n'a été modifié pour obtenir ce RED.

## Prochaine action après RED

Ajouter uniquement la primitive pure `xpIntoLevel` au service Core Progression
existant, sans modifier `index.html`, Core 0.44, service worker, UI, Storage ou
gameplay.

Le propriétaire historique restera non raccordé dans ce lot.


## Implémentation pure obtenue

Core Progression :
`assets/gensrpg/core/progression-v1.js`.

Blob final du Core pour ce lot :
`f633de55f1e6bda339e66c65debc35d7b8da2510`.

API publique :
- `levelFromXp(xp, progressionConfig)` ;
- `xpIntoLevel(xp, progressionConfig, fallbackXpPerLevel)`.

Le propriétaire runtime historique
`dungeonCore044HeroProgression -> dungeonRpgXpIntoLevel`
reste non raccordé à `GensProgressionV1.xpIntoLevel`.

`index.html` reste byte-identique :
- taille `8 174 416` octets ;
- blob `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Aucun changement service worker / composition / graphe de production dans ce lot.

## Validation technique avant clôture documentaire

SHA :
`dfb325fe7cdf66450350bd1f5ab1a5b7ab096d4a`.

Runs sur ce SHA exact :
- Architecture + navigateur complet :
  `35720388888` — SUCCESS ;
- Firefox :
  `35720388992` — SUCCESS ;
- Tactical Dock :
  `35720388950` — SUCCESS.

Toutes les sentinelles Progression historiques passent avec le nouveau contrat pur.

## Clôture conditionnelle

Checkpoint GREEN cible :

`checkpoint/gensrpg-phase4-progression-xp-into-level-contract-green-2026-09-22`.

La clôture documentaire change le SHA. Le SHA documentaire final exact doit donc
repasser Architecture + navigateur complet, Firefox et Tactical Dock avant
création du checkpoint GREEN.

Après GREEN, ouvrir un lot séparé de pré-audit du raccord runtime de
`dungeonRpgXpIntoLevel` vers `GensProgressionV1.xpIntoLevel`.

Ne pas inclure dans ce futur raccord :
- `dungeonRpgEarnedSkillPoints` ;
- synchronisation des points ;
- XP manuel/combat/objectifs ;
- level-up ;
- UI/persistance.
