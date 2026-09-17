# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — Combat 4L `ambush` Runtime 2.00

- Fil directeur : **COORDINATEUR actif**.
- Branche : `work/gensrpg-combat-callsite-migration-4l-ambush-entry-post-dock-2026-09-17`.
- Base exacte : checkpoint Dock post-PWA vert `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Checkpoint de base : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17`.
- Production sûre `main` : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.
- Périmètre 4L : **`ambush` uniquement**. `cell` reste hors périmètre.

## Chaîne directrice verte avant 4L

### Combat 4K
- checkpoint : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` ;
- SHA : `c672726b69aa5895d252e2f31084c20740bcc699`.

Inventaire après 4K :
- `dc200StartCombat` : 1 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 4 — définition historique + alias + `cell` + `ambush`.

### Talent post-4K
- checkpoint : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` ;
- SHA : `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.

Cause : `renderDungeonSkillTree()` écrivait la visibilité de `#dungeonSkillTreePanel`, alors que `applyDungeonSheetTabs()` en est le propriétaire canonique.

Correction : retrait de cette autorité de visibilité du renderer Talent, sans Observer, timer, retry, wrapper de réparation ou second renderer.

### Preview/PWA post-Talent
- checkpoint : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` ;
- SHA : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.

Caractérisation rouge : `59b027209ca23b3b741fc5ae89910ba21051550f`, run `35250790568`.

Correction limitée à `preview.html` : attendre la suppression des caches `gensrpg-cache-*` avant `fetch('index.html',{cache:'no-store'})`.

Limite : ce lot prouve une course de preview/PWA, pas à lui seul la cause exacte d'un éventuel symptôme Chrome Android réel en production.

### Dock Tactical post-PWA

Le test utilisateur a révélé que la chaîne directrice n'avait pas intégré le jalon Dock parallèle pourtant déjà vert. Il s'agissait d'une **omission de composition de branches vertes**, pas d'une suppression par Talent ou PWA.

Restauration propre :
- branche : `work/gensrpg-tactical-dock-post-pwa-regression-clean-2026-09-17` ;
- caractérisation rouge : `c3e792da5f2b7b8e6ec346ce16c87e17b406725e`, run `35257199026` ;
- correction propriétaire : UI Tactical canonique expose `onAfterRender()` et V111 s'y abonne avec `U.onAfterRender(()=>maintain(rt))` ;
- aucun `MutationObserver` global, nouveau timer/retry ou changement gameplay ;
- commit propriétaire : `efd966a4e8eee210db90f674a6dd05fd1d430fe4` ;
- candidat technique : `ce1fb0491ffe9c82f3a59f7791a3b74abc8dae20` ;
- SHA final : `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72` ;
- checkpoint : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17`.

Validation finale du SHA `1cff0ec...` :
- Dock contrat + Chromium + Firefox — **success**, run `35257681260` ;
- architecture + Chromium/preview — **success**, run `35257681298` ;
- Firefox général — **success**, run `35257681447`.

## Combat 4L — caractérisation avant correction

Runtime 2.00 possédait :

`startCombat(live.map(e=>String(e.id)),'ambush')`

sous la garde `x.last?.kind==='ambush' && live.length`, avec le bouton `⚔️ EMBUSCADE — COMBATTRE`.

La caractérisation a établi que :
- Runtime 2.00 construit historiquement son seed avec **tous** les ennemis de `liveEnemies()` ;
- l'ancien `startCombat(...,'ambush')` n'a aucune branche métier propre `ambush` et ne recroise pas ce seed avec la visibilité ;
- le Bridge classe normalement `ambush` comme motif de détection V113 ;
- `prepareV113Detection()` croise alors les `enemyIds` avec `V113.detectionPairs()` ;
- `detectionPairs()` dépend de la portée de vision et de la ligne de vue ;
- un remplacement mécanique aurait donc pu retirer des ennemis demandés par l'embuscade Runtime 2.00.

Test permanent : `tests/gens_core200_ambush_entry_characterization_lot4l.test.cjs`.

SHA de caractérisation : `231d7313a85832050fd7f4b63c1ca9fc69b2b33c`.

Validation de caractérisation : architecture/Chromium-preview, Firefox et Dock verts.

## Combat 4L — contrat cible rouge avant correction

Test permanent : `tests/gens_core200_ambush_bridge_contract_lot4l.test.cjs`.

SHA cible rouge : `bc6ec271602396c6a021c5398a18ed3c0b8b23e9`.

Run architecture : `35258543144`.

Rouge attendu confirmé exactement à l'étape `Figer l'inventaire des anciens points d'entrée combat`, les contrôles précédents restant verts.

Le contrat cible exige :
- les embuscades ordinaires restent soumises à la préparation détection V113 ;
- Runtime 2.00 peut déclarer explicitement que son seed d'ennemis est déjà sélectionné ;
- cette exception ne doit pas contourner `V113.selectCombatants()`.

## Combat 4L — correction appliquée

Le Bridge accepte désormais l'option étroite :

`preserveEnemyIds:true`

Cette option saute **uniquement** l'intersection préalable avec `detectionPairs()` pour l'appel qui possède déjà son seed d'ennemis. Le passage par `V113.selectCombatants()` reste actif.

Le callsite Runtime 2.00 devient :

`GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true})`

Les autres embuscades ne passent pas ce flag et conservent leur comportement V113 de détection.

Le lot conserve :
- la garde d'événement ambush ;
- le bouton et son libellé ;
- la source `liveEnemies()` ;
- les exclusions `dc200Bypassed` / `dc200BypassedBy[heroActif]` ;
- les mêmes `enemyIds` ;
- `reason:'ambush'`.

Commit runtime 4L : `17966476d88c122e5711192b48f857bab29deceb`.

Le writer temporaire borné utilisé pour appliquer exactement les deux remplacements a été supprimé et est absent du diff net.

## Inventaire après 4L

Candidat technique : `600a6d1d48c684f3f2aad3ae341a8c8cfa61a3ff`.

Inventaire attendu :
- `dc200StartCombat` : 1 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 3 — définition historique + alias `dc200StartCombat` + `cell`.

Le compteur `startCombat` baisse de 4 à 3 uniquement parce que le callsite `ambush` a réellement quitté ce chemin.

Diff net depuis le checkpoint Dock `1cff0ec...` avant les présents documents :
- `assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js` : +1/-1 ;
- `index.html` : +1/-1 ;
- inventaire combat ;
- deux tests 4L nouveaux ;
- adaptations des sentinelles 4I/inventaire.

Aucun writer temporaire ne subsiste.

Validation technique sur `600a6d1d...` :
- architecture + Chromium/preview — **success**, run `35258869825` ;
- Firefox général — **success**, run `35258869882` ;
- Dock contrat + Chromium + Firefox — **success**, run `35258869773`.

## Fermeture 4L

Les présents documents créent un nouveau SHA final documentaire. Il doit être revalidé intégralement avant checkpoint.

Checkpoint cible :

`checkpoint/gensrpg-combat-callsite-migration-4l-green-2026-09-17`

Avant création :
1. revalider le SHA documentaire exact par architecture + Chromium/preview, Firefox général et Dock ;
2. vérifier le diff net depuis `1cff0ec...` ;
3. vérifier `main` = `e8681f9823573ced8aec59c8ddc47a72b02bc663` ;
4. créer le checkpoint sur le SHA final exact.

## Suite après checkpoint 4L

Le prochain lot combat est **4M — `cell` uniquement**.

Ne pas le démarrer depuis le candidat technique 4L : partir exclusivement du checkpoint 4L final vert.

`cell` doit être caractérisé avant toute modification car l'ancien `startCombat()` lui ajoute :
- les renforts de proximité ;
- la portée de renfort configurée ;
- la popup `⚔️ COMBAT ENGAGÉ` ;
- la sélection finale transmise au lanceur.

Aucun remplacement mécanique n'est autorisé.

## Jalons directeurs verts précédents

- Dock post-PWA : `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17` — `1cff0ec5628f79f8cc1bb556fd6bd2f14b691d72`.
- Preview/PWA post-Talent : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` — `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Talent post-4K : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` — `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Combat 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` — `c672726b69aa5895d252e2f31084c20740bcc699`.
- Combat 4J : `checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17` — `b8f5b14f0651479165d35545f3a22db6df8d391f`.
- Combat 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`.
- Combat 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, petit lot homogène, aucun mécanisme de réparation, tests permanents, checkpoint vert sur le SHA exact validé, puis mettre les documents de reprise à jour avant le chantier suivant.
