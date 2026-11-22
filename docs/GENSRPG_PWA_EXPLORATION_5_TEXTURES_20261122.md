# PWA Genesis RPG — cinq textures de sol Exploration (22 novembre 2026)

## Périmètre
- Demande auteur : publier les 5 textures validées de l'éditeur 2,5D dans la PWA Monster InvoC.
- Unique laboratoire propriétaire : `slyen4425-cloud/laboratoire_dynamique_exploration-`.
- Source approuvée : Exploration PR #523 fusionnée sur `main@1b69d62a88e77c545ab9a476a6a2b7f81ad4dd90`. Extraction autorisée des cinq WebP 128×128 avec SHA256 contrôlés ; les sources d'images restent dans le dépôt Exploration.
- Contrôle Exploration : PR CI #45051517319 (deuxième tentative GREEN), validation assemblage #45051517380 GREEN ; CI `main` #45064920351 et Pages à certifier avant publication.
- Capture V2 source immuable issue de `58c16831ddd500e534bfb0e673b538cf8072b3d7` avec deux seuls changements : `source-pins-v1.json` et le test de provenance du chargement. Nouveau SHA source : `a2a1666ddca286e76edf155f91fe097cec992f79`.
- Épinglage PWA sous `tools/capture_v2_pages_preview_pin.json` ; branche `work/pwa-five-exploration-terrain-textures-20261122`, checkpoint `checkpoint/gensrpg-before-5-terrain-textures-pwa-20261122` sur `main@9974244c6a93f908d194f7949d78b25ab019cb40`.

## Contrats protégés
- Le seul publisher reste `.github/workflows/main.yml` ; aucun nouvel éditeur, registre, ni copie de moteur.
- Le renderer natif d'Exploration a la **même empreinte Git blob** `6c101756bdf9c58a9ae8cf3fe104e49575145748` que la version certifiée précédente ; certification ajoutée explicitement sans réécrire le renderer.
- Les cinq textures sont livrées exclusivement sous `preview/capture-v2-pr225/vendor/exploration-lab/assets/exploration/materials/forest/surfaces` avec IDs matériels et familles existantes.
- Haute herbe et herbe fleurie (forest), neige rocheuse (snow), terre naturelle (plain), sol volcanique rocheux (volcano).
- Les cinq nouvelles options doivent figurer dans les deux sélecteurs natifs Peinture et Sol de base ; `WorldDocument`, collisions et taux de rencontre restent inchangés.
- Pas de ZIP source ni de textures en double dans Pages. Les anciens assets et sols volcaniques restent accessibles.
- Combat épinglé `34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0`, visuels `b807389811c5a7e5236b9fdc96b7f155168d7fd7` inchangés. Sauvegardes, service worker root, navigation et multijoueur inchangés.

## Tests de sortie
1. Exploration CI main et Pages au SHA exact doivent réussir.
2. PR PWA : tests sources épinglées, test de présence physique des 5 WebP et SHA256, sélecteurs, assets uniques, absence de ZIP et régression renderer ; Chromium Android paysage / PC.
3. Publication Pages main du nouveau commit : budget site non compressé sous 900 Mio, aucune bibliothèque dupliquée, preuve HTTPS des pins et des cinq fichiers natifs.
4. PWA installée Android à tester sans vider le stockage utilisateur ; le navigateur ne prouve pas à lui seul la migration du cache installé.

Ne déclarer GREEN qu'après validation vérifiable de la publication publique.
