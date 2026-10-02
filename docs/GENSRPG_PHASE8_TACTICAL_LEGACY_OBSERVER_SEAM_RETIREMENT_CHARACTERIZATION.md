# GenSrpG — Phase 8 — Caractérisation retrait seams observers legacy Tactical — 2026-10-01

## Base

- checkpoint : `checkpoint/gensrpg-phase8-tactical-bridge-retry-retirement-green-2026-10-01`
- SHA : `483c86cea6571b128552d5b653c486c10c1a4921`
- branche : `work/gensrpg-phase8-tactical-legacy-observer-seam-retirement-2026-10-01`

## État caractérisé

Les cinq couches suivantes contiennent encore un seam historique `observe(rt=R)` qui construit un `MutationObserver` :

- V108 — `gens-rpg-tactical-combat-v2-polish-1678108.js`
- V109 — `gens-rpg-tactical-combat-v2-polish-1678109.js`
- V111 — `gens-rpg-tactical-runtime-fixes-1678111.js`
- V112 — `gens-rpg-tactical-combat-coherence-1678112.js`
- V113 — `gens-rpg-tactical-runtime-authority-1678113.js`

Sur le runtime actuel, ces cinq seams sont inactifs :

- aucun `install(rt=R)` ne les appelle ;
- aucune API publique ne les expose ;
- les responsabilités actives des `install` passent par leurs hooks explicites, binds et appels de maintenance ;
- V110 et V114.11 ne sont pas concernés par ce retrait.

## Responsabilités actives protégées

Le retrait ne doit pas modifier :

- V108 : style, contrôles, hook UI render, actions ;
- V109 : ranges adapter, hook UI, bind et enhance ;
- V111 : adapter, multi-dés, clics, hook UI render, maintenance ;
- V112 : adapter, détails résultat, bind détails, maintenance ;
- V113 : détection active, board clicks, animation dés ;
- tous les `installWithRetries` existants.

## Cible RED suivante

Exiger simultanément :

1. aucun `function observe(rt=R)` dans V108/V109/V111/V112/V113 ;
2. aucune construction `MutationObserver` résiduelle dans ces cinq fichiers ;
3. aucune variable `observer` morte liée à ces seams ;
4. responsabilités actives `install(rt)` inchangées ;
5. retries inchangés.

Aucun changement `index.html`, gameplay, hit, dégâts, armure, IA, Dungeon, Survival, Capture ou PvP n'est attendu.


## RED confirmé

- HEAD RED : `8a774ea9c21b13c5f1f8d42b2418bf33ba207f59`
- Architecture : `36922171754` — FAILURE attendue
- étape isolée : `#253 Exiger le retrait des seams observers legacy Tactical Phase 8`
- erreur caractéristique : `V108 inactive observe seam must be physically retired`
- Firefox : `36922171730` — SUCCESS
- Tactical Dock : `36922171620` — SUCCESS

Le RED ne modifiait aucun runtime.

## Micro-diff appliqué

Le retrait final est strictement soustractif :

- suppression des cinq fonctions `observe(rt=R)` dans V108/V109/V111/V112/V113 ;
- suppression des constructions `MutationObserver` correspondantes ;
- suppression des états `observer=null` devenus morts ;
- conservation des responsabilités actives de chaque `install(rt)` ;
- conservation de tous les `installWithRetries` existants ;
- conservation de la détection active V113 et des hooks explicites ;
- aucun changement `index.html`, hit, dégâts, armure, IA, Dungeon, Survival, Capture ou PvP.

Le manifeste timers Phase 2 est réaligné de `externalSetTimeoutSyntax: 142` vers `141`, uniquement parce que le seam V109 retiré contenait un fallback `setTimeout(run,0)`.

## Guards réalignés

Seules les sentinelles qui exigeaient encore la présence physique des observers historiques ont été réalignées. Les assertions métier, les responsabilités actives, les retries, l'autorité de détection et les frontières murs/visuels restent protégés.

HEAD runtime + guards :
`f357b3f09ea5651e842377cd1a08cdf4126a0f82`

## Validation technique

Premier cycle :
- Architecture + Browser `36923077568` — SUCCESS
- Tactical Dock `36923077393` — SUCCESS
- Firefox Wall `36923077369` — runner bloqué sur l'installation Playwright avant le test projet

Le blocage Firefox était infrastructurel. Un commit documentaire uniquement a déclenché un nouveau cycle sans modifier le runtime.

Cycle de validation complet sur `5436f3c9588eff07e8c140cee6be948734a97c95` :
- Architecture + Browser `36946775572` — SUCCESS
- Firefox Wall `36946775568` — SUCCESS
- Tactical Dock `36946775576` — SUCCESS

Le diff entre `f357b3f0...` et `5436f3c9...` ne contient que `docs/GENSRPG_CURRENT_WORK.md`.

## Décision

**MICRO-LOT 4 TECHNIQUEMENT GREEN.**

Les seams observers historiques inactifs V108/V109/V111/V112/V113 sont retirés physiquement, sans changement des responsabilités actives ni du gameplay.

Checkpoint final prévu après triple CI documentaire :
`checkpoint/gensrpg-phase8-tactical-legacy-observer-seam-retirement-green-2026-10-02`
