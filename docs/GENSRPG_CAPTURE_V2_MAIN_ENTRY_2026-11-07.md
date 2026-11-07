# Capture V2 — point d'entrée GenSRPG public unique (7 novembre 2026)

## Décision du créateur
L'application principale publiée sur `main` est la **seule version demandée à tester**. Les branches de chantier, checkpoints et les avis CI restent techniques, de courte durée, et ne sont jamais présentés comme un autre jeu public. Pas de développement produit sur `gh-pages`. Combat et Exploration sont consommés depuis leurs `main` certifiés et SHAs versionnés. Aucune copie des moteurs ni des catalogues volumineux.

## START, périmètre et risques
- Base de production : `a46b1104e56cf6c60a1eae9bd4829b181e9a3c08`; checkpoint : `checkpoint/gensrpg-start-gensrpg-capture-v2-root-entry-2026-11-07`.
- Branche de contrôle : `work/gensrpg-capture-v2-root-entry-2026-11-07`; promotion sur `main` seulement après GREEN.
- Classe **C2 navigation / publication**. Propriétaire : Shell GenSRPG pour la destination et le retour, Capture V2 pour menu/Jouer/éditeurs, Combat main pour le combat et les capacités, Exploration main pour le monde.
- Invariants : Survie, Dungeon et PvP inchangés ; zéro nouvelle sauvegarde/clé/cache de gameplay ; aucune modification du gros `index.html` source ; budget de livraison 900 Mio, un seul publisher.
- La navigation du module Capture **dans le Shell public** emprunte la livraison déjà certifiée `/preview/capture-v2-pr225/`, sans créer de copie, ni démarrer V1. Son adresse physique de compatibilité reste en place pour les tests existants.
- La présence historique du code V1 dans les sources et l'existence physique du dossier `preview` ne valent **pas** migration complète du code source V2 sur le `main` courant. Ne pas décrire cette première étape comme une suppression totale de V1 : il faut retirer la dépendance et les tests historiques dans une migration propriétaire distincte et vérifiée.

## Contrôle
- RED : `tests/gens_capture_v2_root_main_entry_20261107.test.cjs` sans route, module d'entrée ni Publisher.
- GREEN demandé : même test avec destination unique, échec fermé sur route manquante, retour principal ; navigateur paysage depuis le **vrai** `_site/index.html` vers `Capture V2 → Jouer`, puis retour, sans 404 de la livraison et sans démarrer deux propriétaires.
- CI du même SHA : Pages build / Chromium / review, architecture sentinelles pertinentes, HTTPS réel + signature root/preview. Aucun GREEN ni checkpoint de fin sans ces preuves.
- Prochains chantiers distincts : #310 salle hôte, #311 équipe 1–6, #312 caméra, #313 épinglage Combat officiel ; ils sont encore DRAFT, donc exclus de cette promotion.

## Choix de publication
`main` est l'unique version publique faisant foi, avec checkpoint rollback. Les PR servent au contrôle, pas de « deuxième jeu » sur gh-pages. À terme, une migration propriétaire séparée doit transformer le sous-chemin technique V2 en module canonique interne du root, après son test intégral, et éliminer l'autorité et le chargement V1 restants.
