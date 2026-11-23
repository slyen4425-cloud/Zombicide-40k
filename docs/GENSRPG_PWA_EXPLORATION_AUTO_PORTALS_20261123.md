# PWA Monster InvoC — Portails automatiques et apparences Exploration (23 novembre 2026)

## Périmètre unique
- Demande : fusionner la PR #524 Exploration, publier l'éditeur 2,5D et raccorder la source à la PWA.
- Exploration main certifié : `98e3f67700494d76ab12628ee52d498e7cc24606` (CI `45186744323`, release Pages `45186743956` GREEN).
- Capture V2 candidate finale `63a82024504c6deec63f40f090d03760492609d8` dérivée du candidat compétences génériques de la PR PWA #630 (`5cbb1dd41566066738f01e3b7f0f03a27d64875c`) avec seulement le pin Exploration mis à jour et tests de provenance. Les descriptions automatiques, salves et zones sur trajet restent intégralement conservées.
- Combat officiel `2b3438a3f7d0ab13c2b074710ffc7d9925dec071` (CI `45190363744`, compétences génériques PR #630) et catalogue visuel épinglé inchangé. Moteur PWA, shell, caches et sauvegardes inchangés.
- Unique publisher existant : `.github/workflows/main.yml`; les assets Exploration appartiennent à `vendor/exploration-lab`, sans seconde autorité de Portal ou de textures.

## Fonctionnement et compatibilité
- Marche automatique à l'entrée du déclencheur natif, aucune touche/clic « Entrer » requise sur Portal valide ; point d'arrivée par Spawn déjà existant et garde de réentrée.
- Apparences de Portal : cercle historique, invisible en jeu (éditable), ombre noire, texture de la bibliothèque matérielle officielle ; aucune URL personnalisée ou fichier binaire embarqué dans WorldDocument.
- Un ancien Portal invalide refuse la traversée : réparation explicite dans le World Builder, sans correction silencieuse de la carte.
- Le renderer de terrain sud `src/render/sculpt-height-renderer.js` est conservé à l'octet avec Git blob `6c101756bdf9c58a9ae8cf3fe104e49575145748` ; seule la certification de SHA officiel est enrichie dans le publisher.

## Réconciliation concurrente
- Reprise de PR PWA #628 sur `main@1630f219bd8b2232212a9cfc597abbe577ba7d87` après fusion de #630, sans revenir au candidat Combat antérieur. Les contrôles de description/éditeur génériques de #630 sont maintenus et les contrôles auto-Portal sont ajoutés, sans deuxième source de vérité.

## Gates
1. PR PWA CI : exactitude source Capture/Exploration/Combat, test de présence des nouveaux contrôles, rendu terrain et provenance immuable, budget du site <900 Mio, Chromium paysage mobile + PC.
2. Fusion sur `main` uniquement une fois toutes les vérifications vertes.
3. GitHub Pages sur SHA fusionné, preuve de déploiement et de contrôle HTTPS. PWA installée Android à recontrôler sans effacer le stockage utilisateur.

Les nouveaux retours du 23 novembre concernant escaliers, pinceaux, boutiques, consommables et gorille sauvage forment des lots séparés et ne doivent jamais être intégrés silencieusement ici.
