# PWA Monster InvoC — Portails automatiques et apparences Exploration (23 novembre 2026)

## Périmètre unique
- Demande : fusionner la PR #524 Exploration, publier l'éditeur 2,5D et raccorder la source à la PWA.
- Exploration main certifié : `98e3f67700494d76ab12628ee52d498e7cc24606` (CI `45186744323`, release Pages `45186743956` GREEN).
- Capture V2 candidate dérivée du pin PWA préexistant `fd96d00dd7aa8d2a6f5fc3951e49e75a897f1b9c`, modification autorisée du seul pin Exploration `source-pins-v1.json` et test additionnel; nouveau SHA candidate `ee160bc5de52d9e74bf5ba2662359b73ae635ae5`.
- Combat officiel `23623733ab077fd09603848b16ab17806a26ed11` et visuels épinglés inchangés. Moteur PWA, shell, caches et sauvegardes inchangés.
- Unique publisher existant : `.github/workflows/main.yml`; les assets Exploration appartiennent à `vendor/exploration-lab`, sans seconde autorité de Portal ou de textures.

## Fonctionnement et compatibilité
- Marche automatique à l'entrée du déclencheur natif, aucune touche/clic « Entrer » requise sur Portal valide ; point d'arrivée par Spawn déjà existant et garde de réentrée.
- Apparences de Portal : cercle historique, invisible en jeu (éditable), ombre noire, texture de la bibliothèque matérielle officielle ; aucune URL personnalisée ou fichier binaire embarqué dans WorldDocument.
- Un ancien Portal invalide refuse la traversée : réparation explicite dans le World Builder, sans correction silencieuse de la carte.
- Le renderer de terrain sud `src/render/sculpt-height-renderer.js` est conservé à l'octet avec Git blob `6c101756bdf9c58a9ae8cf3fe104e49575145748` ; seule la certification de SHA officiel est enrichie dans le publisher.

## Gates
1. PR PWA CI : exactitude source Capture/Exploration/Combat, test de présence des nouveaux contrôles, rendu terrain et provenance immuable, budget du site <900 Mio, Chromium paysage mobile + PC.
2. Fusion sur `main` uniquement une fois toutes les vérifications vertes.
3. GitHub Pages sur SHA fusionné, preuve de déploiement et de contrôle HTTPS. PWA installée Android à recontrôler sans effacer le stockage utilisateur.

Les nouveaux retours du 23 novembre concernant escaliers, pinceaux, boutiques, consommables et gorille sauvage forment des lots séparés et ne doivent jamais être intégrés silencieusement ici.
