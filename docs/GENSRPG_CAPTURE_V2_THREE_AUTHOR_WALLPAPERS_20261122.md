# Monster InvoC — trois illustrations approuvées : accueil et chargements (22/11/2026)

Chantier isolé de la source **Capture V2** à partir du candidat `58c16831ddd500e534bfb0e673b538cf8072b3d7`. Aucun moteur de jeu, objet, sauvegarde, sprite, Donjon ni Survie modifié.

- Source binaire unique: Combat `global-assets`, avec trois PNG déposés par l'auteur (Raiiven, Polocendre, Gorice/Veldra).
- Un seul catalogue de présentation `shell-official-wallpapers-v1.mjs`, par chemins et SHA Git exacts ; aucun binaire embarqué dans le code source Capture.
- Le **Créateur > Fond de l'application** propose les trois fonds. Le choix est conservé dans la médiathèque d'univers existante; la sélection d'un fond importé ou l'ancien fond reste possible. Aucune écriture de sauvegarde partie.
- Le **Créateur > Illustrations de chargement** montre les trois visuels officiels en lecture seule + les visuels importés déjà stockés ; pas de doublons dans IndexedDB. Les trois visuels officiels participent à la rotation/fondu du chargement natif et des chargements lancement/zone/combat.
- Pour la publication, le publisher unique copie **uniquement** les trois PNG du SHA visuel immuable vérifié vers `vendor/combat-lab/assets/library/capture/`. Il doit vérifier les blobs Git et la taille exacte. Les préchargements doivent rester de même origine et le contrat 20:9 (image complète) préservé.
- Critères GREEN: tests module/catalogue, CI source, CI publisher, tests navigateur mobile portrait/paysage et PC, budget non compressé, preuve du commit HTTPS. Sans CI/HTTPS, ne pas appeler la PWA publiée.
