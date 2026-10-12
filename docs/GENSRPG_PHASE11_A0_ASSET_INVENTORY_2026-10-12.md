# GenSrpG — Phase 11 / A0 : recensement réel des assets visuels

Date : 12 octobre 2026. Périmètre **inventaire et garde de frontières uniquement**, sans déplacement.

## Base et charte

- Phase 10 clôturée architecturalement au checkpoint `checkpoint/gensrpg-phase10-pvp-architectural-closure-s4-green-2026-10-12` (`b5b16cb9d0a8def7749a32a9bfecf1ce17cd21ef`).
- Base de reprise plus récente (documentation Phase 10, elle aussi triple-CI GREEN) : `3acd7a6112e3da9a546749e1acb39ee81cb4c9d7`.
- Checkpoint de départ §25 : `checkpoint/gensrpg-start-phase11-asset-inventory-2026-10-12` sur cette base.
- Branche unique : `work/gensrpg-phase11-asset-inventory-2026-10-12`.
- Propriétaires : Core = résolution centrale des assets ; chaque mode = ses fichiers privés ; Shell/PWA = icônes d'application ; dépendances tierces hors inventaire du jeu.
- Aucune modification de `main` (`e8681f9823573ced8aec59c8ddc47a72b02bc663`), du runtime, des images, des laboratoires ou d'`index.html`.

## Résultat de l'inventaire Git exact

Le Git tree du commit de base n'est pas tronqué. Il contient **173 fichiers image** (PNG/JPG/JPEG/WebP/GIF/SVG pris en compte ; pas nécessairement toutes les extensions présentes), avec SHA blob et taille consignés dans `docs/phase11/asset-inventory-a0.json`.

| Classification prudente | Nombre | Interprétation et action |
|---|---:|---|
| `assets/dungeon/creatures/` | 112 | Déjà dans l'espace de noms Dungeon ; consommateur réel non certifié individuellement |
| `assets/dungeon/items/` | 22 | Déjà dans l'espace de noms Dungeon ; ne pas déplacer par type apparent sans preuve |
| `assets/img_01_…` à `assets/img_32_…` | 32 | **Propriétaire à établir** ; ne pas renommer ni déplacer |
| `Icon/icon-192.png`, `Icon/icon-512.png`, racine `icon-192.png` et `icon-512.png` | 4 | Candidats Shell/PWA ; deux collisions de basenames intentionnelles à étudier avant migration |
| Logos et icône interne sous `node_modules/playwright-core/` | 3 | Dépendances tierces, exclues des migrations de contenus GenSrpG |

**Attention :** emplacement Git ≠ preuve que le runtime utilise effectivement un asset. Le manifeste exprime le propriétaire du *chemin*, ou son statut inconnu, pas une affirmation sur le consommateur.

L'actuel `assets/gensrpg/core/asset-resolver-v1.js` possède déjà une table Dungeon pour `assets/dungeon/creatures/`. Il doit rester l'autorité centrale : aucune nouvelle résolution concurrente ni fallback inter-module. Ce fichier n'est pas modifié dans A0.

## Gardes automatiques et collisions

`tests/gens_phase11_asset_inventory_a0.test.cjs` contrôle depuis le vrai index Git (métadonnées `git ls-files --stage`) : totalité des entrées image, unicité des chemins, SHA blob et tailles exactes, classes de propriétaire provisoires et trois collisions de basenames connues (deux icônes PWA et le logo Playwright). Le test est ajouté aux Architecture sentinels ; les autres CI continuent de vérifier les modules.

## Limite charte §26 et prochaine migration

L'usage réel d'une image dans le gros `index.html` n'a **pas** été inspecté dans A0 : la charte §26 demande le ZIP de l'index exact si son contenu est nécessaire. Ne pas contourner cette procédure en utilisant une ancienne copie ou en prétendant avoir audité les références de ce HTML.

Ordre de suite :
1. Recueillir la preuve des références réelles des 32 `assets/img_*` et des icônes, via le mécanisme §26 si inspection de l'index nécessaire ; auditer aussi JS/CSS externes, les profils/exports et le cache PWA.
2. Déterminer leur propriétaire sans supposer qu'un nom suggère un module. Établir une **table ancien → nouveau** contrôlée et versionnée uniquement pour des assets réellement à migrer.
3. Adapter la résolution centrale avec compatibilité contrôlée et tests du vrai chargement/du cache ; déplacer ensuite seulement un lot de fichiers et éliminer les anciens chemins après validation.
4. Repasser Architecture/Chromium, Firefox, Tactical, les tests visuels et les scénarios de non-interférence avant tout GREEN de migration.

**A0 ne clôture pas la Phase 11** : il sécurise son inventaire pré-migration et peut recevoir un checkpoint GREEN de ce seul lot si ses tests et la triple CI passent.
