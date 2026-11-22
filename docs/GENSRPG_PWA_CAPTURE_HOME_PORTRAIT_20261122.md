# Publisher PWA — accueil Capture portrait, image unique (22 novembre 2026)

- Point de départ `main@9d5fd39fb469da1bc4a8d7ea1f89133711cabaf7` ; checkpoint `checkpoint/pwa-capture-wallpaper-portrait-start-20261122` ; branche `work/pwa-capture-wallpaper-portrait-publisher-20261122`.
- Le bug observé : même image `--capture-home-art` rendue 2 fois (`contain` + `cover`) et transparence laissant apparaître le vieux hub GenSRPG ; le titre du menu et le lien retour se chevauchent en portrait.
- La source Capture V2 est corrigée dans la PR #610, depuis le SHA de publication de départ `ce259cf1b3901cda85c2a4218241a82639bb4563`. Publication finale par pin **immuable du commit de fusion source** après certification.
- Correction CSS uniquement (menu Capture et préparation), conserve la transparence légère validée des boutons, la couleur et le nom du monde, l'image personnalisée locale, l'audio et les chargements plein écran. L'image n'est copiée ni réimportée ni enregistrée ailleurs ; aucun autre propriétaire de wallpaper.
- Conserve exactement Combat `main@34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0`, Exploration `main@1553c0e8f9bab89f5c1badfa64c5d41fb75cff73`, visuels `global-assets@b807389811c5a7e5236b9fdc96b7f155168d7fd7`, les correctifs PNJ/marchand/fragments/objets et les ponts/escaliers.
- Changements publisher : pin Capture V2, sentinelle physique dans `gens_capture_v2_isolated_pages_preview.test.cjs` et ce rapport. Pas de modification de `index.html` Shell root, `service-worker.js`, sauvegardes, Donjon ni Survie.
- Gates : CI source/prévisualisation PWA, tests de vraie navigation mobile portrait et paysage, budget site, provenance SHA, Pages `main` et contrôle HTTPS public obligatoire avant de dire « disponible sur PWA ».
