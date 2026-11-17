# Capture — univers indépendants : contrat d'autorité (17 novembre 2026)

## État et objectif
Le menu actuel « Créer un univers » ouvre en réalité un écran **Nouvelle partie** ; il ne constitue pas un univers indépendant. Un changement de libellé ne corrige pas ce problème.

L'univers historique s'appelle **Monster InvoC** (identité stable `monster-invoc`), sans déplacement des anciennes données. Les nouveaux univers nécessitent des contenus et règles isolés, et un choix explicite du modèle vide ou de la copie propriétaire.

## Responsabilités non dupliquées
- **Capture/Core Storage** : seul registre des projets (`universe-project-store-v1.mjs`) et dossiers de sauvegarde Aventure réutilisant le serializer officiel. L'accès aux données de l'ancien projet conserve exactement ses clés.
- **Labo Combat main** : propriétaire exclusif des catalogues de personnages/créatures, compétences, règles de combat et du *snapshot de projet* persistant. Aucun catalogue Combat n'est recopié dans le Shell.
- **Labo Exploration main** : propriétaire du WorldDocument, des héros et médias IndexedDB, des WorldObjects et du World Builder. Le projet doit référencer des archives officielles distinctes sans changer les ID des documents existants.
- **Capture Aventure** : règles et sauvegardes de **parties** dans le projet sélectionné, sans faire passer une partie pour un univers.
- **Shell** : navigation `GenSRPG → Monster Capture → liste des projets → projet choisi → Jouer/Éditeurs`, sans accès direct au stockage, ni iframe non autorisé, ni nouvelle autorité de jeu.

## Sécurité transitoire
La présente étape fournit un **index de projets versionné** et un adaptateur Storage pour les clés privées Aventure. Elle **ne déclare PAS les éditeurs indépendants ni l'UX multi-univers fonctionnels** : un nouveau projet reste `pending` tant que Combat, Exploration et Rules n'ont pas renvoyé des références propriétaires distinctes ; `requireReady()` refuse de l'ouvrir. C'est intentionnel : ouvrir les éditeurs globaux sous une autre étiquette partagerait des créatures, héros et paramètres.

Aucune migration automatique de sauvegarde, IndexedDB ou WorldDocument. Pas de `delete`, pas de copie implicite, pas de nouvelle bibliothèque média, pas d'ID auteur demandé dans l'UI.

## Critères d'acceptation avant fusion/fonction « terminée »
1. Dans Monster Capture, l'univers Monster InvoC existant est sélectionnable et renommable en préservant ses sauvegardes.
2. Création d'un second univers vide ou cloné avec copie explicite par les propriétaires ; deux univers A/B avec créatures, héros, capacités, paramètres, mondes et sauvegardes distincts.
3. Éditeurs natifs Combat/Exploration reçoivent et appliquent le bon identifiant projet, et leurs catalogues demeurent isolés après fermeture/rechargement et sur Pixel paysage/PC.
4. Les anciennes sauvegardes Monster InvoC restent visibles à l'identique ; aucune seconde autorité ni copie intégrale de labos dans la PWA.
5. CI source tous GREEN, PR éditeurs Lab propriétaires GREEN, publisher repin seul GREEN, artefact ≤ 900 Mio, Pages+HTTPS publics certifiés au SHA exact.
