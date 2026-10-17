# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**Phase 12 : D1–D9, R01, R02, R03 GREEN technique/CI. R04 Builders équipement EN COURS — NON GREEN.** Ne pas fusionner sur `main`.

## R04 : bibliothèque et éditeur d'équipements multi-modes

- **Point de départ §25** : SHA `c311e8b721fcb789c89f2d1035a60f7e3ca3eec2` (dernier commit documentaire R03, blobs runtime identiques au checkpoint code GREEN `afab707dad385450fdf296f7b2b6b41da376929b`). Checkpoint `checkpoint/gensrpg-start-phase12-r04-builders-equipment-library-2026-10-17` créé sur le vrai départ.
- **Branche de travail unique** : `work/gensrpg-phase12-r04-builders-equipment-library-2026-10-17`.
- **Source §26 CERTIFIÉE** : `c7.zip` / `index.html(16).txt`, **2 862 906 octets**, blob Git `8faf7af7fced0a1e0724985e85718a0e4a9e673b`, correspond au code R03 GREEN.
- **Périmètre propriétaire Builders** : bloc contigu `CUSTOM_EQUIPMENT_KEY` → avant `GENS_GAME_CONFIG_KEY` : bibliothèque et éditeur d'équipements pour les différents modes, 26 déclarations de fonctions, chargement/sauvegarde de la bibliothèque et contrôles UI ; équipement Capture traité dans le même éditeur générique. **Hors périmètre** : moteur de capture/combat, sauvegardes cloud et IndexedDB, Core Stats, Dungeon, Survie et PvP.
- **Contrat de comportement essentiel** : laisser l'appel initial `refreshCustomEquipmentIntoItems();` **à son emplacement original dans le grand script**, après l'initialisation de `ITEMS` et des autres dépendances. Le module externe, à charge synchrone sans `async/defer/module`, ne doit déclarer que fonctions et variables de l'éditeur, sans déplacer l'effet de bord de démarrage.
- **Transformation testée localement, pas encore GREEN** : 27 860 octets de module prévus pour `assets/gensrpg/builders/equipment-library-editor-v1.js` (blob `27cadba87c766b5293ac3a7fe3ddffb8510adc40`), nouvel index de **2 835 125 octets** (blob `554bf6100aeb0f40bfc098dc90863af7d2d5e439`), gain de 27 781 octets sur index. Rollback vers R03 exact vérifié localement. Aucun gameplay remanié.
- **Gates** : application GitHub sous SHA+blob §26 verrouillés, parse Node/VM et ordre parser, aucune duplication des 26 fonctions ni suppression de l'appel initial, actualiser pré-cache PWA/manifeste de propriétaires, historique R04→R03→R02→R01, tests de la bibliothèque/éditeur multi-mode et des quatre modes, CI Architecture + Firefox + Tactical SUCCESS **sur le même commit**, checkpoint final seulement après preuves.
- **Restrictions** : pas de publication `main` (gelée à `e8681f9823573ced8aec59c8ddc47a72b02bc663`), pas de modification des laboratoires combat/exploration, pas de suppression des 32 visuels Survie.
- **Référence pour reprise** : dernier checkpoint GREEN R03 `checkpoint/gensrpg-phase12-r03-shell-hub-family-ui-extraction-green-2026-10-16`, et `docs/GENSRPG_PHASE12_R03_SHELL_HUB_FAMILY_UI_2026-10-16.md`. Phase 12 globale reste ouverte.

## Suite
Un lot cohérent = un propriétaire, une branche, un checkpoint de départ, un rollback, trois CI. Après R04 GREEN, rebornage du reste du monolithe ; ne pas créer R05 avant.
