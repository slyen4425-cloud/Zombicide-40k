# PWA — raccord du Labo Exploration : ponts et escaliers nettoyés (22 novembre 2026)

## Périmètre et autorité
- Source PWA main avant chantier : `53b6c0ff2810e9dc1c86c7418448ebd102899090`.
- Source Capture V2 immuable précédente : `4edf9d12195078247af7a7e12e94e196f8bbaa57`.
- Source Capture V2 candidate sur branche dédiée : `915c14986156fac14dcf84b132585871ca21b876`.
- Laboratoire Exploration propriétaire, `main@de86b04f35f96df3783f1f953c7f138bc44a28f8`, CI 45012201761, Pages 45012201767 (GREEN).
- Référence Combat volontairement inchangée : `d7eeae0fdb13454cf5a9ae18a0676e6784e425e5`.
- Autorités : Exploration fournit les visuels et IDs ; Capture V2 consomme un pin immuable ; un seul publisher PWA ; aucun dépôt Labo modifié.

## Intervention
- Réépingler seulement Exploration dans le manifeste source Capture V2, sans copier d'assets ni de moteur dans GenSRPG.
- Ajouter l'autorisation explicite du nouveau SHA dans la certification stricte du renderer, dont le Git blob officiel `6c101756bdf9c58a9ae8cf3fe104e49575145748` est **inchangé** entre l'ancien et le nouveau `main`.
- La PWA livre les 8 nouveaux ponts (wood_rustic/castle) et les 4 vues terre/rondins : `front`, `oblique`, `side` (profil B, ID historique), `side_alt` (profil A, seul nouvel ID).
- Aucune modification de `index.html`, service-worker source, sauvegarde, collisions, gameplay Combat ou autres modules. Les assets de transferts ZIP ne sont pas publiés.

## Barrières avant GREEN
1. Vérifier ancêtre de `main` officiel et CI de son SHA exact ; suivre seulement ces références.
2. Exécuter les tests du site PWA assemblé, dont les SHA256 des **12 fichiers réels** transportés dans `vendor/exploration-lab`, leurs tailles et leurs ID.
3. CI complète sur la PR puis sur `main`, aucun job rouge ; budget Pages <900 Mio, pas de deuxième bibliothèque.
4. Publication du même SHA sur GitHub Pages et contrôle HTTPS de la provenance et des fichiers.
5. Vérification sur PWA Android installée à effectuer manuellement, sans vider IndexedDB ni effacer les sauvegardes.

## Retour arrière
Le pin PWA antérieur et la source Capture précédente restent conservés dans Git. Aucune suppression des anciens assets de leur historique propriétaire.
