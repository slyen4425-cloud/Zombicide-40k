# GenSRPG — Mise à jour PWA visible sur appareil installé (7 novembre 2026)

## Bug utilisateur reproduit
Le service worker est versionné par SHA depuis la PR #304, mais la page publique `index.html` compare encore un `<meta name="z40k-app-version">` et une constante `Z40K_APP_VERSION` tous deux figés à `16.168-DUNGEON-HERO-ITEM-ASSETS`. L'ancien client ne voit jamais de différence et masque le bandeau « Nouvelle version disponible ».

## Responsabilités conservées
- Un seul publisher GitHub Pages et un seul auteur du cache : le service worker racine existant.
- `tools/version_pwa_release_worker.mjs` expose l'unique calcul du SHA immutable pour les marqueurs root; `tools/version_pwa_release_shell.mjs` ne fait que lire/écrire le HTML final construit.
- La source `index.html` demeure byte-identique dans Git. Deux valeurs, et seulement ces deux valeurs, changent dans `_site/index.html` : le meta HTML et la constante JavaScript existante.
- Les PWA preview, l'IndexedDB, les autres modes, le moteur Combat/Exploration, les identités manifestes et les sauvegardes sont intacts.

## Preuves requises
TDD RED → GREEN, tests sur les deux marqueurs, présentation du bandeau d'une ancienne version, tests sur le site assemblé, intégrité root/preview, CI de la branche HEAD exacte et HTTPS post-main avec les deux valeurs correspondant au SHA publié.

## Attention
La prévisualisation Capture V2 conserve son chemin isolé et son identité PWA : il faudra un raccord produit à part avant de la présenter comme le mode Jouer de la racine.