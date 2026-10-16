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

## Certificat §26 et sélection de propriétaire (16 octobre 2026)

- ZIP utilisateur `c2.zip`, entrée `index.html(12).txt`, **7 715 741 octets**, blob `f56dc5bbb368b176509ab16477bd4b24dd000497` vérifié identique à la source D8 GREEN. Source certifiée.
- Candidat actif et unique du lot : `dungeonCore202ContentDensity`, IIFE byte-exacte **11 821 octets**, blob Git **`364673f3dd35bfa8be7f378152f775656c9243e2`** ; emplacement immédiatement après Core201, avant Core203 puis Core211, script classique synchrone.
- Responsabilités à préserver : encounters/pièges/énigmes/affichage densité dans Dungeon, wrappers existants `DungeonCore01.explore`, `render`, `show`, debug `dungeonDebug202`. Garder intacte la garde `authored202` (aucune densité aléatoire sur les mondes authored), vérifiée par `tests/gens_authored_core202_boundary_v11411.test.cjs`.
- Destination ciblée : `assets/gensrpg/dungeon/core202-content-density-v1.js` ; nouvel index dérivé localement **7 703 979 octets**, Git blob **`fce949665fea47a2aa2a535ede7289b06936f986`**, nette réduction **11 762 octets**. Aucun octet de JS n'est édité.
- Cross-domain : interactions limitées au runtime/éditeur de mondes Dungeon ; pas d'import dans Capture/Survie/PvP. Protéger le Bridge Tactical existant, le moteur Core01, les sauvegardes, le rendu.
- Avant GREEN : preuve index D9→D8 bit-à-bit, régression D8→D1, mise à jour manifest/runtime et test de frontière Core202, triple CI au même SHA et checkpoint §25.
- **État : propriétaire sélectionné, code NON encore publié ; D9 NON GREEN.**

## Extraction physique appliquée, gate finale non encore GREEN

- **Application contrôlée SUCCESS** : [workflow 38866855495](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38866855495). Commit runtime et sentinelles : `9dcbecc29ea2c366c8d5a2e177902df8d89c5b08`.
- Index D9 certifié par arbre Git : **7 703 979 octets**, blob `fce949665fea47a2aa2a535ede7289b06936f986`; ancien index D8 exact : **7 715 741 octets**, blob `f56dc5bbb368b176509ab16477bd4b24dd000497`.
- Script externe `assets/gensrpg/dungeon/core202-content-density-v1.js` : **11 821 octets**, blob `364673f3dd35bfa8be7f378152f775656c9243e2`. Copie byte-identique, ordre parser et sync préservés.
- Tests du workflow SUCCESS : vérification du corps et index, rollback exact D9→D8 et restaurations historiques, syntaxe Node, manifest 102 fichiers atteignables, garde `authored202`, checks owner et graphe.
- D1–D9 : **230 719 octets JS externalisés**, **230 225 octets nets retirés** d'index. La Phase 12 reste ouverte.
- **D9 NON GREEN :** triplet CI Architecture/Chromium, Firefox et Tactical requis sur le même SHA et checkpoint §25. Ne pas ouvrir D10.
