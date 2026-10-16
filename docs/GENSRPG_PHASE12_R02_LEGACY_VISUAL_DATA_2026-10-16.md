# Phase12 / R02 — Données visuelles du monolithe multi-domaines (16 octobre 2026)

**Travail isolé sur R01 GREEN, aucun runtime publié tant que la triple CI n'est pas SUCCESS.**

- Source §26 : fichier utilisateur `c5.zip` → `index.html(14).txt`, longueur 6 969 593 octets, blob `caf31c121d926b7b76b9bb05688fab8f2839814e`. Checkpoint R01 final `checkpoint/gensrpg-phase12-r01-pwa-dynamic-manifest-green-2026-10-16`, SHA `1b0fa3a718059242507d3e95de45033bba57ea24`.
- Départ R02 §25 : checkpoint `checkpoint/gensrpg-start-phase12-r02-legacy-visual-data-extraction-2026-10-16` au SHA code R01 GREEN ; branche `work/gensrpg-phase12-r02-legacy-visual-data-extraction-2026-10-16`.
- Propriété : **données visuelles uniquement** du gros script anonyme multi-domaines, pas de déplacement de fonction ni redéfinition du moteur. Le script original reste entier en termes de fonctions et de portée lexicale, sans le scinder artificiellement en plusieurs runtimes.
- Image 1 : `Z40K_GENERIC_SHEET_BG` PNG, 3 587 780 caractères base64 (2 690 833 octets image décodée).
- Image 2 : `GENSRPG_EQUIPMENT_CARD_BG` WebP, 136 656 caractères base64 (102 492 octets décodés).
- Images 3–5 : `GENSRPG_ENEMY_SKINS.creature/boss/invocation` WebP, respectivement 125 144 / 142 372 / 108 328 caractères base64.
- Les **cinq URL data** sont reproduites octet-identiquement dans `assets/gensrpg/core/legacy-visual-data-v1.js`. Le monolithe contient encore les mêmes trois déclarations `const`, les cinq initialisations lisent les mêmes chaînes depuis le `const GensRpgLegacyVisualDataR02` chargé juste avant, sans `async`/`defer`, et sans global `window`. Pas de conversion d'URL data en chemin d'image, donc pas de changement de format des sauvegardes/exports ou de rendu.
- Empreintes de projection locale vérifiées : nouveau JS **4 100 559 octets** / blob `f7adfca9b04b23c489aae71ae9284c9b849f1d0b`; `index.html` **2 869 485 octets** / blob `062c4cd37634f504cc75ce3329d6e69e19b5f547`, réduction nette **4 100 108 octets** ; monolithe désormais **1 264 265 octets** / blob `c7e4d2e7175814fcbe0a3d09e57b438286986ff3`. Les 5 remplacements sont les **seules différences du corps JS** ; annulation automatique reconstitue le code original R01 bit-à-bit.
- Préserve PWA : nouveau fichier ajouté au `service-worker.js` pré-cache et nom de cache versionné ; lancement hors ligne à vérifier. Ne pas modifier les 32 images historiques ni le manifeste PWA R01.
- **Tests obligatoires :** vérification hash/rollback, syntaxe JS, valeurs des cinq images via contexte global lexical, graph propriétaire, tests historiques R01→D9→D1, Architecture/Chromium, Firefox, Tactical au même commit + checkpoint GREEN. Test manuel visuel de l'éditeur/fiche et des ennemis recommandé.
- Après R02 : audit et découpe par responsabilités des **~1,264 Mo de code réellement restant** dans le monolithe, sans multiplier les micro-lots Core Dungeon.
