# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4A : boutons de rencontre Core 2.01

- Branche : `work/gensrpg-combat-callsite-migration-4-2026-09-16`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-4-2026-09-16`
- Base exacte : `8c2c225674ed66212e1025a827e3ca078354f9e9`
- Checkpoint vert précédent : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16`
- Commit runtime lot 4A : `99598988eba1d135c012e3af862773c234de1ce5`
- SHA vert avant cette mise à jour documentaire : `a5dd5d20793ac3ebe449814d521d42405dcfefe9`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat lot 4A

Les deux commandes du panneau de rencontre Core 2.01 — `ENGAGER LE COMBAT` et `ATTAQUER` — ne passent plus par l'alias historique `dc200StartCombat`.

Core 2.01 utilise maintenant un helper local sans état ni règle métier qui transmet au contrat canonique :

`GensRpgTacticalCombatV2Bridge.requestCombat(window, options)`

Le helper conserve les `enemyIds`, la raison existante et un `entry` de diagnostic propre au panneau de rencontre.

Le mode positionnel reste contrôlé par le garde existant et l'attaque sur case ennemie conserve la cible réellement située sur la case du héros actif.

## Dette combat après lot 4A

Inventaire attendu dans `index.html` :

- `dc200StartCombat` : 11 ;
- `openDungeonCombatSetup` : 1 — définition historique rollback uniquement ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Le groupe suivant doit être caractérisé avant modification. Ne pas migrer en masse détection, embuscade, furtivité ou wrappers timeline.

## Ce qui n'a pas été touché

- détection / portée V113 ;
- embuscade ;
- timeline ;
- `startCombat` et `launchCombat200` ;
- participants et règles de combat ;
- stats, XP, récompenses et loot ;
- déplacement ;
- navigation générale, fiche héros, Save & Quit ;
- Survival, Capture, PvP, World Builder ;
- cache/PWA.

## Validation lot 4A

Sur `a5dd5d20793ac3ebe449814d521d42405dcfefe9` :

- sentinelles architecture : vertes ;
- test permanent Core 2.01 -> Bridge : vert ;
- Chromium / preview : vert ;
- Firefox : vert ;
- workflow progression revenu en lecture seule ;
- `main` intact.

## Observations utilisateur à conserver hors périmètre

Ces points sont signalés mais ne doivent pas être corrigés à l'aveugle pendant la migration combat :

1. Les commandes flottantes de combat `Attaque / Fin de tour / Capacité` ont complètement disparu de l'interface. Elles ne sont pas simplement devenues non flottantes : elles ne sont plus présentes.
2. Lors d'une ouverture de fiche personnage, des éléments de `Talent` sont apparus brièvement puis ont disparu. Le phénomène n'a pas été reproduit au second essai.

Pour ces deux anomalies, appliquer la charte : identifier d'abord le propriétaire et le premier changement responsable ; vérifier rendu/couches/CSS/autorités avant toute réparation fonctionnelle ; aucun observer, timer ou rerender correctif ajouté.

## Prochaine étape

Caractériser les 11 références restantes à `dc200StartCombat` et les 6 références `startCombat`, puis choisir le plus petit groupe homogène suivant. Priorité à un lot soustractif qui retire un intermédiaire historique sans modifier les règles Dungeon/Tactical.

## Jalons verts précédents

- Lot 3 : `checkpoint/gensrpg-combat-callsite-migration-3-green-2026-09-16` — `8c2c225674ed66212e1025a827e3ca078354f9e9`, validé utilisateur.
- Lot 2 : `checkpoint/gensrpg-combat-callsite-migration-2-green-2026-09-16` — `b77225582f9b854b2b0e658029ebb783fc31aab7`.
- Lot 1 : `checkpoint/gensrpg-combat-callsite-migration-1-green-2026-09-16` — `2aa6ba574923229af105cbee1635eeb9efab18cb`.
- XP + portrait : `checkpoint/gensrpg-xp-portrait-cleanfix-green-2026-09-16` — `695be0e029fb49ee70966729474b35aa0a2d9c63`, validé utilisateur Firefox.

## Règle permanente de continuité

À chaque chantier :

1. lire `docs/GENSRPG_CHARTE.md` puis ce fichier ;
2. checkpoint de départ avant le premier changement ;
3. branche créée depuis exactement ce checkpoint ;
4. caractériser/tester avant correction ;
5. checkpoint vert sur le SHA exact validé ;
6. mettre ce fichier à jour avant le chantier suivant.
