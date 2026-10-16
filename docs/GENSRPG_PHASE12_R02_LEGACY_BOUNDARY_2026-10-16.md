# GenSrpG — Phase 12 R02 : sortie physique du monolithe historique (16 octobre 2026)

## Source et gouvernance

- Source exacte utilisateur §26 : c5.zip / index.html(14).txt, 6 969 593 octets, Git blob caf31c121d926b7b76b9bb05688fab8f2839814e, égal à R01 GREEN SHA 1b0fa3a718059242507d3e95de45033bba57ea24.
- Checkpoint de départ §25 : checkpoint/gensrpg-start-phase12-r02-legacy-multidomain-boundary-2026-10-16 sur SHA R01 GREEN. Branche exclusive : work/gensrpg-phase12-r02-legacy-multidomain-boundary-2026-10-16.
- Aucun changement du main gelé, des laboratoires combat/exploration, ni des règles de jeu.

## Caractérisation précise

- Ancien script anonyme mixte : 5 364 441 octets, Git blob 181ec13091f7dfeb5dde173af99dbe1aeecb07c2, ~14 828 lignes et plus de 1 000 déclarations de fonctions.
- Cinq images encodées, total 4 100 280 caractères base64 : PNG de fiche héros (3 587 780 caractères, 2 690 833 octets, 1086×1448), WebP carte équipement (136 656 caractères, 102 492 octets, 820×1161), trois WebP skins d'ennemis (125 144, 142 372, 108 328 caractères).
- Les autres ~1,26 Mo contiennent logique Survie, Dungeon, Capture, Shell/UI, stockage et sauvegardes. Le script n'est PAS un bootstrap minimal ni un propriétaire métier unique.

## Application réelle R02

- Workflow contrôlé GitHub Actions 38913046289 : SUCCESS ; commit applicatif c181534ece5a4f930bad474f8a190be8e3e5c935.
- Copie strictement byte-identique du JS vers assets/gensrpg/legacy/phase12-historical-multidomain-bridge-v1.js. Balise script externe CLASSIQUE et synchrone à la position parser initiale.
- Index R02 réel : 1 605 224 octets, blob f6d3eb2a1cc87046d88e678c3bf67f6877baa887, soit 5 364 369 octets nets de moins que R01. Retour exact R02→R01 vérifié, Node JS syntaxe PASS.
- Cache PWA précharge le nouvel JS et la clé cache est renouvelée. Manifest de propriétaires : domaine LEGACY de dette transitoire. Ce classement n'attribue AUCUNE autorité métier commune à Survie/Dungeon/Capture.
- Le code logique de l'ancien monolithe et ses cinq URI images restent identiques : découpe sémantique par domaine à effectuer en R03–R07, sans prétendre que l'extraction physique seule suffit à la Phase12 EXIT.

## Gates restants avant GREEN

- Architecture/Chromium : en cours de correction de tests qui lisent les anciens blocs inline directement ; reconstitution du contenu historique exacte en helpers sans modifier le runtime.
- Firefox et Tactical : succès vérifiés au commit 523af23, mais un triple SUCCESS sur un SEUL SHA final reste obligatoire.
- Checkpoint final R02 §25 interdit jusqu'à triple CI; avant publication main, vérifier chargement/installation PWA et cache offline Android, Survie, Dungeon, Capture, PvP, stockage.
- Ne pas entamer R03 avant R02 GREEN. Date du dernier statut : 16 octobre 2026.
