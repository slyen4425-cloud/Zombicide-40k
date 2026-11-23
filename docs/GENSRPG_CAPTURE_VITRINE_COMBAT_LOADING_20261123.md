# Monster InvoC — Vitrine officielle et chargement Combat — 23 novembre 2026

## Autorité et isolation

- Publisher unique : `slyen4425-cloud/Zombicide-40k` `main`, publication dans `/preview/capture-v2-pr225/`.
- Sources Capture épinglées (sans fusion de branches divergentes) : `1498fb6e525c5adc430a223301c6deedc36d261e`.
- Visuels immuables et exacts : `global-assets@1d138d8c5abc5b8c300774d5afce6d67ec6e9c35`.
- Pas de duplication de bibliothèques ni de moteur, pas de suppression du fond ancien, aucune altération du gameplay, des règles, du réseau ou des sauvegardes.

## Correctifs

1. Si un univers ne dispose ni de fond personnel ni de choix officiel explicite, présenter les trois fonds officiels par défaut, première image Polocendre. Ceci inclut l'entrée initiale et la liste des univers.
2. Rotation à certaines ouvertures de menus et fenêtres ; jamais dans une partie en cours et jamais pour une image choisie explicitement. Un bouton dans le Créateur permet d'activer la rotation même si un fond personnel existe, sans effacer ce fichier.
3. Transition Combat : l'Exploration actuelle n'accepte que des URL `blob:` de la même origine en `loadingArtCombat`. Les quatre illustrations officielles sont converties en blobs temporaires, une fois au lancement de la partie, avec réutilisation de la bibliothèque officielle. Le source et les blobs personnels sont conservés.
4. Liste transmise à Exploration limitée à 12 visuels, l'image officielle historique restant en première position ; la galerie personnelle n'est pas effacée.

## Vérification

- Exécuter les tests de source `gens_capture_default_vitrine_combat_loading_20261123.test.mjs` sur le commit épinglé.
- Exécuter le build physique GitHub Pages, les tests d'assets existants, le contrôle de poids des sites et les tests navigateur PC/mobile.
- Contrôler le commit HTTPS publié (SHA exact) avant de déclarer GREEN.
- Vérification manuelle recommandée : Android paysage, ouvrir Jouer, entrer sur une carte et déclencher un combat réel (fond d'art visible au-dessus de l'arène jusqu'à READY).

Checkpoint avant : `checkpoint/capture-vitrine-combat-before-20261123`.
