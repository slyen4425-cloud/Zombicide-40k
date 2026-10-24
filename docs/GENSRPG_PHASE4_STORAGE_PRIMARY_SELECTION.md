# GenSrpG — Phase 4 Storage — Dungeon Primary Selection

Date : 2026-09-20

Branche :
`work/gensrpg-phase4-storage-primary-selection-2026-09-20`

Checkpoint de départ :
`checkpoint/gensrpg-start-phase4-storage-primary-selection-2026-09-20`

Base :
`193128afe716664021300d501d29c39ac8dc8ecd`
(`checkpoint/gensrpg-survival-search-art-integration-green-2026-09-20`)

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

## Périmètre

Migrer uniquement la clé JSON :
`gensrpg_dungeon_primary_selection_v167833`

Consommateurs :
- `dungeon-world-session-bridge-167832.js` ;
- `dungeon-large-room-support-167834.js` ;
- `dungeon-authored-bootstrap-167849.js` ;
- `dungeon-authored-action-fix-167857.js`.

Core Storage devient propriétaire du transport JSON uniquement.
Dungeon conserve la clé, l'inférence `world/adventure`, les validations et les décisions de sélection.

## Précondition

Le lot GREEN Core Storage Bootstrap Order a rendu :
`assets/gensrpg/core/storage-v1.js`
disponible avant Large Room Support et les consommateurs concernés.

Le blocage identifié dans l'audit stockage précédent est donc levé.

## État historique

Accès directs :
- World Session Bridge : 1 lecture + 1 écriture ;
- Large Room Support : 1 lecture ;
- Authored Bootstrap : 1 lecture fallback ;
- Authored Action Fix : 1 lecture fallback.

Total : 5 accès directs.

Contrats historiques conservés :
- lecteurs Bridge / Large Room : objet JSON ou `null` ;
- lecteurs Authored : JSON brut ou `null` en cas d'erreur ;
- writer Bridge : sérialise `x || null`, avale les erreurs et retourne `x`.

## Migration

Raccord appliqué :
- 4 lectures vers `ROOT.GensStorageV1.readJson(ROOT.localStorage, PRIMARY_KEY, null)` ;
- 1 écriture vers `ROOT.GensStorageV1.writeJson(ROOT.localStorage, PRIMARY_KEY, x || null)`.

Le writer conserve son `try/catch` métier afin de préserver exactement l'ancien contrat d'erreur.

Aucun helper métier partagé n'a été créé.

## Zone explicitement interdite

`gensrpg_dungeon_runtime_v2` reste intact.

Dans :
- `dungeon-large-room-support-167834.js` ;
- `dungeon-authored-action-fix-167857.js`

les accès `RT_KEY` restent directs et sont protégés par le garde d'autorité.

Aucun Stats/Tactical/Capture/Survie n'a été modifié.

## Tests

Ajoutés :
- `tests/gens_phase4_storage_primary_selection_parity_v1.test.cjs` ;
- `tests/gens_phase4_storage_primary_selection_owner_v1.test.cjs`.

Ils vérifient :
- parité read/write/fallback ;
- comportement sur JSON valide/invalide, primitives, tableaux et erreurs stockage ;
- autorité Core Storage pour les 5 accès ;
- clé toujours possédée par Dungeon ;
- Core générique ignorant la clé métier ;
- `gensrpg_dungeon_runtime_v2` explicitement inchangé.

Fixtures historiques avancées pour charger Core Storage comme la composition réelle :
- World Session Bridge ;
- Large Room ;
- Authored Bootstrap ;
- Authored Action Fix.

La CI rejoue uniquement les scénarios historiques strictement utiles au lot Storage :
- World Session Bridge ;
- Large Room ;
- Authored Bootstrap.

## Dette fonctionnelle préexistante détectée

Le test historique `dungeon_authored_action_fix_v167857.test.cjs` révèle une assertion fonctionnelle préexistante :
après sortie d'une case coffre exact authored, le bouton générique `Fouiller` reste masqué.

Preuve de préexistence :
- `syncLegacyChestButton()` est byte-identique entre la base GREEN et le lot courant ;
- seule la fonction `primary()` a été changée dans ce module ;
- parité Primary Selection et garde Storage sont GREEN.

Décision :
ne pas corriger ce comportement dans un lot Storage.
Il doit rester un sujet Dungeon séparé si on décide de le traiter.

## Manifeste Phase 2

Avant :
- total `208` ;
- résolus `143` ;
- non résolus `65` ;
- clés directes résolues `28`.

Après :
- total `203` ;
- résolus `138` ;
- non résolus `65` ;
- clés directes résolues `27`.

Dungeon :
- accès `176 -> 171` ;
- résolus `126 -> 121` ;
- non résolus `50` inchangés ;
- clés directes `20 -> 19`.

## Validation GREEN

HEAD avant clôture documentaire :
`f860f81cfa8063bcf8442ac76eca645e844e5c38`

Runs :
- Architecture + navigateur complet `35508639664` — SUCCESS ;
- Firefox `35508639662` — SUCCESS ;
- Tactical Dock `35508639663` — SUCCESS.

Aucun merge sur `main`.

## Suite

Ouvrir un nouveau lot d'audit stockage depuis le checkpoint GREEN final de ce lot.

Interdits maintenus :
- ne pas attaquer `gensrpg_dungeon_runtime_v2` sans audit dédié ;
- ne pas absorber la persistance Stats dans un lot stockage générique ;
- ne pas mélanger Tactical et état héros dynamique ;
- ne pas forcer les valeurs scalaires Runtime Repair dans le Core JSON.
