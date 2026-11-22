# Capture V2 — menu portrait et fond unique (22 novembre 2026)

## Diagnostic reproductible
- Signalement utilisateur sur Android portrait : héros Kitsune en double échelle, hub GenSRPG visible derrière Capture, `Monster Capture` / `Quitter le mode` / `Retour à GenSRPG` chevauchés.
- Source actuelle de la PWA : Capture V2 immuable `ce259cf1b3901cda85c2a4218241a82639bb4563` ; les images importées restent en IndexedDB dans le seul Créateur.
- Le bloc `[data-creator-wallpaper="true"]` de `shell-style-v1.css` répétait `var(--capture-home-art)` deux fois (`contain` et `cover`). Sur images partiellement transparentes, le fond sous Capture restait visible car sa couche d'accueil ne fournissait pas un remplissage opaque.
- La préparation Aventure réutilisait aussi deux fois l'illustration `--capture-shell-wallpaper`. Son fond était opaque, mais le doublon en portrait persistait.
- En-tête : disposition flex horizontale sans passage à la ligne en portrait ; la troisième navigation est injectée par `capture-v2-from-main-entry-v1.js`.

## Correctif isolé
- Une seule projection d'image personnalisée `contain`, avec dégradé opaque derrière en portrait/paysage, ombrage existant au-dessus.
- Correction de la préparation sans changer les chargements visuels de zone/combat, ni l'éditeur en jeu.
- En mode portrait étroit, titre sur sa propre ligne, boutons Retour/Quitter sur la suivante.
- Aucun changement de `service-worker.js`, de ses caches, du routage Shell, de la navigation, de l'objet média auteur, du jeu, des sauvegardes, de Combat `main@34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0` ni d'Exploration `main@1553c0e8f9bab89f5c1badfa64c5d41fb75cff73`.

## Charte et gates
- Point de départ source : `ce259cf1...`; checkpoint : `checkpoint/capture-home-portrait-wallpaper-20261122`. Un lot/une branche `work/capture-home-portrait-wallpaper-fix-20261122` sur sa base immuable `work/capture-home-portrait-wallpaper-base-20261122`.
- Test `gens_capture_v2_shell_creator_20261121.test.mjs` : image une fois dans les menus + opaque, titre en portrait, préparation conservée, image de chargement inchangée.
- CI source, test navigateur réel des menus portrait/PC, puis publisher PWA séparé et preuve Pages HTTPS, sans modifier le root ou la PWA installée en place.
