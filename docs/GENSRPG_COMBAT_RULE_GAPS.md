# GenSrpG — Ecarts confirmés des règles de combat

Date : 2026-09-15
Base observée : `main` au commit `e8681f9823573ced8aec59c8ddc47a72b02bc663`

Ce document enregistre les écarts constatés après le retour de la fiche héros. Ils ne doivent pas être corrigés par une nouvelle couche globale : ils seront traités dans la consolidation du moteur combat/stats.

## 1. Bonus de dégâts de mêlée issu de Force

Règle attendue actuellement :
- règle RPG par défaut : `physicalDamageStep = 10`, `physicalDamageGain = 1` ;
- donc une Force canonique de 16 donne bien `+1` dégât physique de mêlée ;
- une Force de 20 donne `+2`, etc., tant que la formule reste `step`.

Le runtime historique possède encore `dungeonPhysicalDamageBonus()` qui calcule ce bonus depuis `dungeonAttributeValue("force")`.

Le bridge Tactical V110 crée un snapshot canonique avec les vraies valeurs `values.force`, `values.agilite`, etc., mais son champ `derived.physicalDamageBonus` dépend encore d'un appel au vieux seam global `dungeonPhysicalDamageBonus()` au lieu de dériver le bonus directement depuis la valeur canonique déjà snapshotée.

Conséquence possible et désormais confirmée par le test utilisateur :
- la fiche/stat canonique peut afficher la bonne Force ;
- le combat tactique peut néanmoins recevoir `physicalDamageBonus = 0` ;
- V114.11 sait ajouter le bonus aux dégâts, mais seulement si le snapshot lui fournit déjà la bonne valeur.

Le test `gens_rpg_tactical_damage_v167811411.test.cjs` injecte artificiellement `physicalDamageBonus: 1`, donc il prouve que le resolver V114.11 sait l'utiliser, mais pas que le vrai snapshot runtime le calcule correctement.

Le test `gens_rpg_tactical_root_stats_v16781147.test.cjs` vérifie les valeurs canoniques Force/Agilité/Défense/Mouvement, mais son stub `dungeonPhysicalDamageBonus()` renvoie volontairement `0` et il ne vérifie pas `snap.derived.physicalDamageBonus`. C'est un trou de couverture de test.

### Cible de consolidation

Le propriétaire des dégâts dérivés doit être le moteur de stats/règles canonique :

`Force canonique -> règle RPG -> physicalDamageBonus -> snapshot Tactical`

Le Tactical ne doit plus relire un ancien helper global dépendant du contexte `current/state` pour ce calcul.

## 2. Armure égale ou supérieure aux dégâts bruts

La V114.11 contient déjà le mécanisme : lorsque `dégâts bruts - armure <= 0`, un jet décide entre blocage complet et 1 dégât minimum.

Ancienne valeur par défaut :
- 75 % blocage complet ;
- 25 % chance de laisser passer 1 dégât.

Nouvelle décision de design du 2026-09-15 :
- **50 % blocage complet** ;
- **50 % chance de laisser passer 1 dégât**.

Cette valeur doit être portée par la règle RPG unique `armorZeroBlockChance`, pas codée à plusieurs endroits.

Attention : changer seulement le fallback Tactical ne suffit pas ; la valeur existe aussi dans les règles RPG sauvegardées. La migration doit être explicite afin d'éviter qu'un ancien `75` local continue à gagner silencieusement sur le nouveau défaut.

## 3. Description des dégâts insuffisante

Le résultat de combat contient déjà des données utiles (`baseWeaponDamage`, `statDamageBonus`, `rawDamage`, `armor`, `armorZeroBlockChance`, `armorRoll`, `armorBlocked`, `finalDamage`), mais l'interface ne les présente pas de façon suffisamment lisible.

Affichage cible après chaque touche :

```text
Dégâts
Arme : 2
Force : +1
Dégâts bruts : 3
Armure cible : -3
Résultat avant seuil : 0
Armure ≥ dégâts : test de blocage 50 %
Jet armure : 63 -> 1 dégât passe
Dégâts finaux : 1
```

Si blocage complet :

```text
Jet armure : 24 -> bloqué
Dégâts finaux : 0
```

Pour plusieurs dés, chaque touche doit conserver son propre détail de dégâts, puis afficher le total.

## 4. Tests à ajouter avant publication

1. Snapshot runtime réel : Force 16 avec règles 10/+1 -> `physicalDamageBonus = 1` sans dépendre de `dungeonPhysicalDamageBonus()`.
2. Equipement/effets qui augmentent Force doivent modifier le bonus via la valeur canonique.
3. Attaque mêlée physique reçoit le bonus ; attaque distance physique ne le reçoit pas si la règle actuelle reste ainsi.
4. Armure = dégâts avec réglage 50 : 50 blocages / 50 dégâts de 1 sur 100 valeurs forcées.
5. Test navigateur mobile : le panneau de résultat affiche arme + stat + armure + jet de seuil + dégâts finaux.
6. Non-régression : fiche héros et Save & Quit restent sous autorité Dungeon, aucun observer global Tactical ne revient.

## 5. Ordre de correction

Ne pas ajouter un nouveau hotfix autonome.

Corriger dans les propriétaires existants pendant la consolidation :
1. snapshot stats/règles ;
2. resolver de dégâts unique ;
3. affichage du détail ;
4. règle 50/50 et migration ;
5. tests de frontière ;
6. seulement ensuite publication.
