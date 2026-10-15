# Phase 12 D7 — Extraction Dungeon Core214 Single Authority (15 octobre 2026)

## Ouverture contrôlée (§25–26)

- Base triple CI SUCCESS : `ac1e3c8be76732bdc7f389d0d9258cf283d65a84` (Architecture 38757922080, Firefox 38757921764, Tactical 38757921660).
- Checkpoint de départ exact : `checkpoint/gensrpg-start-phase12-dungeon-core214-d7-extraction-2026-10-15`.
- Branche exclusive : `work/gensrpg-phase12-dungeon-core214-d7-extraction-2026-10-15`.
- ZIP utilisateur `b5.zip`, entrée `index.html(10).txt`, 7 745 413 octets, Git blob `b5271e44dc4c14834a7725a869fb3c12386f2437` = index exact D6.
- Bloc actif `<script id="dungeonCore214SingleAuthority">` ; corps JS de 15 795 octets / blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88`, IIFE classique Dungeon sans intervalle, observer global ou propagation bloquante.
- Déplacement prévisionnel sans modifier un octet du JS vers `assets/gensrpg/dungeon/core214-single-authority-v1.js`, chargement synchrone, même position parser. Index attendu 7 729 678 octets / blob `6e1cb9b82126409b633306b0e77a7e45badb0f79`.
- Tests verrouillés : JS syntaxe, empreintes exactes, rollback D7→D6→D5→D4→D3→D2→D1, graphe runtime, propriétaires, effets historiques, frontières inter-modules et triple CI au même SHA.
- **D7 NON GREEN** tant que la CI complète n'a pas validé le commit runtime. Production `main` et laboratoires inchangés.


## Application physique D7 — publiée, CI finale en attente

- [Workflow d'application contrôlée 38761613784](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/38761613784) : SUCCESS.
- Commit moteur : [`821d2c3f91c2f238fc223c8dd73ff1cebac6181b`](https://github.com/slyen4425-cloud/Zombicide-40k/commit/821d2c3f91c2f238fc223c8dd73ff1cebac6181b).
- Extraction physique vérifiée : 15 795 octets du propriétaire `dungeonCore214SingleAuthority` déplacés sans transformation vers `assets/gensrpg/dungeon/core214-single-authority-v1.js`.
- Empreintes conservées : `index.html` 7 729 678 octets, blob `6e1cb9b82126409b633306b0e77a7e45badb0f79` ; JS externalisé blob `72481ac3ee62bc67f6c0646eb724baf4a87a2f88`.
- Preuves du workflow : Node syntaxe, D7→D6→D5→D4→D3→D2→D1 byte-exact, graphe des modules (100 fichiers atteignables), owner manifest, dernières autorités inline, test Capture historique, barrières effets globaux.
- Sentinelle D7 ajoutée à `.github/workflows/gensrpg-architecture-sentinels.yml` par mise à jour GitHub distincte : le jeton Actions ne peut pas modifier lui-même des fichiers de workflows.
- **NON GREEN** avant triple CI Architecture/Chromium, Firefox et Tactical SUCCESS sur le même SHA final, puis checkpoint §25.
