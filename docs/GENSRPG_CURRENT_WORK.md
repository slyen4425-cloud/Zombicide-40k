# GenSrpG — Point de reprise courant

Ce fichier est le point d'entrée prioritaire lorsqu'un fil de discussion est plein ou qu'un chantier doit être repris dans un nouveau fil.

## Chantier courant — restauration du Dock Tactical sur la chaîne directrice

- Fil directeur : **COORDINATEUR actif**.
- Branche : `work/gensrpg-tactical-dock-post-pwa-regression-clean-2026-09-17`.
- Base exacte : checkpoint vert preview/PWA post-Talent `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Checkpoint de base : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17`.
- Production sûre `main` : V16.78.114.11 — `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- `main` reste gelé pendant la restructuration.

## Combat 4K fermé vert

Checkpoint : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17`.

SHA : `c672726b69aa5895d252e2f31084c20740bcc699`.

Inventaire après 4K :

- `dc200StartCombat` : 1 ;
- `openDungeonCombatSetup` : 1 ;
- `launchCombat200` : 2 ;
- `startCombat` : 4 — définition historique, alias, `cell`, `ambush`.

Ne pas chercher à réduire ces compteurs artificiellement. Le prochain lot combat reste **4L — `ambush` uniquement** ; `cell` reste séparé.

## Talent post-4K — intégré et vert

Le correctif Talent a été reporté proprement depuis la branche Agent 1 sur la base 4K, après caractérisation rouge sur cette base.

Cause : `renderDungeonSkillTree()` écrivait la visibilité de `#dungeonSkillTreePanel`, alors que `applyDungeonSheetTabs()` en est le propriétaire canonique.

Correction : retrait uniquement de cette écriture de visibilité ; aucun Observer, timer, retry, wrapper de réparation ou second renderer ajouté.

Checkpoint vert :

`checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17`

SHA exact :

`c52fd9abf8f19c345d1cd7088e86ae3179b42401`

Le SHA final Talent a été validé par : régression Talent dédiée, architecture + Chromium/preview et Firefox.

## Preview/PWA post-Talent — fermé vert

Test permanent :

`tests/gens_preview_chrome_firefox_pwa_characterization_v11411.test.cjs`

Workflow lecture seule :

`.github/workflows/gensrpg-preview-pwa-post-talent.yml`

Caractérisation avant correction :

`59b027209ca23b3b741fc5ae89910ba21051550f`

Run rouge attendu : `35250790568`.

Résultat reproduit : avec un Service Worker/cache `gensrpg-cache-*` préexistant, la preview pouvait charger l'ancien `index.html` avant la fin de la suppression asynchrone du cache.

Correction limitée à `preview.html` : attendre la suppression des caches GenSrpG avant `fetch('index.html', {cache:'no-store'})`.

Commit runtime preview :

`48f1f50261a88b71bce30fa520bffeeedaa9ff36`

Checkpoint vert final :

`checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17`

SHA exact :

`4c1c1e60b4e06a82986babc435ac07d48dff4833`

Limite maintenue : ce lot prouve et corrige une course de **preview/PWA** ; il ne prouve pas à lui seul que le symptôme Chrome Android réel en production avait exactement cette cause.

## Régression détectée au test utilisateur — Dock Tactical absent

Après test du checkpoint preview/PWA, l'utilisateur a signalé que les commandes flottantes `Attaquer / Fin du tour / Capacité` avaient disparu.

Diagnostic directeur :

- Talent n'a pas supprimé le Dock ;
- le lot preview/PWA n'a pas supprimé le Dock ;
- la chaîne directrice Combat 4K → Talent → preview/PWA avait été construite sans reporter le jalon Dock Tactical vert déjà validé sur sa ligne parallèle ;
- il s'agit donc d'une **omission de composition de branches vertes**, pas d'une nouvelle régression introduite dans le code du Dock.

Le jalon historique restait :

- checkpoint : `checkpoint/gensrpg-tactical-dock-render-reconnect-green-2026-09-17` ;
- SHA : `642a0e3276f07f2d3089047d1dd5c1b72f8353b9` ;
- validation utilisateur : « parfait ras tout fonctionne très bien ».

4L a été suspendu immédiatement dès ce signalement.

## Restauration Dock Tactical post-PWA — caractérisation puis correction

Branche propre :

`work/gensrpg-tactical-dock-post-pwa-regression-clean-2026-09-17`

Base exacte : `4c1c1e60b4e06a82986babc435ac07d48dff4833`.

Tests permanents reportés **avant** correction :

- `tests/gens_tactical_dock_canonical_render_hook_v11411.test.cjs` ;
- `tests/gens_tactical_dock_browser_v11411.test.cjs` ;
- `tests/fixtures/tactical-dock-render-v11411.html` ;
- workflow `.github/workflows/gensrpg-tactical-dock-sentinel.yml`.

SHA de caractérisation :

`c3e792da5f2b7b8e6ec346ce16c87e17b406725e`

Run rouge attendu : `35257199026` — le contrat canonique du Dock échoue avant correction, les jobs navigateur étant alors bloqués derrière ce contrat.

Correction propriétaire appliquée :

1. `assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js` reste le renderer canonique Tactical et expose un contrat explicite `onAfterRender()` ;
2. ce renderer appelle `notifyAfterRender()` après son rendu local ;
3. `assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js` abonne `maintain()` à `onAfterRender()` ;
4. V111 ne wrappe plus `U.render` pour maintenir le Dock ;
5. aucun `MutationObserver` global n'est réactivé ;
6. aucun changement de règles combat, participants, dégâts, déplacement ou Bridge.

Commit propriétaire :

`efd966a4e8eee210db90f674a6dd05fd1d430fe4`

Le writer temporaire borné utilisé uniquement pour appliquer les deux remplacements exacts a été supprimé ; il n'existe pas dans le diff net final.

Candidat technique propre :

`ce1fb0491ffe9c82f3a59f7791a3b74abc8dae20`

Diff net depuis `4c1c1e60...` : deux fichiers propriétaires Dock + deux tests + une fixture + un workflow de sentinelle ; aucun `index.html`, Bridge ou fichier 4L.

Validation technique sur `ce1fb049...` :

- Dock contrat + Chromium + Firefox — **success**, run `35257375684` ;
- architecture + Chromium/preview — **success**, run `35257375692` ;
- Firefox général — **success**, run `35257375764`.

Les présents documents créent maintenant le SHA final documentaire. Ce SHA doit être revalidé intégralement avant checkpoint.

Checkpoint cible :

`checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17`

## Suite après checkpoint Dock post-PWA

1. revalider le SHA documentaire exact : Dock, architecture/Chromium-preview et Firefox ;
2. vérifier `main` = `e8681f9823573ced8aec59c8ddc47a72b02bc663` ;
3. créer `checkpoint/gensrpg-tactical-dock-post-pwa-green-2026-09-17` sur le SHA final exact ;
4. fournir ce checkpoint au test utilisateur ;
5. reprendre ensuite Combat **4L — `ambush` uniquement** depuis ce nouveau checkpoint ;
6. caractériser `ambush` avant toute modification ;
7. conserver `cell` hors de 4L.

## Jalons directeurs verts précédents

- Preview/PWA post-Talent : `checkpoint/gensrpg-preview-pwa-post-talent-green-2026-09-17` — `4c1c1e60b4e06a82986babc435ac07d48dff4833`.
- Talent post-4K : `checkpoint/gensrpg-talent-integration-post-4k-green-2026-09-17` — `c52fd9abf8f19c345d1cd7088e86ae3179b42401`.
- Combat 4K : `checkpoint/gensrpg-combat-callsite-migration-4k-green-2026-09-17` — `c672726b69aa5895d252e2f31084c20740bcc699`.
- Combat 4J : `checkpoint/gensrpg-combat-callsite-migration-4j-green-2026-09-17` — `b8f5b14f0651479165d35545f3a22db6df8d391f`.
- Combat 4I : `checkpoint/gensrpg-combat-callsite-migration-4i-green-2026-09-17` — `b01f1c5fc2ccdbb406abb3fee4cdaab064a27687`.
- Combat 4H : `checkpoint/gensrpg-combat-callsite-migration-4h-green-2026-09-17` — `2e51e7063b0fca2610b8fd9c1078008cd32a9a34`.

## Règle permanente de continuité

À chaque chantier : lire la charte puis ce fichier, partir d'un checkpoint vert exact, branche dédiée, caractériser avant correction, petit lot homogène, aucun mécanisme de réparation, tests permanents, checkpoint vert sur le SHA exact validé, puis mettre les documents de reprise à jour avant le chantier suivant.
