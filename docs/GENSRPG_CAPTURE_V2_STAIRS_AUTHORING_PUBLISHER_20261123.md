# PWA — éditeur d’escaliers ajustables, 23/11/2026

- Publisher START: main `f98545124be642116f7b9406ac116f6b0b994c24`, déjà publié avec Navigation Autoriser, Vipfer, HUD et trois fonds.
- Source Capture issue du pin préexistant `fd3c0a84e8b2a9df75c02ab59daa1b9190603e8a` : candidate `61dac2f6b2b061f297a982ea9da156cd8233c0ae`.
- Exploration canonique PR #540, main `35dbe475e53abcc7ba8f4c5ee3be972390232584`, tests PR réussis ; CI main https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/45266578823.
- Combat officiel conservé `0543103891b5777fff108cb12a1ae55a519544d9`; visuels officiels immuables conservés `1d138d8c5abc5b8c300774d5afce6d67ec6e9c35`.
- Contrat : la **même** WorldObject Stair reçoit son pied, son sommet et sa largeur de passage ; collision native, annulation, export/import ; profil automatique historique en absence de réglage.
- Le Publisher n’altère que le pin, les sentinelles ciblées et ce journal : aucune copie de motorisation, pas de changement SW, d’assets, d’autres modes ni de sauvegardes.
- Interdit de fusionner avant CI Exploration main GREEN, CI publisher, browser, budget et HTTPS post-fusion.
