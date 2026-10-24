# GenSrpG — Phase 10 S3 : écran propriétaire de configuration PvP

Date : 12 octobre 2026.

## Base et charte

- Point de départ exact : `checkpoint/gensrpg-start-phase10-pvp-configuration-screen-s3-2026-10-12`, SHA `f467c2554a59f2ff7eaac55de3fd1976c3ba7059` (S2 GREEN).
- Branche de travail : `work/gensrpg-phase10-pvp-configuration-screen-s3-2026-10-12`.
- Module et propriétaire : exclusivement `assets/gensrpg/pvp/`; S0 reste source unique des sessions, S1 reste l'autorité `prepare`, Shell reste l'autorité navigation/Hub.

## Objectif du lot

Livrer la capacité complète de configuration **avant** la création de gameplay : identité de session, camps (deux ou plus), identifiants des participants, données de règles libres du créateur. Aucun dégât/tour/coût/action/mécanique de victoire n'est codé en dur. L'UI affiche explicitement que le duel n'est pas encore jouable.

`setup-ui-v1.js` ne s'installe jamais au chargement ; il exige `mount({container,activeModule,provider})`, et crée un seul sous-arbre DOM contenu dans le conteneur fourni. `dispose()` retire uniquement son propre sous-arbre et ses listeners. Le mode non-PvP refuse le montage et la préparation. La validation des camps/participants et la copie immutable des règles sont déléguées au propriétaire existant S0 via `GensPvpModuleLaunchV1.prepare`.

## Non-interférence

Aucune modification de `index.html`, `main`, Survie, Dungeon, Monster Capture, Tactical, Core, éditeurs, PWA, ni des laboratoires. Aucun stockage direct, observer, timer ou patch global. L'UI demeure un composant disponible mais non composé en production tant que le raccord réel au Hub n'est pas validé selon le §26.

## Critères GREEN S3

- Tests du vrai cycle de données avec les modules session et provider existants ; configurations créateur distinctes ; refus JSON absent ou invalide ; refus hors PvP ; nettoyage et autres modules inchangés.
- Cartographie des scripts : la nouvelle UI est physiquement présente, explicitement **inaccessible en production**.
- Triple CI Architecture/Chromium, Firefox et Tactical sur même SHA, documentation du point de reprise, checkpoint S3 GREEN ensuite.
- Ne pas annoncer que le PvP est jouable. Le futur rattachement de l'écran au Shell et son réglage accessible au joueur nécessitent le vrai parcours navigateur/mobile et, si `index.html` est concerné, le ZIP exact §26.

`main` demeure gelé au SHA `e8681f9823573ced8aec59c8ddc47a72b02bc663`.
