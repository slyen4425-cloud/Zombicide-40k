# GenSrpG — Phase 8 — Tactical composition handoff — caractérisation — 2026-10-01

## Base

- checkpoint : `checkpoint/gensrpg-phase8-tactical-consolidation-preaudit-green-2026-10-01`
- SHA : `9fd5a789180e26204833e9d6b330079352272ec6`
- branche : `work/gensrpg-phase8-tactical-composition-handoff-2026-10-01`

## État caractérisé

Propriétaire actuel :
`assets/gensrpg/core/runtime-bootstrap-v1.js`.

Entrée cible :
`assets/gensrpg/tactical/entry-v1.js`, encore inert.

## Ordre exact à préserver

1. `gens-rpg-tactical-combat-v2.js`
2. `gens-rpg-tactical-combat-v2-adapter.js`
3. `gens-rpg-tactical-combat-v2-rules.js`
4. `gens-rpg-tactical-combat-v2-integration.js`
5. `gens-rpg-tactical-combat-v2-ui.js`
6. `gens-rpg-tactical-combat-v2-bridge.js`

## Sémantiques à préserver dans le premier lot

- chargement séquentiel `async=false` ;
- suffixe actuel `?v=16.78.105` ;
- continuation de la chaîne même si un fichier échoue au chargement ;
- guard d'idempotence `__gensTacticalV2Loader105` ;
- installation du bridge à la fin ;
- retries bridge : immédiat, 250 ms, 1200 ms, 3000 ms.

## Hors périmètre

Aucun changement :
- règles de combat ;
- stats/hit/dégâts/armure ;
- UI ;
- AI ;
- bridge Dungeon ;
- chaîne V108-V114.11 ;
- `index.html`.

## Future condition GREEN

Après migration :
- l'entrée Tactical publique possède cette composition ;
- Core RuntimeBootstrap ne contient plus de liste ni de logique spécifique Tactical ;
- une seule autorité de composition reste active ;
- les invariants ci-dessus sont inchangés.
