# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**Phase 12 : D1–D9, R01, R02, R03 et R04 GREEN technique/CI. Phase 12 globale OUVERTE.** Aucun lot R05 lancé. Production `main` inchangée.

## Dernier code validé — Phase 12 R04

- **Checkpoint final R04 §25** : `checkpoint/gensrpg-phase12-r04-builders-equipment-library-green-2026-10-17`, pointant exactement sur le SHA GREEN `645f5fa9b849c1732e2c11f625548665067294ec`. [Source index R04 GREEN](https://github.com/slyen4425-cloud/Zombicide-40k/blob/645f5fa9b849c1732e2c11f625548665067294ec/index.html).
- **Branche R04** : `work/gensrpg-phase12-r04-builders-equipment-library-2026-10-17` ; seul le commit documentaire de clôture vient après le code GREEN.
- **Checkpoint de départ §25** : `checkpoint/gensrpg-start-phase12-r04-builders-equipment-library-2026-10-17`, SHA documentaire R03 `c311e8b721fcb789c89f2d1035a60f7e3ca3eec2`, dont les blobs runtime sont ceux du checkpoint R03 GREEN `afab707dad385450fdf296f7b2b6b41da376929b`.
- **Source certifiée §26 utilisée** : `c7.zip` / `index.html(16).txt` = **2 862 906 octets**, Git blob `8faf7af7fced0a1e0724985e85718a0e4a9e673b` ; **c7 correspond à R03, pas au nouvel index R04**.

## Changement borné R04 — propriétaire Builders / équipements

- Déplacement **byte-identique** de **26 fonctions** de bibliothèque et éditeur d'équipements multi-modes (`CUSTOM_EQUIPMENT_KEY` jusqu'avant `GENS_GAME_CONFIG_KEY`) vers `assets/gensrpg/builders/equipment-library-editor-v1.js`, **27 860 octets**, Git blob `27cadba87c766b5293ac3a7fe3ddffb8510adc40`.
- Nouveau `index.html` = **2 835 125 octets**, Git blob `554bf6100aeb0f40bfc098dc90863af7d2d5e439` ; HTML réduit de **27 781 octets**. Un script classique externe unique est chargé **synchroniquement avant le monolithe**, sans `defer/async/module`.
- **Appel initial** `refreshCustomEquipmentIntoItems();` préservé **dans son emplacement historique** et dans son ordre d'exécution. Aucune refonte du comportement équipement ni des règles de combat.
- **Rollback** R04→R03 exact, puis R03→R02→R01 ; vues historiques et tests antérieurs préservés avec leurs empreintes. Le pré-cache PWA inclut le nouvel asset avec version de cache R04, et le manifeste de propriétaires compte **106 modules JS joignables**.
- **Hors périmètre** : Core Stats, persistance générale/IndexedDB et cloud, moteurs Survie/Dungeon/Capture/PvP/Tactical, les 32 images Survie historiques, les deux laboratoires.

## Validation même SHA et limites

- Application contrôlée [38988466500](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38988466500) **SUCCESS** ; publication des protections historiques [38988745257](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38988745257) **SUCCESS**.
- **Architecture + sentinelle navigateur Chromium** [38989338985](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989338985) : **SUCCESS** ; incluant l'extraction R04, les règles d'équipement, la non-interférence et les scènes historiques.
- **Firefox** [38989339009](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989339009) : **SUCCESS**.
- **Tactical Chromium/Firefox** [38989338929](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38989338929) : **SUCCESS**.
- **Six checks SUCCESS** au même SHA `645f5fa9b849c1732e2c11f625548665067294ec` : `architecture-sentinels`, `browser-sentinel`, `firefox-wall-zoom`, `dock-contract`, `dock-chromium`, `dock-firefox`.
- GREEN **technique/CI** seulement : **aucun test manuel Android ni test hors ligne sur PWA réellement installée n'est attesté**. Aucun merge `main`.

## Reprise suivante

- **R05 non ouvert** : borner une nouvelle responsabilité cohérente dans le monolithe restant ; ne pas repartir sur D10 ni un lot multi-domaines artificiel. Un lot = checkpoint initial, branche, source exacte §26, rollback, mêmes trois CI, checkpoint GREEN.
- Pour tout futur changement du gros HTML, reprendre la source **R04** à [ce SHA exact](https://github.com/slyen4425-cloud/Zombicide-40k/blob/645f5fa9b849c1732e2c11f625548665067294ec/index.html), vérifier taille/blob, et obtenir un nouveau ZIP uniquement si l'accès au contenu exact est nécessaire. Ne pas réutiliser `c7.zip` comme s'il s'agissait du HTML R04.
- **`main` reste `e8681f9823573ced8aec59c8ddc47a72b02bc663`** ; laboratoires combat et exploration hors chantier. Ne pas fusionner les branches R02 concurrentes.
- Rapport du lot : `docs/GENSRPG_PHASE12_R04_BUILDERS_EQUIPMENT_LIBRARY_2026-10-17.md`. Roadmap : `docs/GENSRPG_RESTRUCTURATION_ROADMAP.md`.
