# GenSrpG — Inventaire des points d’entrée combat historiques

Date : 2026-09-17
Base : restructuration issue de V16.78.114.11

## But

Avant de remplacer les anciens noms globaux par le contrat unique `GensRpgTacticalCombatV2Bridge.requestCombat()`, figer les appels encore présents dans le monolithe `index.html`.

Le but n’est pas de faire tomber artificiellement tous les compteurs à zéro : un nom historique peut rester lorsqu’il constitue un adaptateur de compatibilité caractérisé, sans autorité Dungeon propre. Toute migration doit préserver les règles de participants, la détection, l’embuscade, les modes MJ et le retour exploration.

## Comptage actuel dans `index.html`

| Symbole historique | Occurrences | Rôle observé |
|---|---:|---|
| `dc200StartCombat` | 1 | alias historique Core 2.x caractérisé au lot 4G comme seed de fallback non-Dungeon capturé par le Bridge ; aucun consommateur Dungeon actif ne l’appelle |
| `openDungeonCombatSetup` | 1 | définition historique conservée uniquement comme rollback capturé par le Bridge ; aucun Core actif ne l’appelle ou ne la réinstalle |
| `launchCombat200` | 2 | lanceur historique Core 2.x caractérisé au lot 4H comme seed de fallback non-Dungeon capturé par le Bridge ; le nom public Dungeon est remplacé par l’adaptateur `requestCombat` |
| `startCombat` | 4 | fonction Core 2.x, actions de contexte `cell` / `ambush` et alias vers `dc200StartCombat` ; `stealth_fail` a quitté ce groupe au lot 4I et `manual` au lot 4K |

## Groupes à migrer

### A. Entrée Core 2.x (`dc200StartCombat` / `startCombat`)

Le dernier alias `window.dc200StartCombat = startCombat` a été caractérisé au lot 4G. Il est volontairement conservé : lors de l’installation, le Bridge capture ce starter historique avant de remplacer le global ; hors Dungeon son adaptateur le rappelle, tandis qu’en Dungeon le même adaptateur passe par `requestCombat` et le scope canonique.

Cet alias n’est donc plus une dette d’appel Dungeon à supprimer isolément. Toute évolution future de `startCombat` devra préserver explicitement le fallback des autres modes et faire l’objet d’un lot séparé.

Les boutons de rencontre Core 2.01 ont quitté ce groupe au lot 4A. Le wrapper Core 3.01 désactivé a été retiré au lot 4B. Le wrapper de démarrage Core 3.03 a été retiré au lot 4C. La détection Core 2.11 passe par le Bridge depuis le lot 4D, la détection Core 2.09 depuis le lot 4E, l’embuscade Core 2.09 depuis le lot 4F, l’échec de furtivité Runtime 2.00 depuis le lot 4I et l’action manuelle Runtime 2.00 depuis le lot 4K.

Les seuls callsites lexicaux Runtime 2.00 encore à caractériser/migrer sont désormais `cell` et `ambush`. Ils restent séparés car ils n’ont pas le même comportement : `cell` possède une logique de renforts de proximité et `ambush` est classé comme raison de détection par V113.

### B. Ancien setup Dungeon (`openDungeonCombatSetup`)

Une seule définition historique reste pour rollback capturé par le Bridge. Aucun consommateur Dungeon actif ne doit la réinstaller ou l’appeler.

### C. Lancement interne (`launchCombat200`)

Les deux occurrences du monolithe correspondent à la définition historique du lanceur et à son rappel depuis le flux Core 2.x après préparation/sélection.

Le lot 4H a établi que ce lanceur historique n’est pas une seconde autorité Dungeon active à supprimer brutalement : `Bridge.install()` le capture comme `legacyLaunch`, puis remplace le nom global par son adaptateur. Hors Dungeon, cet adaptateur rappelle exactement le lanceur historique ; en Dungeon, il ne rappelle jamais le legacy et délègue à `requestCombat` avec `entry:"launchCombat200"`.

Le compteur reste donc volontairement à 2 tant qu’un futur lot d’extraction ne retire pas réellement l’implémentation historique tout en préservant les autres modes.

## Migration validée — lot UI manuel 1

Les deux boutons natifs `#dungeonCombatMenuBtn` et `#dungeonCombatSheetBtn` sont migrés directement vers `GensRpgTacticalCombatV2Bridge.requestCombat(window, options)` avec `reason: "manual-setup"`.

## Migration validée — lot 2, Core 0.99 désactivé

Le script `#dungeonCore099FinalTacticalAuthority`, déjà désactivé par `type="application/x-gensrpg-disabled"`, est retiré du monolithe. Son fallback historique vers `openDungeonCombatSetup` n’appartient plus au runtime.

Le CSS `#dungeonCore099FinalTacticalCss` et le nettoyage UI Core 1.00 sont restés hors périmètre.

## Migration validée — lot 3, ancien setup Dungeon

Le fallback Core 0.53 et les consommateurs actifs ont été reconnectés au Bridge sans modifier les gardes métier. Une unique définition historique de `openDungeonCombatSetup` reste uniquement comme rollback capturé par le Bridge.

## Migration validée — lot 4A, boutons de rencontre Core 2.01

Les commandes `ENGAGER LE COMBAT` et `ATTAQUER` passent par un helper local sans état, qui transmet uniquement `enemyIds` et `reason` au Bridge. Le mode positionnel et la cible sur case restent inchangés.

## Migration validée — lot 4B, timeline Core 3.01 désactivée

Le script `#dungeonCore301Timeline`, déjà désactivé, est supprimé au lieu d’être modernisé. Son CSS historique reste hors périmètre.

## Migration validée — lot 4C, wrapper de démarrage Core 3.03

Core 3.03 conserve timeline, changement de tour, IA et UI de tour. Seul son wrapper inutile autour de `window.dc200StartCombat` est retiré, le Bridge réinstallant ensuite l’adaptateur final.

## Migration validée — lot 4D, détection Core 2.11

Core 2.11 conserve garde d’activation, filtre `sameView`, déduplication/persistance, sélection exacte des `enemyIds`, délai 80 ms et libération à 250 ms. Seule l’entrée finale passe de `dc200StartCombat(ids,"detection")` à `Bridge.requestCombat(... reason:"detection" ...)`.

## Migration validée — lot 4E, détection Core 2.09

Core 2.09 conserve garde `triggering`, héros actif, position courante, sélection des détecteurs, déduplication/persistance `dc209Detected`, délai 80 ms et libération à 250 ms. Seule l’entrée finale de détection passe au Bridge avec `entry:"dc209EnemyDetection"`.

Pendant 4E, l’embuscade était volontairement hors périmètre ; son entrée est traitée séparément au lot 4F.

## Migration validée — lot 4F, embuscade Core 2.09

Core 2.09 conserve intégralement les responsabilités propres à l’embuscade :

- garde `ambushStarting`, événement `kind==="ambush"` et salle valide ;
- source exacte `living(x)` ;
- déduplication/persistance `dc209AmbushDone` ;
- verrou `ambushStarting` ;
- délai de déclenchement 120 ms ;
- libération du verrou à 250 ms.

Seule l’entrée finale du combat change :

`dc200StartCombat(live.map(e=>String(e.id)),"ambush")`

devient :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:"ambush",entry:"dc209Ambush"})`

Les participants et le scope restent calculés par l’autorité V113 via le Bridge. Aucune règle V113 n’est recopiée dans Core 2.09.

Le lot retire exactement deux occurrences textuelles de `dc200StartCombat`, faisant passer l’inventaire de 3 à 1.

## Caractérisation validée — lot 4G, alias historique `dc200StartCombat`

Le lot 4G n’effectue aucune modification du runtime. Il caractérise la dernière occurrence brute, `window.dc200StartCombat = startCombat`, et verrouille son rôle de compatibilité.

Le test permanent `tests/gens_legacy_dc200_fallback_contract_lot4g.test.cjs`, exécuté par la sentinelle d’inventaire, vérifie que :

- une seule occurrence de cet alias subsiste ;
- `Bridge.install()` capture l’ancien `dc200StartCombat` avant de poser son propre adaptateur ;
- hors Dungeon, l’adaptateur Bridge rappelle exactement le starter historique capturé, en préservant arguments, retour et liaison `this` ;
- en Dungeon, le starter historique n’est pas appelé et l’entrée passe par `requestCombat` vers Tactical/V113 ;
- l’alias restant n’est donc pas une seconde autorité de combat Dungeon.

Conclusion du lot : conserver l’alias est actuellement plus conforme à la charte que le supprimer. Son compteur reste volontairement à 1.

## Caractérisation validée — lot 4H, fallback historique `launchCombat200`

Le lot 4H n’effectue aucune modification du runtime. Il verrouille le rôle des deux occurrences historiques de `launchCombat200` avant toute extraction future.

Le test permanent `tests/gens_legacy_launch200_fallback_contract_lot4h.test.cjs`, exécuté depuis la sentinelle d’inventaire, vérifie que :

- `Bridge.install()` capture l’ancien `launchCombat200` comme `legacyLaunch` avant de remplacer le global ;
- hors Dungeon, l’adaptateur rappelle exactement ce lanceur historique en préservant les deux arguments, leurs identités, le retour et la liaison `this` ;
- hors Dungeon, ce fallback n’ouvre pas Tactical V2 ;
- en Dungeon, le lanceur historique n’est pas rappelé ;
- en Dungeon, les `enemyIds` issus de `chosen` sont transmis à `requestCombat` avec `reason:"legacy-launch"` et `entry:"launchCombat200"` ;
- le nom historique restant est donc un adaptateur de compatibilité, pas une deuxième autorité Dungeon.

Conclusion du lot : ne pas supprimer les deux occurrences uniquement pour réduire l’inventaire. Leur retrait devra être un futur lot d’extraction explicite qui préserve les modes non-Dungeon.

## Migration validée — lot 4I, échec de furtivité Runtime 2.00

Le lot 4I retire uniquement le callsite lexical `startCombat(ids,'stealth_fail')` du résolveur `window.dc047ResolveStealth`.

Le comportement qui précédait réellement le lancement est conservé dans le propriétaire Runtime 2.00 :

- même source d’ennemis vivants `liveEnemies()` ;
- mêmes `enemyIds` convertis en chaînes ;
- fermeture de la modale de test de furtivité avant le résultat ;
- même popup `🥷 REPÉRAGE ÉCHOUÉ` ;
- même liste des ennemis et même héros actif dans le message ;
- aucun combat si aucun ennemi vivant n’est présent, avec retour au `render()` ;
- lancement seulement après validation de la popup.

L’entrée finale passe désormais directement par :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:ids,reason:'stealth_fail',entry:'dc200StealthFailure'})`

Le scope et les participants restent donc calculés par l’autorité canonique V113 via le Bridge. Les trois autres actions de contexte `manual`, `cell` et `ambush` restaient volontairement hors périmètre de 4I.

Le lot faisait passer l’inventaire brut de `startCombat` de 6 à 5.

## Migration validée — lot 4K, action manuelle Runtime 2.00

Le lot 4K caractérise d’abord l’unique bouton non positionnel `⚔️ ENGAGER LE COMBAT` de Runtime 2.00, puis retire uniquement son callsite lexical :

`startCombat(live.map(e=>String(e.id)),'manual')`

devient :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'manual',entry:'dc200ManualAction'})`

La caractérisation préalable a établi que `reason:'manual'` n’avait aucune branche métier propre dans `startCombat()`. Le lot conserve exactement :

- la garde mode non positionnel `!positional` ;
- la présence d’ennemis `live.length` ;
- la garde `combatEnabled200()` ;
- le libellé et le comportement du bouton ;
- la source `liveEnemies()` et donc les exclusions `dc200Bypassed` / `dc200BypassedBy[heroActif]` ;
- les mêmes `enemyIds` convertis en chaînes ;
- `reason:'manual'`.

Le scope et les participants restent calculés par V113 via le Bridge. `ambush` n’est pas inclus dans ce lot car V113 le classe comme raison de détection. `cell` n’est pas inclus car l’ancien `startCombat()` lui ajoute des renforts de proximité et une popup dédiée.

Le lot fait passer l’inventaire brut de `startCombat` de 5 à 4 : définition historique + alias `dc200StartCombat` + actions `cell` / `ambush`.

## Contrat cible déjà disponible

Le Bridge Tactical dispose maintenant d’une seule entrée interne Dungeon :

`GensRpgTacticalCombatV2Bridge.requestCombat(runtime, options)`

Les noms historiques restants sont des adaptateurs de compatibilité ou des fonctions internes caractérisés progressivement. Ils ne doivent plus devenir des propriétaires indépendants de la logique de démarrage Dungeon.

## Règle de migration

1. migrer un petit groupe d’appels à la fois ;
2. conserver les mêmes `enemyIds`, `reason` et comportements de retour ;
3. faire passer les sentinelles V112/V113/Bridge + navigateur ;
4. ne diminuer un compteur que lorsque le runtime correspondant a réellement été retiré ;
5. conserver et documenter un adaptateur si sa suppression casserait un autre mode ;
6. créer un checkpoint vert avant le groupe suivant.

Aucune suppression en masse du gros `index.html` n’est autorisée sans cette progression testée.
