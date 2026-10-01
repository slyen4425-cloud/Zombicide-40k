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
