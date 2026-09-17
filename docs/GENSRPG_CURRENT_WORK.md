# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — migration combat, lot 4C : retrait du wrapper de démarrage Core 3.03

- Branche : `work/gensrpg-combat-callsite-migration-4c-2026-09-17`
- Base exacte / lot 4B vert : `9c1b939ed7e7b34108882be933a99f2151529c79`
- Commit runtime lot 4C : `1819f012e0509648015f2af695905078168210a1`
- Production `main` sûre : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`
- `main` ne doit pas être modifié pendant la restructuration.

## Résultats conservés

### Lot 4A

Les deux commandes du panneau de rencontre Core 2.01 — `ENGAGER LE COMBAT` et `ATTAQUER` — passent directement par le contrat canonique `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` via un helper local sans règle métier.

Checkpoint vert 4A : `checkpoint/gensrpg-combat-callsite-migration-4a-green-2026-09-17` — `498ab21e9e52746160a5a6de2cb158393a06a7d1`.

### Lot 4B

Le script `#dungeonCore301Timeline`, déjà désactivé par `type="application/x-gensrpg-disabled"`, a été supprimé au lieu d'être modernisé. Le CSS historique voisin et Core 3.03 sont restés hors périmètre.

SHA vert de référence 4B : `9c1b939ed7e7b34108882be933a99f2151529c79`.

### Lot 4C

Core 3.03 a été caractérisé avant modification. Le test permanent a d'abord été rouge exactement sur son wrapper `window.dc200StartCombat` tandis que les 60 gardes précédents restaient verts.

Le Bridge Tactical est chargé après Core 3.03 par `RuntimeBootstrap` et réinstalle `rt.dc200StartCombat` comme adaptateur final vers `requestCombat()`. Le wrapper Core 3.03 était donc une reprise d'autorité historique immédiatement supplantée.

Le lot retire uniquement ce petit wrapper :

- état timeline `T` conservé ;
- `init(force=false)` conservé ;
- `advance()` conservé ;
- `applyTurnUi()` conservé ;
- IA / changements de tour conservés ;
- `dungeonDebug303` conservé ;
- détection / embuscade non modifiées ;
- participants, résolution Tactical, XP et récompenses non modifiés.

Le workflow progression temporaire utilisé pour écrire le gros `index.html` a été remis immédiatement à son blob canonique lecture seule `31c5043f8352b656f1d015bc4888332e738bf913`.

## Dette combat après lot 4C

Inventaire attendu dans `index.html` :

- `dc200StartCombat` : 7 ;
- `openDungeonCombatSetup` : 1 — définition historique rollback uniquement ;
- `launchCombat200` : 2 ;
- `startCombat` : 6.

Les 7 références `dc200StartCombat` restantes appartiennent désormais aux chemins Core 2.x : alias historique et détection / embuscade. Aucun de ces chemins gameplay-critiques ne doit être modifié sans caractérisation dédiée de ses `enemyIds`, `reason`, scope V113 et comportement d'embuscade.

## Tests permanents lot 4C

- `tests/gens_core303_start_wrapper_retirement_lot4c.test.cjs` ;
- inventaire combat mis à jour à 7/1/2/6 ;
- garde 4C raccordé aux sentinelles architecture ;
- le test protège explicitement les responsabilités actives de Core 3.03 et l'autorité finale du Bridge.

## Ce qui n'a pas été touché

- détection / portée V113 ;
- embuscade ;
- responsabilités timeline/IA actives Core 3.03 ;
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

Pour ces deux anomalies, appliquer la charte : identifier d'abord le propriétaire et le premier changement responsable ; vérifier rendu/couches/CSS/autorités avant toute réparation ; aucun observer, timer ou rerender correctif ajouté.

## Validation finale requise avant checkpoint vert 4C

Sur un même SHA final :

1. le test spécifique 4C doit être vert ;
2. tout le job architecture doit être vert ;
3. Chromium / preview doit être vert ;
4. Firefox doit être vert ;
5. la comparaison avec `9c1b939ed7e7b34108882be933a99f2151529c79` doit confirmer le périmètre ;
6. `.github/workflows/gensrpg-progression-characterization.yml` ne doit pas apparaître dans le diff net ;
7. `main` doit rester intact.

## Prochaine étape après validation 4C

Créer le checkpoint vert exact, puis caractériser le plus petit groupe homogène parmi les 7 références Core 2.x restantes. Ne pas mélanger alias, détection et embuscade. Les chemins détection/embuscade doivent conserver la sélection V113 et leur raison métier avant toute migration.

## Jalons verts précédents

- Lot 4B : `9c1b939ed7e7b34108882be933a99f2151529c79`.
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
