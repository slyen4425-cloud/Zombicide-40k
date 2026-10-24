# GenSrpG — Phase 4 Core Stats / S11 — audit frontière dégâts

Date : 2026-09-21

Branche :
`work/gensrpg-phase4-stats-s11-damage-boundary-2026-09-21`

Base / dernier GREEN :
`bf63fbfdc2203878016f41df73fa833e111a7baf`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-stats-s11-damage-boundary-2026-09-21`

Production `main` inchangée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663` — V16.78.114.11.

## But

Caractériser la frontière dégâts réelle après S7-S10 avant tout raccord
Core Stats → Tactical ou retrait d'une lecture historique.

Ce lot de caractérisation ne modifie aucune formule de gameplay.

## Source inline exacte

Le `index.html` du HEAD S11 reste :
- taille : `8 174 580` octets ;
- blob : `5b9b9ae780f735eadef049afeb10acf0b57441fe`.

Le fichier local déjà vérifié par la règle 26 est donc toujours utilisable.

## Chaîne active dégâts

### 1. Equipment / combat scaling inline

`effectiveAttackStats(it)` part de `itemAttackStats(it)`, puis appelle
`applyDungeonCombatScaling(it,st)`.

Pour une arme RPG mêlée physique en mode step :
- `applyDungeonCombatScaling` appelle `dungeonPhysicalDamageBonus()` ;
- ajoute ce bonus à `st.strength` ;
- mémorise le même bonus dans `st.rpgDamageBonus`.

Le propriétaire Stats actif décore en plus `dungeonPhysicalDamageBonus()` avec :
- `damage:physical` ;
- `damage:melee`.

La valeur renvoyée par ce helper est donc déjà la valeur canonique finale du
bonus physique utilisée par le scaling de l'arme.

### 2. Adapter Tactical

Dans `gens-rpg-tactical-combat-v2-adapter.js`, `itemAttack()` choisit :

`st.damage ?? st.power ?? st.strength`

pour produire `attack.power`.

Une arme standard issue de `itemAttackStats()` n'a ni `damage` ni `power`.
Le chemin normal prend donc `st.strength`, qui contient déjà le bonus RPG
ajouté par `applyDungeonCombatScaling`.

### 3. Snapshot V110

`buildHeroSnapshot()` relit ensuite :
- `dungeonPhysicalDamageBonus()` ;
- `dungeonMagicDamageBonus()` ;

et stocke les résultats dans :
- `snapshot.derived.physicalDamageBonus` ;
- `snapshot.derived.magicDamageBonus`.

Il s'agit donc d'une seconde lecture du même bonus déjà consommé par le scaling
de l'arme.

### 4. V114.11 final damage

Pour une attaque physique mêlée :
- `canonicalDamageBonus()` lit
  `attacker.meta.rpgStats.derived.physicalDamageBonus` ;
- `resolvePhysicalDamage()` calcule
  `rawDamage = baseWeaponDamage + statDamageBonus`.

Or `baseWeaponDamage` vient de `attack.power`, qui peut déjà contenir ce
même bonus.

Pour les dégâts non physiques, `resolveDamagePerHit()` ne rajoute pas
`magicDamageBonus` : il consomme le `preview.damage` déjà établi.

## Sentinelle S11

Test :
`tests/gens_phase4_stats_s11_damage_boundary_characterization_v1.test.cjs`.

Premier commit du test :
`6fffae31ac381883516baf3ec2b3c2941cde06e4`.

Branchement CI :
`c8006dbf46f45f2084498c3764e9485a99014995`.

Le premier run a été RED uniquement à cause d'une erreur de syntaxe de la
sentinelle (`Unexpected end of input`). Aucun diagnostic gameplay n'en a été
tiré.

Correction de la sentinelle :
`db813073bcb59ffe286816e4201fc9a28eccefdb`.

Le test corrigé passe dans Architecture `35596199137`.

## Cas physique mêlée réellement caractérisé

Fixture :
- puissance brute arme : 5 ;
- bonus physique canonique : +3 ;
- armure cible : 2.

Chemin réel actuel :
1. scaling arme : `5 + 3 = 8` ;
2. Adapter : `attack.power = 8` ;
3. V110 : snapshot relit encore `+3` ;
4. V114.11 : `8 + 3 = 11` brut ;
5. armure 2 : `11 - 2 = 9`.

La sentinelle verrouille donc le comportement courant :
- `attack.power = 8` ;
- `snapshot physicalDamageBonus = 3` ;
- `rawDamage V114.11 = 11` ;
- `finalDamage = 9`.

## Contradiction avec le contrat final V114.11 déjà documenté

La sentinelle historique
`tests/gens_v11411_final_melee_damage_contract.test.cjs`
verrouille explicitement la formule voulue :

`5 arme + 3 bonus canonique - 2 armure = 6`.

Mais cette ancienne sentinelle construit directement une attaque
`power=5` et ne passe pas par l'Adapter / `effectiveAttackStats`.

Elle ne pouvait donc pas détecter que le vrai chemin Adapter avait déjà
transformé 5 en 8 avant l'entrée dans V114.11.

La nouvelle sentinelle S11 démontre que les deux contrats ne sont pas
équivalents dans le runtime réel.

## Cas magique caractérisé

Fixture :
- puissance brute : 5 ;
- bonus magique : +4.

Chemin actuel :
1. scaling arme : puissance 9 ;
2. V110 relit également `magicDamageBonus = 4` ;
3. V114.11 non-physique n'ajoute pas ce snapshot bonus une seconde fois.

Le snapshot magique comporte donc une **relecture redondante**, mais la
sentinelle ne démontre pas de double application V114.11 dans ce chemin.

## Conclusion fonctionnelle

S11 révèle un **défaut fonctionnel réel et séparé** sur la frontière physique
mêlée : le même bonus canonique peut être appliqué une fois lors du scaling de
l'arme puis une seconde fois par le résolveur final V114.11.

Ce défaut ne doit pas être corrigé dans le lot de cartographie/sentinelle
courant.

Conformément à la charte :
1. conserver la caractérisation ;
2. fermer ce lot sans modification gameplay ;
3. créer un checkpoint de caractérisation GREEN après CI complète ;
4. ouvrir un lot correctif dédié depuis ce checkpoint ;
5. corriger chez le vrai propriétaire de frontière ;
6. préserver la formule voulue `arme + bonus une seule fois` ;
7. vérifier mêlée, distance, magie, résistance, armure, critique et explication
   avant de reprendre le raccord S11 plus large.

## Frontière de correction probable à auditer dans le lot dédié

Le propriétaire à examiner en priorité est la conversion
`effectiveAttackStats -> Adapter itemAttack -> V114.11`.

Le correctif ne doit pas supprimer le bonus dans
`applyDungeonCombatScaling` globalement, car Dungeon classique le consomme
également.

Le lot dédié doit déterminer quelle donnée Tactical transporte :
- puissance déjà scalée ;
- ou puissance avant bonus canonique + bonus dans snapshot ;

et imposer **une seule** de ces représentations pour la mêlée physique.

Aucune décision de code n'est prise dans le présent audit.

## État

- aucun fichier runtime modifié ;
- aucun changement de formule ;
- aucun changement de PV ;
- aucun `index.html` modifié ;
- `main` inchangée.
