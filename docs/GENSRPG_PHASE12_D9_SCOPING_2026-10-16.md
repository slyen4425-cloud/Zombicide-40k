# GenSrpG — Phase 12 D9 / ouverture et source certifiée requise (16 octobre 2026)

## Gouvernance et base vérifiée

- Dernier lot GREEN : D8 Core201 Stability, SHA `dd3f127041a78b9e7539ab1735cb188557a50ccc`, checkpoint `checkpoint/gensrpg-phase12-dungeon-core201-d8-green-2026-10-16`.
- D9 §25 : checkpoint initial `checkpoint/gensrpg-start-phase12-dungeon-d9-extraction-2026-10-16` créé sur le SHA exact `dd3f127041a78b9e7539ab1735cb188557a50ccc`, avant toute modification ; branche de travail isolée `work/gensrpg-phase12-dungeon-d9-extraction-2026-10-16`.
- Triple CI du point de départ : Architecture/Chromium [38803573910](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573910), Firefox [38803573894](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573894), Tactical [38803573930](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38803573930), toutes SUCCESS au même SHA.
- Git Tree du checkpoint D8 : `index.html`, **7 715 741 octets**, Git blob **`f56dc5bbb368b176509ab16477bd4b24dd000497`**.

## Attente de la copie du grand HTML (§26)

- Permalink exact : https://github.com/slyen4425-cloud/Zombicide-40k/blob/dd3f127041a78b9e7539ab1735cb188557a50ccc/index.html
- Action demandée : télécharger `index.html` à ce permalink, le zipper si besoin et le déposer dans la conversation. Vérifier **taille ET blob Git** avant toute inspection/extraction.
- `c1.zip` et les archives précédentes sont antérieurs à D8. Pas d'utilisation comme source D9 ; ne pas consulter le gros fichier via le connecteur GitHub en boucle.
- Candidat D9, longueur du script, hash du JS, impact sur l'index et chemin destination : **non déterminés** avant réception et inspection locale du fichier D8 exact.

## Contraintes pour la suite

Un seul propriétaire Dungeon actif, responsabilités correctement bornées ; déplacer le corps JS sans retouches, script synchrone à sa position historique et tests de rollback exacts D9→D8→D7→D6→D5→D4→D3→D2→D1. Mettre à jour sentinelles et manifeste sans relâcher les garde-fous. Triple CI Architecture/Chromium, Firefox, Tactical SUCCESS sur même SHA et checkpoint D9 GREEN §25 seulement à la fin. `main` figée ; laboratoires et autres modes non modifiés.

**Statut : D9 ouvert, NON GREEN, aucun changement runtime et aucune extraction.**
