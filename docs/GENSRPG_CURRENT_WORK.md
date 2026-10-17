# GenSrpG — CURRENT_WORK officiel (17 octobre 2026)

**Phase12 D1–D9 et R01–R04 GREEN technique/CI. R05 Core cloud sync & backup EN COURS, NON GREEN. Phase 12 globale OUVERTE.** Aucun changement de `main`.

## R05 — propriétaire Core de synchronisation et sauvegardes

- **Checkpoint initial §25** : `checkpoint/gensrpg-start-phase12-r05-core-cloud-sync-backup-2026-10-17` au SHA **`f01e0b65c67fcc4e14dbd64b8fec17625c1b5753`**, état de clôture documentaire R04, blobs runtime identiques au R04 code GREEN `645f5fa9b849c1732e2c11f625548665067294ec`.
- **Branche unique** : `work/gensrpg-phase12-r05-core-cloud-sync-backup-2026-10-17`.
- **Source exacte §26** : ZIP utilisateur `c7 (1).zip`, entrée `index.html(17).txt`, **2 835 125 octets**, blob Git **`554bf6100aeb0f40bfc098dc90863af7d2d5e439`** = HTML du checkpoint GREEN R04.
- **Propriétaire** : Core — session en ligne, synchronisation cloud, collecte de données partagées et récupération/compactage des sauvegardes locales. **Borne matérielle** : le script anonyme actif autonome de 53 746 octets ouvrant par `const Z40K_SUPABASE_URL` et finissant avec son listener DOMContentLoaded, avant la section `z40kUpdateBanner`; pas les moteurs de jeu, ni le script version/accueil de 180 964 octets, ni le gros monolithe restant.
- **Transformation projetée / NON GREEN** : déplacement **byte-identique** du corps de ce script vers `assets/gensrpg/core/legacy-cloud-sync-backup-v1.js` (**53 746 octets**, Git blob `8d7f8179676b096a53816cd1ca2530c120e3cf18`), avec unique balise `script src` classique **synchrone au même emplacement**. Index cible : **2 781 436 octets**, Git blob `485de2e6a08ffd89e4f1fb9410e40c938774d62f`, HTML réduit de 53 689 octets ; rollback exact vers R04 vérifié avant exécution.
- **Invariant fondamental** : ne modifier **aucune ligne** de la synchronisation, des clés de localStorage, du compte Supabase, de l'ordre des initialisations synchrones (y compris récupération des sauvegardes au chargement), ni des listeners ou callbacks. Ne pas afficher de clés ni de contenus de sauvegardes dans les rapports. Ne pas déplacer ni remapper l'appel de récupération/compactage.
- **Tests requis** : empreintes octet-exactes des deux sorties, unique script classique dans l'ordre original, analyse syntaxique, aucune fonction source dupliquée, restauration R05→R04→R03→R02→R01, contrôle hors ligne et synchronisation sans mutation de données, pré-cache PWA, manifest de propriétaires, CI Architecture + Chromium, Firefox, Tactical **six checks SUCCESS au même SHA**, checkpoint GREEN uniquement ensuite.
- **Périmètres protégés** : R01–R04, Core Stats, sauvegardes de Survie/Dungeon/Capture/PvP, les deux laboratoires, les 32 visuels Survie historiques, `main` gelée au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
- **Référence précédente** : checkpoint GREEN R04 `checkpoint/gensrpg-phase12-r04-builders-equipment-library-green-2026-10-17`, SHA code `645f5fa9b849c1732e2c11f625548665067294ec`. Rapport `docs/GENSRPG_PHASE12_R04_BUILDERS_EQUIPMENT_LIBRARY_2026-10-17.md`.

## Prochaine étape
Appliquer un seul transfert physique contrôlé avec vérification du blob R04 §26, réconcilier les sentinelles strictes avec les vues historiques, obtenir les trois CI au même SHA ; **R05 NON GREEN jusqu'à ces preuves**. Pas de publication sur `main` et pas d'ouverture de R06.
