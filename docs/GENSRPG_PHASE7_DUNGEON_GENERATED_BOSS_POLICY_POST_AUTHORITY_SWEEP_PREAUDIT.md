# GenSrpG — Phase 7 / Dungeon generated — politique Boss post authority sweep — pré-audit — 2026-09-30

## Base sûre

Micro-lot précédent fermé GREEN :
`checkpoint/gensrpg-phase7-dungeon-source-render-active-hero-divergence-green-2026-09-30`

SHA exact de base :
`874ec11d8db5a06e5eca8b05efe4ee7b609367b3`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase7-dungeon-generated-boss-policy-post-authority-sweep-2026-09-30`

Branche :
`work/gensrpg-phase7-dungeon-generated-boss-policy-post-authority-sweep-2026-09-30`

Production `main` reste gelée :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

CI documentaire GREEN de la base :
- Architecture + Browser `36703015765` — SUCCESS ;
- Firefox `36703015802` — SUCCESS ;
- Tactical Dock `36703015766` — SUCCESS ;
- Browser 45/45 sans échec.

Runtime `index.html` vérifié par métadonnées Git, sans lecture du contenu exact :
- taille : `8169990` octets ;
- blob Git : `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Ce blob est identique à celui caractérisé historiquement sur l'ancien lot Boss du 28/09. L'ancienne branche n'est pas réutilisée ni fusionnée ; elle sert uniquement de diagnostic historique parce que l'empreinte runtime est strictement identique.

## Position Phase 7 actuelle

Les slices generated déjà propriétaires dans `GensDungeonV1.exploration` restent :
- `planGeneratedAdvance` ;
- `pickWeightedGeneratedRoomKind` ;
- `buildGeneratedRoomTransition` ;
- `pickWeightedGeneratedBranchType` ;
- `shouldCreateGeneratedBranch` ;
- `buildGeneratedBranchSceneElement`.

Les migrations authored / activeHero récentes sont déjà fermées ou caractérisées en divergence et restent hors périmètre de ce lot.

La politique Boss generated reste dans l'ancien propriétaire Core 2.00 inline de `index.html`.

## Comportement historique à reverrouiller

Sur le blob exact courant, la caractérisation doit confirmer :

1. Boss final si `boss !== 'none'` et `room === Number(rooms)` ;
2. mode `everyN` avec `Math.max(1, Number(bossEvery)||5)` ;
3. mode `specific` avec parsing historique des salles explicites ;
4. mode `random` uniquement si `room > 2` ;
5. chance random `Math.max(0, Number(bossChance)||13)` ;
6. si aucune règle Boss ne gagne, fallback vers `pickWeightedGeneratedRoomKind(roomWeights, Math.random())`.

Consommation RNG à préserver exactement :
- Boss déterministe réussi : 0 tirage ;
- miss déterministe : 1 tirage de pondération ;
- random room <= 2 : 1 tirage de pondération seulement ;
- random Boss réussi : 1 tirage total ;
- random Boss refusé : 2 tirages, Boss puis pondération ;
- final-room prioritaire même en mode random : 0 tirage.

## Cible stricte du micro-lot 30

Extraire uniquement une planification pure de la politique Boss :

`GensDungeonV1.exploration.planGeneratedBossPolicy(room, roomLimit, bossMode, bossEvery, bossRooms, bossChance)`.

Sortie cible :
- `{status:'boss', chance:null}` : règle déterministe Boss ;
- `{status:'random', chance:<chance normalisée>}` : le callsite Core 2.00 effectue le tirage ;
- `{status:'none', chance:null}` : passer à la pondération non-Boss.

L'API pure ne doit consommer aucun RNG.

Core 2.00 doit rester propriétaire de :
- `cfg()` ;
- `Math.random()` Boss ;
- `Math.random()` pondération ;
- appel au weighted room kind ;
- matérialisation réelle de la salle.

## Hors périmètre absolu

Ne pas toucher :
- matérialisation de salle ;
- branches generated ;
- authored World Builder ;
- événements / spawn ;
- ennemis ;
- coffres / pièges / énigmes ;
- mouvement ;
- Spatial ;
- combat / Tactical ;
- Survival / Capture / PvP ;
- assets ;
- toute autre partie de `index.html`.

## TDD obligatoire

1. caractérisation GREEN sur le blob actuel exact ;
2. triple CI GREEN ;
3. poser UNE garde RED exigeant uniquement le planner pur + le raccord Core 2.00 ;
4. vérifier RED isolé, Firefox et Tactical GREEN ;
5. appliquer Rule 26 avant toute lecture/modification du contenu exact de `index.html` ;
6. après fourniture du fichier exact, micro-diff minimal :
   - ajouter le planner pur dans `entry-v1.js` ;
   - remplacer uniquement la politique inline Boss dans `chooseKind(room)` ;
   - conserver les deux callsites RNG au Core 2.00 ;
7. triple CI technique ;
8. fermeture documentaire ;
9. triple CI documentaire ;
10. checkpoint GREEN final.

## Rule 26

Aucune lecture du contenu exact de `index.html` par les outils GitHub n'est autorisée.

Le HEAD courant exige :
- taille `8169990` octets ;
- blob `1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082`.

Après RED isolé, le micro-diff runtime ne pourra être réalisé qu'avec un ZIP/TXT fourni par Sylvain et vérifié localement contre cette empreinte.
