# GenSrpG — Phase 5 / retrait openChar Dungeon Core 0.28

Date : 2026-09-23

## Base

- Branche :
  `work/gensrpg-phase5-openchar-core028-retirement-2026-09-23`
- Checkpoint de départ :
  `checkpoint/gensrpg-start-phase5-openchar-core028-retirement-2026-09-23`
- Base GREEN :
  `checkpoint/gensrpg-phase5-openchar-authority-preaudit-green-2026-09-23`
- SHA de base :
  `ed5f306fb4fe0182863dac78866edfe81a23dbe3`
- Production :
  `main = e8681f9823573ced8aec59c8ddc47a72b02bc663`, gelée.

## Objectif

Retirer uniquement le bloc historique :

`dungeonCore028HeroExploreGuard`

sans remplacer :
- son wrapper global `window.openChar` ;
- son `MutationObserver` ciblé sur `#sheet` ;
- ses retries `setTimeout(...,0)` et `setTimeout(...,100)` ;
- sa fonction `dc028RemoveHeroExplore`.

Le propriétaire natif Shell `function openChar(id)` reste inchangé.
`captureFix139` reste le seul wrapper global `openChar`, car il porte encore
une garde réelle pendant le démarrage Monster Capture.

## TDD

Sentinelle :
`tests/gens_phase5_openchar_core028_retirement_v1.test.cjs`.

RED confirmé avant modification sur SHA
`92c63e20ceebe76375eeaf2d18479a0cc30af07e`.

Run Architecture :
`35921773644`.

Échec unique attendu :
`Retirer le wrapper openChar Dungeon Core 0.28`.

Firefox et Tactical étaient GREEN sur ce RED.

## Modification runtime

Commit runtime :
`26714f32cf0b857bc09c0e3999f2b65579a7c5b7`.

Modification :
- suppression complète du bloc `dungeonCore028HeroExploreGuard` ;
- 49 lignes runtime supprimées ;
- 0 ligne runtime ajoutée ;
- aucun autre bloc runtime modifié.

Runtime avant :
- taille `8172500` ;
- blob `7b586e9fb14b7a93a0edb069e115fd6d48cbda97`.

Runtime après :
- taille `8170726` ;
- blob `d9ee34d47fa888795db68cdc244d0c73d30ee523`.

## Résultat architectural

Chaîne stricte `window.openChar =` :

avant :
`captureFix139 -> dungeonCore028HeroExploreGuard`

après :
`captureFix139`

Le Shell natif reste propriétaire de la fiche hors combat.

Supprimés :
- 1 bloc inline actif ;
- 1 wrapper global `openChar` ;
- 1 global `dc028RemoveHeroExplore` ;
- 1 `MutationObserver` de compatibilité ;
- 2 retries `setTimeout`.

Aucun wrapper, observer, retry, polling ou fallback de remplacement n'a été ajouté.

## Cartographie Phase 2 après retrait

- blocs inline total : `129` ;
- blocs actifs : `119` ;
- blocs désactivés : `10` ;
- globals explicites distincts : `436` ;
- affectations globales : `760` ;
- globals multi-owner : `119` ;
- chaîne `openChar` : `captureFix139` uniquement ;
- sources inline contenant des timers : `65` ;
- syntaxes `setTimeout` inline : `143` ;
- `setInterval` inline : `1`.

La cartographie a été régénérée depuis le vrai runtime, puis ses sentinelles ont
été alignées sur ces valeurs.

## Validation navigateur réelle

La caractérisation
`tests/gens_phase5_openchar_core028_browser_characterization_v1.test.cjs`
tourne désormais directement sur le runtime où Core 0.28 est réellement absent.

Résultats :
- vraie session Dungeon : SUCCESS ;
- vraie fiche héros : SUCCESS ;
- onglets Dungeon : présents ;
- aucun bouton Explorer visible/clicable ;
- les éventuels contrôles « Explorer » Survie restent cachés et appellent
  `generateZombieWaveQuick()` ;
- flash Survie dans la fiche RPG : absent ;
- aucune erreur runtime.

Le navigateur complet valide aussi :
- Survie et Fouiller/arts ;
- goMenu Dungeon/Capture/Survie ;
- Dungeon -> Tactical V2 ;
- Capture victoire/reprise ;
- Dungeon après Survie ;
- Builder ;
- Config objet ;
- cache/retour/pièges authored ;
- Save & Quit/reprise ;
- PvP ;
- Monster Capture ;
- non-interférence quatre modules ;
- murs, assets et Equipment.

## Candidat technique GREEN

SHA technique :
`cb2c5b9a578525680e586aeaf0248de945e01ed6`.

Runs :
- Architecture + navigateur : `35923707576` — SUCCESS ;
- Firefox : `35923707606` — SUCCESS ;
- Tactical Dock : `35923707596` — SUCCESS.

## QA utilisateur conservée hors périmètre

Ne pas mélanger avec ce lot :
1. Stats au retour / rafraîchissement ;
2. détection ennemie intermittente + cas de téléportation ennemie ;
3. libellé Survie « explorer salle » alors que l'action appelle correctement
   `generateZombieWaveQuick()`.

Aucune rustine n'a été ajoutée pour ces trois points.

## Clôture

Après triple CI du SHA documentaire final :
- créer
  `checkpoint/gensrpg-phase5-openchar-core028-retirement-green-2026-09-23` ;
- construire une preview téléphone composée comme GitHub Pages ;
- demander validation manuelle ;
- seulement ensuite ouvrir le prochain micro-lot Phase 5.

Aucun merge sur `main`.
