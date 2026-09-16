# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration des points d'entrée combat, lot UI manuel 1

- Branche de travail : `work/gensrpg-combat-callsite-migration-1-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-2026-09-16`
- Base exacte : `695be0e029fb49ee70966729474b35aa0a2d9c63`
- Checkpoint vert précédent : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`

## Validation utilisateur du jalon précédent

Le 16/09/2026, la preview figée sur `695be0e029fb49ee70966729474b35aa0a2d9c63` a été retestée sur Firefox par l'utilisateur :

- arts / portrait fiche héros : corrigés ;
- XP manuel / progression : corrigés ;
- aucune publication sur `main`.

Le jalon XP + portrait est donc fermé. Il ne doit pas être rouvert dans le chantier courant.

## Périmètre strict du chantier courant

Ce premier lot de migration combat ne traite que les deux boutons UI natifs suivants :

1. `#dungeonCombatMenuBtn` — bouton « ENGAGER LE COMBAT » ;
2. `#dungeonCombatSheetBtn` — bouton « Combat RPG » de la fiche.

Aujourd'hui, ces deux boutons appellent encore l'adaptateur historique global `openDungeonCombatSetup()`.

Cible : ils doivent appeler directement l'unique contrat du Bridge :

`GensRpgTacticalCombatV2Bridge.requestCombat(window, options)`

avec `reason: "manual-setup"` et une valeur `entry` propre à chaque bouton.

## Propriétaires et systèmes réutilisés

- propriétaire du routage combat : `GensRpgTacticalCombatV2Bridge.requestCombat()` ;
- autorité de scope / participants : V113 via le Bridge ;
- moteur / UI combat : Tactical V2 existant ;
- retour exploration : contrat existant du Bridge ;
- aucun nouveau helper global, wrapper, observer, timer, retry ou renderer n'est autorisé.

## Fonctions et comportements protégés — interdiction de toucher dans ce lot

- `dc200StartCombat()` ;
- `startCombat()` ;
- `launchCombat200()` ;
- détection automatique ;
- embuscades ;
- furtivité / échec de furtivité ;
- sélection et renforts ennemis ;
- règles de participants V113 ;
- mode MJ ;
- calculs stats / touche / dégâts / armure / résistances ;
- XP, récompenses et loot ;
- navigation, fiche héros, Save & Quit ;
- déplacement Dungeon ;
- cache/PWA ;
- Survie, Capture, PvP et World Builder.

## État caractérisé avant modification

Inventaire actuel dans `index.html` :

- `dc200StartCombat` : 13 occurrences ;
- `openDungeonCombatSetup` : 17 occurrences ;
- `launchCombat200` : 2 occurrences ;
- `startCombat` : 6 occurrences.

Les deux boutons du lot courant représentent exactement 2 des 17 occurrences de `openDungeonCombatSetup`.

Après migration, le compteur attendu doit devenir :

- `openDungeonCombatSetup` : 15 ;
- tous les autres compteurs inchangés.

## Tests exigés avant checkpoint vert

- test dédié des deux boutons réels : ils doivent appeler directement `requestCombat(window, ...)` ;
- `reason` doit rester `manual-setup` ;
- chaque bouton doit fournir une `entry` identifiable ;
- les deux boutons ne doivent plus référencer `openDungeonCombatSetup` ;
- test du contrat Bridge unique vert ;
- inventaire de dette mis à jour de 17 vers 15 uniquement ;
- sentinelles V112/V113/Bridge vertes ;
- architecture globale verte ;
- Chromium / preview verte ;
- Firefox wall sentinel verte ;
- aucune autre occurrence historique ne doit changer dans ce lot.

## Risque inter-module principal

Le risque est de court-circuiter le scope V113 en lançant Tactical directement depuis l'UI. Le bouton ne doit donc jamais appeler l'UI Tactical ni le moteur Tactical lui-même : il passe exclusivement par `GensRpgTacticalCombatV2Bridge.requestCombat()`, qui conserve le filtrage Dungeon, participants, ennemis et retour exploration.

## Séquence de travail

1. figer le test des deux boutons avant correction ;
2. remplacer uniquement leurs deux `onclick` ;
3. diminuer l'inventaire `openDungeonCombatSetup` de 17 à 15 ;
4. relancer Bridge + inventaire + architecture + navigateurs ;
5. créer un checkpoint vert ;
6. seulement ensuite choisir un autre petit groupe homogène de points d'entrée historiques.

## Chantier précédent — XP manuel + portrait fiche héros (vert)

Checkpoint final : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` sur `695be0e029fb49ee70966729474b35aa0a2d9c63`.

Résultat :

- `changeXP()` natif reste propriétaire du XP manuel et passe par le moteur canonique de progression ;
- aucun runtime progression parallèle n'est chargé ;
- le portrait de fiche possède une seule autorité active ;
- anciennes couches de réparation de fiche neutralisées sans retirer les arts du plateau ;
- architecture, Chromium, Firefox et progression verts ;
- validation utilisateur Firefox positive sur arts + XP.

## Règle permanente de continuité

À chaque nouveau chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. créer le checkpoint de départ AVANT le premier changement ;
3. créer la branche depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. créer un checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant de passer au chantier suivant.

Ne jamais reprendre un chantier à partir d'une branche historique ambiguë si un checkpoint vert plus récent est indiqué ici.
