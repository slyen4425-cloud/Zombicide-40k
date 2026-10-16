# GenSrpG — Point de reprise LIVE (16 octobre 2026)

**Phase12 : D1–D9 + R01 GREEN. R02 actif sur sa branche dédiée, NON GREEN avant extraction + triple CI + checkpoint. Core203 suspendu.**

## R02 : cinq chaînes visuelles massives sorties du monolithe, sans déplacer le moteur

- **Base GREEN R01** : `1b0fa3a718059242507d3e95de45033bba57ea24`; checkpoint `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16`. Triple CI sur même SHA : Architecture [38897048039](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897048039), Firefox [38897047733](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047733), Tactical [38897047747](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38897047747) SUCCESS.
- **Checkpoint R02 §25** : `checkpoint/gensrpg-start-phase12-r02-legacy-visual-data-extraction-2026-10-16` sur SHA R01 GREEN, avant modifications. Branche : `work/gensrpg-phase12-r02-legacy-visual-data-extraction-2026-10-16`.
- **Source exacte §26** : `c5.zip` / `index.html(14).txt` reçue, **6 969 593 octets**, Git blob `caf31c121d926b7b76b9bb05688fab8f2839814e`, égale au SHA R01 GREEN.
- **Cible unique** : données visuelles 5 URL base64 dans le script anonyme de 5 364 441 octets : `Z40K_GENERIC_SHEET_BG` (PNG), `GENSRPG_EQUIPMENT_CARD_BG` (WebP), `GENSRPG_ENEMY_SKINS` (3 WebP). Aucun moteur, fonction, objet de jeu ni règle déplacés.
- **Application projetée et contrôlée (pas encore GREEN)** : `assets/gensrpg/core/legacy-visual-data-v1.js` (**4 100 559 octets**, blob `f7adfca9b04b23c489aae71ae9284c9b849f1d0b`), un `const` lexical partagé, le monolithe restant dans son **unique script original** et ses 5 valeurs remplacées par des accès aux mêmes chaînes. Balise classique synchrone juste avant ce script. Index attendu **2 869 485 octets** / blob `062c4cd37634f504cc75ce3329d6e69e19b5f547` ; gain net 4 100 108 octets.
- **Rollback** : outil `tools/gensrpg_phase12_r02_legacy_visual_data_extract_apply.py` restitue le R01 original **byte-exact**, et prouve les 5 valeurs en mémoire. Le script jeu restant fait 1 264 265 octets. Pas de réécriture du monolithe par domaine dans R02.
- **Gates** : source SHA certifiée ; transformation déterministe, syntaxe JS et VM / valeurs exactes ; ajout au pré-cache service worker et cache versionné ; graph et inventaires ; tests Architecture/Chromium, Firefox et Tactical **sur le même SHA après application** ; checkpoint final ensuite seulement.
- **Protection** : `main` gelée `e8681f9823573ced8aec59c8ddc47a72b02bc663`, aucun changement aux laboratoires, aux 32 images historiques Survie, aux sauvegardes et à la logique Capture/Dungeon/Tactical.
- **Dossier** : `docs/GENSRPG_PHASE12_R02_LEGACY_VISUAL_DATA_2026-10-16.md`. R01 GREEN reste documenté dans `docs/GENSRPG_PHASE12_R01_PWA_MANIFEST_2026-10-16.md`. Si l'extraction est validée, reprise suivante = scoping R03–R07 du monolithe restant, pas Core203.
