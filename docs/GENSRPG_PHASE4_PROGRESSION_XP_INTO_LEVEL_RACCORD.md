# GenSrpG — Phase 4 Core Progression / XP — raccord XP dans le niveau

Date : 2026-09-22

## Gouvernance

- Branche :
  `work/gensrpg-phase4-progression-xp-into-level-raccord-2026-09-22`.
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase4-progression-xp-into-level-raccord-2026-09-22`.
- Base exacte :
  `29a2ab49779a5a0a43d6a063ffa69ca898905d00`.
- Checkpoint GREEN de départ :
  `checkpoint/gensrpg-phase4-progression-xp-into-level-raccord-preaudit-green-2026-09-22`.
- Production gelée :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, V16.78.114.11.

## Mission unique

Raccorder uniquement :

`dungeonCore044HeroProgression -> dungeonRpgXpIntoLevel`

vers :

`GensProgressionV1.xpIntoLevel`.

Le raccord doit être soustractif :
- retirer le calcul modulo/custom local du propriétaire runtime ;
- conserver `activeProg()` à la frontière ;
- conserver la normalisation XP historique ;
- conserver le fallback Dungeon lazy ;
- ne créer aucune autre autorité.

## État de départ

`index.html` :
- taille `8 174 416` octets ;
- blob `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Core Progression :
- blob `f633de55f1e6bda339e66c65debc35d7b8da2510` ;
- API `levelFromXp` + `xpIntoLevel`.

Le Core doit rester byte-identique pendant le raccord.

## Raccord cible

Forme issue du pré-audit GREEN :

`window.dungeonRpgXpIntoLevel=function(xp){const p=activeProg(),v=Math.max(0,Number(xp)||0),needsFallback=(!p||(p.xpCurveMode||"linear")!=="custom")&&!Number(p?.xpPerLevel),fallback=needsFallback?loadDungeonRpgRules().xpPerLevel:undefined;return GensProgressionV1.xpIntoLevel(v,p,fallback)}`

Propriétés obligatoires :
- `activeProg()` appelé une fois ;
- Core appelé exactement une fois ;
- aucune lecture Dungeon rules si un profil linéaire a un `xpPerLevel` numérique truthy ;
- une lecture Dungeon rules si le fallback est requis ;
- aucune lecture Dungeon rules en custom ;
- aucun appel runtime à `dungeonRpgLevelFromXp` depuis ce seam après raccord.

## TDD

Sentinelle :

`tests/gens_phase4_progression_xp_into_level_raccord_v1.test.cjs`.

RED attendu :
- toutes les étapes précédentes GREEN ;
- nouvelle étape
  `Raccorder XP dans le niveau au Core Progression`
  seule en échec ;
- cause : le propriétaire historique ne délègue pas encore à
  `GensProgressionV1.xpIntoLevel`.

La matrice couvre au moins 70 cas et vérifie :
- parité de résultat ;
- appel Core unique ;
- lecture profil unique ;
- fallback Dungeon lazy ;
- no-profile ;
- linéaire normal/zéro/invalide/négatif ;
- custom complet/clairsemé ;
- chaînes numériques, négatifs, overflow et NaN.

## Hors périmètre

Ne pas toucher :
- `dungeonRpgEarnedSkillPoints` ;
- `dungeonSyncProgressionForState` ;
- `changeXP` ;
- XP combat/objectifs/récompenses ;
- points dépensés ;
- level-up ;
- restauration/popup/son ;
- persistence/rendu ;
- Stats/Inventory/Storage/Dice/Tactical.

## Règle 26 avant modification index.html

Le RED peut être obtenu sans modifier le gros HTML.

Avant le raccord runtime, la copie exacte de `index.html` doit être disponible
et vérifiée :
- taille attendue `8 174 416` ;
- blob attendu `a68bcbaf5d16bdbe2e70cbe0959a421371554fcc`.

Si aucune copie exacte n'est disponible localement au moment du patch, demander
le fichier utilisateur via le lien direct GitHub correspondant au SHA de base.
Ne jamais reconstruire approximativement le gros HTML.

## Suite

Après RED prouvé :
1. modifier uniquement le vrai propriétaire dans `index.html` ;
2. garder Core byte-identique ;
3. réaligner uniquement les sentinelles historiques invalidées par ce raccord ;
4. triple CI ;
5. clôture documentaire ;
6. triple CI finale sur le même SHA ;
7. checkpoint GREEN.

Aucun merge sur `main`.
