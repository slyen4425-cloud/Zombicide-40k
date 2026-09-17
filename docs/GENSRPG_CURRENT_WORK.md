# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4B : retrait de la timeline Core 3.01 désactivée

- Branche : `work/gensrpg-combat-callsite-migration-4b-2026-09-17`
- Checkpoint de départ : `checkpoint/gensrpg-start-combat-callsite-migration-4b-2026-09-17`
- Base exacte : `498ab21e9e52746160a5a6de2cb158393a06a7d1`
- Checkpoint vert précédent : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17`
- Commit runtime lot 4B : `06c93772b614ff8d226b9c0cd461ce1b78775b64`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultat lot 4A conservé

Les deux commandes du panneau de rencontre Core 2.01 — `ENGAGER LE COMBAT` et `ATTAQUER` — passent directement par le contrat canonique `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` via un helper local sans règle métier.

Checkpoint vert 4A :

`checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.

## Résultat lot 4B

Le script `#dungeonCore301Timeline`, déjà désactivé par `type="application/x-gensrpg-disabled"`, a été supprimé au lieu d'être modernisé.

Ce script contenait exactement deux références historiques à `dc200StartCombat`. Le test 4B a d'abord prouvé la présence du bloc, puis le one-shot a refusé toute suppression plus large que ce bloc exact.

Le périmètre est volontairement strict :

- le CSS historique `#dungeonCore301TimelineCss` reste présent ;
- le wrapper actif `#dungeonCore303TimelineRootFix` reste présent et intact ;
- aucune détection, embuscade ou règle de participation n'a été modifiée ;
- `startCombat` / `launchCombat200` restent inchangés ;
- XP / récompenses ont été caractérisés verts après le retrait.

## Dette combat après lot 4B

Inventaire attendu dans `index.html` :

- `dc200StartCombat` : 9 ;
- `openDungeonCombatSetup` : 1 — définition historique rollback uniquement ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Les 9 références `dc200StartCombat` restantes se répartissent encore entre :

- alias historique Core 2.x ;
- détection / embuscade Core 2.09 ;
- détection Core 2.11 ;
- wrapper timeline actif Core 3.03.

Aucun de ces groupes ne doit être modifié sans caractérisation dédiée.

## Tests permanents lot 4B

- `tests/gens_core301_disabled_timeline_retirement_lot4b.test.cjs` ;
- inventaire des callsites mis à jour à 9/1/2/6 ;
- garde permanent raccordé aux sentinelles architecture ;
- le test protège explicitement le wrapper actif Core 3.03 et le CSS voisin.

Le workflow progression temporairement utilisé pour écrire le gros `index.html` est revenu à son blob canonique lecture seule `31c5043f8352b656f1d015bc4888332e738bf913` après le commit runtime.

## Ce qui n'a pas été touché

- détection / portée V113 ;
- embuscade ;
- timeline active Core 3.03 ;
- `startCombat` et `launchCombat200` ;
- participants et règles de combat ;
- stats, XP, récompenses et loot ;
- déplacement ;
- navigation générale, fiche héros, Save & Quit ;
- Survival, Capture, PvP, World Builder ;
- cache/PWA.

## Observations utilisateur à conserver hors périmètre

Ces points sont signalés mais ne doivent pas être corrigés à l'aveugle pendant la migration combat :

1. Les commandes flottantes de combat `Attaque / Fin de tour / Capacité` ont complètement disparu de l'interface. Elles ne sont pas simplement devenues non flottantes : elles ne sont plus présentes.
2. Lors d'une ouverture de fiche personnage, des éléments de `Talent` sont apparus brièvement puis ont disparu. Le phénomène n'a pas été reproduit au second essai.

Pour ces deux anomalies, appliquer la charte : identifier d'abord le propriétaire et le premier changement responsable ; vérifier rendu/couches/CSS/autorités avant toute réparation fonctionnelle ; aucun observer, timer ou rerender correctif ajouté.

## Validation finale requise avant checkpoint vert 4B

Sur un même SHA final :

1. le test spécifique 4B doit être vert ;
2. tout le job architecture doit être vert ;
3. Chromium / preview doit être vert ;
4. Firefox doit être vert ;
5. la comparaison avec `498ab21e9e52746160a5a6de2cb158393a06a7d1` doit confirmer le périmètre ;
6. aucun workflow temporaire d'écriture ne doit rester ;
7. `main` doit rester intact.

## Prochaine étape après validation 4B

Ne pas supprimer automatiquement le wrapper actif Core 3.03. Le caractériser d'abord : vérifier s'il produit encore une responsabilité utilisateur réelle sur la timeline ou s'il est déjà supplanté par Tactical/Bridge. Les chemins détection/embuscade restent également séparés car ils sont gameplay-critiques.

## Jalons verts précédents

- Lot 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.
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
